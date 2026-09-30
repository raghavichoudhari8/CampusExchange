'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

type WebSocketEventHandler = (data: any) => void;

export function useWebSocket() {
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<WebSocketEventHandler>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<any>(null);

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
    const token = localStorage.getItem('campusswap_token');
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws';
    const connect = () => {
      try {
        const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            if (event.data === 'pong') return;
            const message = JSON.parse(event.data);
            const { type, data } = message;
            if (type && handlersRef.current.has(type)) {
              handlersRef.current.get(type)!.forEach((fn) => fn(data));
            }
          } catch (e) {
            // ignore non-json keepalives
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Auto-reconnect after 3s
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    };

    connect();

    // Heartbeat ping every 25 seconds
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send('ping');
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  return { isConnected, subscribe };
}
