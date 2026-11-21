import React, { useState, useRef, useEffect } from 'react';
import { Place, ChatMessage, Journey, CrowdAlternativeCard, ItineraryPlan } from '../types';
import { apiUrl } from '../config';
import { JourneyDisplay } from './JourneyDisplay';
import { PlaceCard } from './PlaceCard';
import { MarkdownMessage } from './MarkdownMessage';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  Users, 
  Trash2, 
  Cpu, 
  Plus, 
  Search, 
  Pin, 
  MessageSquare, 
  ArrowDown, 
  Edit2, 
  StopCircle, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface ConversationItem {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  archived: boolean;
  pinned: boolean;
  preview: string;
  message_count: number;
}

interface HanaWorkspaceProps {
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onItineraryUpdated?: (itinerary: ItineraryPlan) => void;
  onProfileUpdated?: (profile: any) => void;
  activeModel?: string;
  externalPrompt?: string;
}

export const HanaWorkspace: React.FC<HanaWorkspaceProps> = ({
  currentSessionId,
  onSelectSession,
  onItineraryUpdated,
  onProfileUpdated,
  activeModel = 'gemini-2.0-flash',
  externalPrompt
}) => {
  const { t } = useTranslation();

  // Conversation List State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Active Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastExternalPromptRef = useRef<string | undefined>(undefined);

  // 1. Fetch Conversations List
  const fetchConversations = async () => {
    try {
      const url = searchQuery
        ? apiUrl(`/api/v1/conversations?query=${encodeURIComponent(searchQuery)}`)
        : apiUrl('/api/v1/conversations');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchConversations();
  }, [searchQuery, currentSessionId]);

  // 2. Load Messages for Active Conversation
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(apiUrl(`/api/v1/conversations/${currentSessionId}/messages`));
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            return;
          }
        }
      } catch (_) {}

      // Default welcome if no existing messages
      setMessages([
        {
          id: 'welcome',
          sender: 'hana',
          text: t('hana_welcome', "Konnichiwa! I am Hana (ハナ), your AI travel companion for Mount Fuji and the Fuji Five Lakes. I can answer any general question (including Japanese culture, machine learning, technology, translations, and regional weather) or generate personalized multi-day itineraries with verified public transport schedules. How can I assist you today?"),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    };

    loadMessages();
  }, [currentSessionId]);

  // 3. Scroll Management
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages, isStreaming]);

  // 4. External Prompt Triggers
  useEffect(() => {
    if (externalPrompt && externalPrompt !== lastExternalPromptRef.current && !isStreaming) {
      lastExternalPromptRef.current = externalPrompt;
      sendMessage(externalPrompt);
    }
  }, [externalPrompt]);

  // 5. Send Message via Backend SSE
  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isStreaming) return;

    setLastUserPrompt(textToSend);
    const userMsgId = `user_${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    const hanaMsgId = `hana_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: hanaMsgId,
        sender: 'hana',
        text: '',
        places: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      let response = await fetch(apiUrl('/api/v1/chat/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          message: textToSend
        }),
        signal: abortCtrl.signal
      });

      if (!response.ok || !response.body) {
        response = await fetch(apiUrl('/api/ai/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: currentSessionId,
            message: textToSend
          }),
          signal: abortCtrl.signal
        });
      }

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error ${response.status}: Failed to establish AI stream`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // Process any remaining buffered text
          if (buffer.trim()) {
            parseEventBlock(buffer, hanaMsgId);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;
          parseEventBlock(eventBlock, hanaMsgId);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === hanaMsgId
              ? {
                  ...m,
                  isError: true,
                  errorCode: 'NETWORK_ERROR',
                  errorMessage: `Connection failed: ${err.message || 'Unable to communicate with the backend server.'}`,
                  text: m.text ? m.text : ''
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      // Post-stream empty response check
      setMessages((prev) =>
        prev.map((m) => {
          if (
            m.id === hanaMsgId &&
            !m.text.trim() &&
            !m.isError &&
            (!m.places || m.places.length === 0) &&
            (!m.journeys || m.journeys.length === 0)
          ) {
            return {
              ...m,
              isError: true,
              errorCode: 'EMPTY_RESPONSE',
              errorMessage:
                'Hana was unable to complete an answer. Please check your GEMINI_API_KEY in FujiNova/.env, or click Retry below.'
            };
          }
          return m;
        })
      );
      fetchConversations();
    }
  };

  // Helper: Parse an individual SSE event block with multiline data support
  const parseEventBlock = (eventBlock: string, hanaMsgId: string) => {
    const lines = eventBlock.split(/\r?\n/);
    let eventType = 'message';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        dataLines.push(line.slice(6));
      }
    }

    const eventData = dataLines.join('\n');
    if (!eventData.trim()) return;

    if (eventType === 'token') {
      try {
        const parsed = JSON.parse(eventData);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === hanaMsgId ? { ...m, text: m.text + parsed.token } : m
          )
        );
      } catch (_) {}
    } else if (eventType === 'itinerary') {
      try {
        const itineraryData: ItineraryPlan = JSON.parse(eventData);
        if (onItineraryUpdated) onItineraryUpdated(itineraryData);
      } catch (_) {}
    } else if (eventType === 'places') {
      try {
        const parsed = JSON.parse(eventData);
        const places: Place[] = Array.isArray(parsed) ? parsed : (parsed.places || []);
        const response_type = Array.isArray(parsed) ? undefined : parsed.response_type;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === hanaMsgId ? { ...m, places, response_type } : m
          )
        );
      } catch (_) {}
    } else if (eventType === 'transit') {
      try {
        const journeys: Journey[] = JSON.parse(eventData);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === hanaMsgId ? { ...m, journeys } : m
          )
        );
      } catch (_) {}
    } else if (eventType === 'crowd_alternatives') {
      try {
        const crowd_alternatives: CrowdAlternativeCard[] = JSON.parse(eventData);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === hanaMsgId ? { ...m, crowd_alternatives } : m
          )
        );
      } catch (_) {}
    } else if (eventType === 'error') {
      try {
        const errorData = JSON.parse(eventData);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === hanaMsgId
              ? {
                  ...m,
                  isError: true,
                  errorCode: errorData.code || 'AI_ERROR',
                  errorMessage: errorData.error || 'An error occurred during response generation.',
                  errorDetail: errorData.detail
                }
              : m
          )
        );
      } catch (_) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === hanaMsgId
              ? {
                  ...m,
                  isError: true,
                  errorCode: 'SSE_ERROR',
                  errorMessage: eventData || 'An unexpected error occurred.'
                }
              : m
          )
        );
      }
    } else if (eventType === 'done') {
      try {
        const doneData = JSON.parse(eventData);
        if (doneData.response_type) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === hanaMsgId ? { ...m, response_type: doneData.response_type } : m
            )
          );
        }
        if (onProfileUpdated && doneData.profile) onProfileUpdated(doneData.profile);
        fetchConversations();
      } catch (_) {}
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleNewConversation = async () => {
    const newId = `fn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      await fetch(apiUrl('/api/v1/conversations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: newId, title: 'New Conversation' })
      });
    } catch (_) {}
    onSelectSession(newId);
  };

  const handleTogglePin = async (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(apiUrl(`/api/v1/conversations/${conv.conversation_id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !conv.pinned })
      });
      fetchConversations();
    } catch (_) {}
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(apiUrl(`/api/v1/conversations/${convId}`), {
        method: 'DELETE'
      });
      if (convId === currentSessionId) {
        handleNewConversation();
      } else {
        fetchConversations();
      }
    } catch (_) {}
  };

  const handleSaveTitle = async (convId: string) => {
    if (!editTitle.trim()) {
      setEditingConvId(null);
      return;
    }
    try {
      await fetch(apiUrl(`/api/v1/conversations/${convId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() })
      });
      setEditingConvId(null);
      fetchConversations();
    } catch (_) {}
  };

  return (
    <div className="flex h-full w-full bg-[#F7EFE5] text-[#29252B] overflow-hidden select-text">
      {/* 1. Left Persistent Conversation History Sidebar - Sakura Garden Warm Ivory */}
      <aside className="w-64 border-r border-[#EAE0D0] bg-[#FAF6F0] flex flex-col h-full shrink-0 hidden md:flex">
        {/* Sidebar Header */}
        <div className="p-3 border-b border-[#EAE0D0] space-y-2">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#C66B4E] hover:bg-[#B2583D] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('hana_new_chat', 'New Journey Chat')}</span>
          </button>

          {/* Search conversations */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8A808F] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('hana_search_history', 'Search chat history...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#EAE0D0] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#29252B] placeholder-[#8A808F] focus:outline-none focus:border-[#C66B4E] shadow-2xs"
            />
          </div>
        </div>

        {/* Conversation List with independent scrolling */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#8A808F]">
              No conversations found.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.conversation_id === currentSessionId;
              const isEditing = editingConvId === conv.conversation_id;

              return (
                <div
                  key={conv.conversation_id}
                  onClick={() => onSelectSession(conv.conversation_id)}
                  className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-white border-l-4 border-l-[#C66B4E] border border-[#EAE0D0] text-[#29252B] shadow-xs'
                      : 'hover:bg-[#F3ECE1] text-[#5A525E] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${conv.pinned ? 'text-[#C66B4E]' : 'text-[#8A808F]'}`} />
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(conv.conversation_id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(conv.conversation_id)}
                        autoFocus
                        className="bg-white border border-[#C66B4E] px-1 py-0.5 rounded text-[#29252B] text-xs w-full focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="truncate">
                        <span className="font-semibold block truncate leading-tight">
                          {conv.title}
                        </span>
                        {conv.preview && (
                          <span className="text-[10px] text-[#8A808F] block truncate">
                            {conv.preview}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                    <button
                      onClick={(e) => handleTogglePin(conv, e)}
                      title={conv.pinned ? 'Unpin' : 'Pin conversation'}
                      className={`p-1 rounded hover:bg-[#FAF6F0] ${conv.pinned ? 'text-[#C66B4E]' : 'text-[#8A808F]'}`}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingConvId(conv.conversation_id);
                        setEditTitle(conv.title);
                      }}
                      title="Rename"
                      className="p-1 text-[#8A808F] hover:text-[#29252B] hover:bg-[#FAF6F0] rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.conversation_id, e)}
                      title="Delete"
                      className="p-1 text-[#8A808F] hover:text-rose-500 hover:bg-[#FAF6F0] rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Main Conversation Workspace */}
      <main className="flex-1 flex flex-col h-full bg-[#F7EFE5] relative min-w-0">
        {/* Fixed Header */}
        <div className="p-3 border-b border-[#EAE0D0] bg-[#FAF6F0]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10 text-[#29252B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C66B4E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              ハ
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#29252B] flex items-center gap-1.5">
                <span>Guide Hana (ハナ)</span>
                <span className="w-2 h-2 rounded-full bg-[#789477] inline-block animate-pulse" title="Google Gemini Free Tier Enabled (₹0 Cost)" />
              </h2>
              <p className="text-[10px] text-[#5A525E]">Conversational Travel Companion & Technical Guide</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-[#4F734E] bg-[#EFF5EE] border border-[#789477]/40 px-2.5 py-0.5 rounded-lg font-mono font-bold">
              <Cpu className="w-3 h-3 text-[#789477]" />
              <span>{activeModel}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Messages Container with independent flex min-h-0 */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl mx-auto ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'hana' && (
                <div className="w-7 h-7 rounded-full bg-[#E9A5B5] text-white flex items-center justify-center text-xs shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm relative group shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-[#C66B4E] text-white rounded-br-xs'
                  : 'bg-white border border-[#EAE0D0] text-[#29252B] rounded-bl-xs'
              }`}>
                {/* Render formatted markdown message with headers, bold, code, tables */}
                <MarkdownMessage
                  content={msg.text}
                  isHana={msg.sender === 'hana'}
                  onExploreIn3D={() => onSelectSession(currentSessionId)}
                />

                {/* Visible Error Card (Prevent empty bubble) */}
                {msg.isError && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 my-2 text-rose-800">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded border border-rose-300">
                            {msg.errorCode || 'Service Error'}
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed font-medium">
                          {msg.errorMessage}
                        </p>
                        {lastUserPrompt && (
                          <button
                            onClick={() => sendMessage(lastUserPrompt)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry Request</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Verified Transit Connections */}
                {msg.journeys && msg.journeys.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-[#5A525E] flex items-center gap-1 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C66B4E]" />
                      <span>Verified Transit Timetables (RAPTOR):</span>
                    </div>
                    <JourneyDisplay journeys={msg.journeys} />
                  </div>
                )}

                {/* CrowdSense Quieter Alternatives */}
                {msg.crowd_alternatives && msg.crowd_alternatives.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#EAE0D0] space-y-2">
                    <div className="text-xs font-semibold text-[#4F734E] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>CrowdSense Quieter Alternatives (Simulation):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.crowd_alternatives.map((alt) => (
                        <div
                          key={alt.place_id}
                          className="bg-[#FAF6F0] border border-[#789477]/30 rounded-xl p-2.5 flex items-center gap-2.5"
                        >
                          <img
                            src={alt.image_url}
                            alt={alt.name_en}
                            className="w-12 h-12 rounded-lg object-cover bg-[#EAE0D0] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-[#29252B] truncate">{alt.name_en}</h4>
                              <span className="text-[10px] font-bold text-[#4F734E] bg-[#EFF5EE] border border-[#789477]/30 px-1.5 py-0.5 rounded-full shrink-0">
                                -{alt.crowd_reduction_percent}%
                              </span>
                            </div>
                            <p className="text-[10px] text-[#5A525E] truncate">{alt.name_ja}</p>
                            <p className="text-[10px] text-[#29252B] line-clamp-1">{alt.recommendation_reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Place Cards (Strictly conditional: never shown for general questions) */}
                {msg.places && msg.places.length > 0 && msg.response_type !== 'general' && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-[#EAE0D0]">
                    <div className="text-xs font-semibold text-[#C66B4E] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {msg.response_type === 'itinerary_destinations'
                          ? `Itinerary Destinations (${msg.places.length}):`
                          : `Verified Destination Recommendations (${msg.places.length}):`}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.places.map((place) => (
                        <PlaceCard key={place.place_id} place={place} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-[#8A808F] mt-2 text-right">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#C66B4E] text-white flex items-center justify-center text-xs shrink-0 mt-1 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-[#C66B4E] p-2 max-w-4xl mx-auto font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C66B4E]" />
              <span>Hana is thinking and composing response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-to-Bottom Floating Button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-24 right-8 z-20 w-8 h-8 rounded-full bg-[#C66B4E] hover:bg-[#B2583D] text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
            title="Scroll to latest message"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* 3. Fixed Bottom Input Composer */}
        <div className="p-4 border-t border-[#EAE0D0] bg-[#FAF6F0]/95 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Quick Prompts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-[#5A525E] no-scrollbar">
              <span className="shrink-0 text-[#8A808F] font-bold">{t('hana_try_asking', 'Try asking:')}</span>
              <button
                onClick={() => sendMessage('Tell me about Japanese Omotenashi hospitality and travel etiquette.')}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-white hover:bg-[#FDF2F4] hover:text-[#C66B4E] hover:border-[#E9A5B5] border border-[#EAE0D0] text-[#5A525E] font-semibold transition-all cursor-pointer shadow-2xs"
              >
                {t('prompt_omotenashi', 'Omotenashi Hospitality')}
              </button>
              <button
                onClick={() => sendMessage('How does FujiNova implement the RAPTOR public transit algorithm?')}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-white hover:bg-[#FDF2F4] hover:text-[#C66B4E] hover:border-[#E9A5B5] border border-[#EAE0D0] text-[#5A525E] font-semibold transition-all cursor-pointer shadow-2xs"
              >
                {t('prompt_raptor', 'RAPTOR Algorithm Code')}
              </button>
              <button
                onClick={() => sendMessage('Plan a 1-day trip from Kawaguchiko Station with great Fuji views under ¥10,000.')}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-white hover:bg-[#FDF2F4] hover:text-[#C66B4E] hover:border-[#E9A5B5] border border-[#EAE0D0] text-[#5A525E] font-semibold transition-all cursor-pointer shadow-2xs"
              >
                {t('prompt_budget', '1-Day Trip under ¥10,000')}
              </button>
              <button
                onClick={() => sendMessage('What are the best attractions around Lake Kawaguchiko for elderly visitors avoiding steep stairs?')}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-white hover:bg-[#FDF2F4] hover:text-[#C66B4E] hover:border-[#E9A5B5] border border-[#EAE0D0] text-[#5A525E] font-semibold transition-all cursor-pointer shadow-2xs"
              >
                {t('prompt_barrier', 'Barrier-Free Highlights')}
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-end gap-2 bg-white border border-[#EAE0D0] focus-within:border-[#C66B4E] rounded-2xl p-2 shadow-2xs transition-all"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t('hana_placeholder', 'Ask Hana anything: Japanese culture, travel advice, RAPTOR transit, cuisine...')}
                rows={1}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-[#29252B] placeholder-[#8A808F] resize-none focus:outline-none max-h-32 min-h-[36px]"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shrink-0 cursor-pointer"
                  title="Stop generating"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2 rounded-xl bg-[#C66B4E] hover:bg-[#B2583D] disabled:opacity-40 disabled:hover:bg-[#C66B4E] text-white transition-all shrink-0 cursor-pointer shadow-xs"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
