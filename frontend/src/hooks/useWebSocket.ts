'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabaseClient';

type WebSocketEventHandler = (data: any) => void;

/**
 * useWebSocket hook backed by Supabase Realtime PostgreSQL Change Subscriptions.
 * 
 * Vercel serverless functions do not sustain persistent WebSocket connections.
 * This hook preserves the exact { isConnected, subscribe } interface while delegating
 * real-time event delivery directly to Supabase Realtime channels on `notifications`
 * and `contact_requests` tables, protected by RLS.
 */
export function useWebSocket() {
  const { user } = useAuth();
  const handlersRef = useRef<Map<string, Set<WebSocketEventHandler>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  const subscribe = useCallback((eventType: string, handler: WebSocketEventHandler) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler);

    return () => {
      handlersRef.current.get(eventType)?.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user || !user.id) {
      setIsConnected(false);
      return;
    }

    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (!hasSupabase) {
      // Local fallback / development mock mode
      setIsConnected(true);
      return;
    }

    // Subscribe to Supabase Realtime channel for this user
    const channelName = `realtime-user-${user.id}`;
    const channel = supabase
      .channel(channelName)
      // 1. Listen for new notifications intended for this user
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (newNotif && newNotif.type) {
            const handlers = handlersRef.current.get(newNotif.type);
            if (handlers) {
              handlers.forEach((fn) => fn(newNotif.data || newNotif));
            }
          }
        }
      )
      // 2. Listen for incoming contact requests where this user is the seller
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_requests',
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          const req = payload.new as any;
          const handlers = handlersRef.current.get('new_contact_request');
          if (handlers && req) {
            const formatted = {
              request_id: req.id,
              listing_id: req.listing_id,
              listing_title: req.listing_title || 'Campus Item',
              buyer_name: req.buyer_name || 'Campus Student',
              buyer_campus: req.buyer_campus,
              buyer_badges: req.buyer_badges || ['Verified Student'],
              message: req.message,
              created_at: req.created_at || new Date().toISOString(),
            };
            handlers.forEach((fn) => fn(formatted));
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user]);

  return { isConnected, subscribe };
}
