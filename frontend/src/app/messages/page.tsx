'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthGuard from '@/components/AuthGuard';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { ChatConversation, ChatMessage } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Clock,
  Search,
  Check,
  CheckCheck,
  Sparkles,
  MapPin,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

function MessagesContent() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const conversationIdParam = searchParams.get('conversationId');

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(conversationIdParam);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Quick meeting spot suggestions for campus peers
  const quickSuggestions = [
    'Is this item still available?',
    'Can we meet at the PICT Library?',
    'Are you free near the Canteen?',
    'Is the price negotiable?',
    'When are you free for inspection?',
  ];

  // Fetch list of user conversations
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const data = await api.getConversations();
      setConversations(data);

      // If activeConvId is not set and we have conversations, pick the first one on desktop
      if (!activeConvId && data.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
        setActiveConvId(data[0].id);
      }
    } catch (err: any) {
      if (!silent) showError(err.message || 'Failed to load conversations');
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  // Fetch messages for active conversation
  const fetchActiveMessages = async (silent = false) => {
    if (!activeConvId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const data = await api.getMessages(activeConvId);
      setMessages(data);
    } catch (err: any) {
      if (!silent) showError(err.message || 'Failed to load messages');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Sync if query parameter changed
  useEffect(() => {
    if (conversationIdParam) {
      setActiveConvId(conversationIdParam);
    }
  }, [conversationIdParam]);

  // When active conversation changes, load its messages
  useEffect(() => {
    if (activeConvId) {
      fetchActiveMessages(false);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  // Periodic polling for live chat updates every 3.5 seconds
  useEffect(() => {
    if (!activeConvId) return;

    const interval = setInterval(() => {
      fetchActiveMessages(true);
      fetchConversations(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeConvId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoad.current ? 'auto' : 'smooth' });
      isInitialLoad.current = false;
    }
  }, [messages]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputMessage.trim();
    if (!content || !activeConvId || sending) return;

    setSending(true);
    setInputMessage('');
    try {
      const sentMsg = await api.sendMessage(activeConvId, content);
      setMessages((prev) => [...prev, sentMsg]);
      // Refresh conversation preview
      fetchConversations(true);
    } catch (err: any) {
      showError(err.message || 'Failed to send message');
      setInputMessage(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  // Quick suggestion click
  const handleSelectSuggestion = (text: string) => {
    setInputMessage(text);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.listing?.title?.toLowerCase().includes(q) ||
      c.other_user?.display_name?.toLowerCase().includes(q) ||
      c.last_message?.content?.toLowerCase().includes(q)
    );
  });

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AuthGuard>
          {/* Page Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Campus Messenger
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Direct, encrypted peer communication for item inquiries and campus meetups
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                fetchConversations();
                if (activeConvId) fetchActiveMessages();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs shadow-2xs transition"
              title="Refresh messages"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Messenger Dual-Panel Container */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row h-[75vh] min-h-[550px]">
            {/* LEFT PANEL: Conversation list */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-slate-200/80 flex flex-col bg-slate-50/50 ${
                activeConvId ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Search bar */}
              <div className="p-3.5 border-b border-slate-200/80 bg-white">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student or item..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Conversations list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {loadingConversations ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
                    <p>Loading conversations...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">No conversations yet</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Start a chat with a seller from any listing page!
                      </p>
                    </div>
                    <Link
                      href="/marketplace"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Browse Items
                    </Link>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = conv.id === activeConvId;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setActiveConvId(conv.id);
                          router.push(`/messages?conversationId=${conv.id}`, { scroll: false });
                        }}
                        className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/80 border-r-4 border-indigo-600'
                            : 'hover:bg-white bg-transparent'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {conv.other_user?.display_name?.substring(0, 2).toUpperCase() || 'ST'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {conv.other_user?.display_name || 'Student Peer'}
                            </span>
                            {conv.last_message && (
                              <span className="text-[10px] text-slate-400 font-medium ml-1 flex-shrink-0">
                                {formatMessageTime(conv.last_message.created_at)}
                              </span>
                            )}
                          </div>

                          {/* Item preview header */}
                          <div className="flex items-center gap-1 text-[11px] text-indigo-700 font-semibold truncate mb-1">
                            <ShoppingBag className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{conv.listing?.title}</span>
                            <span className="text-slate-400 font-mono text-[10px] ml-auto">
                              ₹{conv.listing?.price}
                            </span>
                          </div>

                          {/* Last message preview */}
                          <p className="text-xs text-slate-500 truncate">
                            {conv.last_message
                              ? (conv.last_message.sender_id === user?.id ? 'You: ' : '') + conv.last_message.content
                              : 'Chat initiated — say hi!'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANEL: Chat Thread */}
            <div
              className={`flex-1 flex flex-col bg-white ${
                !activeConvId ? 'hidden md:flex' : 'flex'
              }`}
            >
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3.5 border-b border-slate-200/90 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mobile back button */}
                      <button
                        onClick={() => setActiveConvId(null)}
                        className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-600"
                        title="Back to inbox"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-2xs flex-shrink-0">
                        {activeConversation.other_user?.display_name?.substring(0, 2).toUpperCase() || 'ST'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {activeConversation.other_user?.display_name}
                          </span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100 flex-shrink-0">
                            {activeConversation.other_user?.campus_name || 'PICT Student'}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online Campus Peer
                        </span>
                      </div>
                    </div>

                    {/* Listing thumbnail & link */}
                    {activeConversation.listing && (
                      <Link
                        href={`/listing/${activeConversation.listing.id}`}
                        target="_blank"
                        className="flex items-center gap-2.5 p-2 rounded-2xl border border-slate-200/80 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/50 transition flex-shrink-0 max-w-[200px] sm:max-w-xs"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-800 truncate">
                            {activeConversation.listing.title}
                          </p>
                          <p className="text-[10px] text-indigo-600 font-mono font-bold">
                            ₹{activeConversation.listing.price} &bull; View Item &rarr;
                          </p>
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Campus Meetup Safety Reminder banner */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/60 px-4 py-2 flex items-center gap-2 text-xs text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span className="text-[11px] font-medium leading-tight">
                      <strong>Campus Safe Meetup:</strong> Always inspect goods in broad daylight at campus spots (PICT Library, Canteen). Do not send advance wire payments.
                    </span>
                  </div>

                  {/* Message Thread Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                    {loadingMessages ? (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
                        <p>Loading conversation messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <p className="text-xs text-slate-500">
                          No messages in this chat yet. Start the conversation below!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                                isMe
                                  ? 'bg-indigo-600 text-white rounded-br-xs'
                                  : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-line leading-relaxed font-normal">
                                {msg.content}
                              </p>
                            </div>
                            <div
                              className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 ${
                                isMe ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span>{formatMessageTime(msg.created_at)}</span>
                              {isMe && (
                                <CheckCheck className="w-3.5 h-3.5 text-indigo-500 ml-0.5" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Campus Suggestions Chips */}
                  <div className="p-2 border-t border-slate-100 bg-white overflow-x-auto flex items-center gap-1.5 scrollbar-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 flex-shrink-0">
                      Quick Chips:
                    </span>
                    {quickSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60 transition whitespace-nowrap flex-shrink-0"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  {/* Message Input Box */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 border-t border-slate-200/90 bg-white flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message or meetup spot... (Press Enter to send)"
                      className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || sending}
                      className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-100 transition"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Your Campus Exchange Messages</h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Select a conversation on the left to chat with peers, coordinate campus meetups, and ask item questions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </AuthGuard>
      </main>

      <Footer />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Loading Campus Messenger...</p>
          </div>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
