import React, { useState, useRef, useEffect } from 'react';
import { Place, ChatMessage, Journey, CrowdAlternativeCard, ItineraryPlan } from '../types';
import { apiUrl } from '../config';
import { JourneyDisplay } from './JourneyDisplay';
import { PlaceCard } from './PlaceCard';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  Users, 
  Copy, 
  Check, 
  Trash2, 
  Cpu, 
  Plus, 
  Search, 
  Pin, 
  MessageSquare, 
  ArrowDown, 
  Edit2, 
  StopCircle, 
  Volume2,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
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
          text: "Konnichiwa! I am Hana (ハナ), your AI travel companion for Mount Fuji and the Fuji Five Lakes. I can answer any general question (including Japanese culture, machine learning, technology, translations, and regional weather) or generate personalized multi-day itineraries with verified public transport schedules. How can I assist you today?",
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

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Helper to render markdown and code blocks
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const code = language ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} className="my-2 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs shadow-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-sky-400 uppercase">{language || 'code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="Copy code"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-3 text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      const formatted = part.split('\n').map((line, lIdx) => {
        let l = line;
        if (l.startsWith('### ')) {
          return <h3 key={lIdx} className="text-sm font-bold text-white mt-2 mb-1">{l.replace('### ', '')}</h3>;
        }
        if (l.startsWith('## ')) {
          return <h2 key={lIdx} className="text-base font-bold text-white mt-2.5 mb-1">{l.replace('## ', '')}</h2>;
        }
        if (l.startsWith('# ')) {
          return <h1 key={lIdx} className="text-lg font-black text-white mt-3 mb-1.5">{l.replace('# ', '')}</h1>;
        }
        if (l.startsWith('- ') || l.startsWith('* ')) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 my-0.5 ml-2">
              <span className="text-sky-400 font-bold leading-tight">•</span>
              <span className="flex-1">{l.slice(2)}</span>
            </div>
          );
        }
        return <p key={lIdx} className={lIdx > 0 ? 'mt-1' : ''}>{l}</p>;
      });

      return <span key={index}>{formatted}</span>;
    });
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden select-text">
      {/* 1. Left Persistent Conversation History Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/50 flex flex-col h-full shrink-0 hidden md:flex">
        {/* Sidebar Header */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Journey Chat</span>
          </button>

          {/* Search conversations */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Conversation List with independent scrolling */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
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
                      ? 'bg-sky-950/60 border border-sky-500/40 text-white shadow-xs'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${conv.pinned ? 'text-amber-400' : 'text-slate-500'}`} />
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(conv.conversation_id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(conv.conversation_id)}
                        autoFocus
                        className="bg-slate-950 border border-sky-500 px-1 py-0.5 rounded text-white text-xs w-full focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="truncate">
                        <span className="font-semibold block truncate leading-tight">
                          {conv.title}
                        </span>
                        {conv.preview && (
                          <span className="text-[10px] text-slate-500 block truncate">
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
                      className={`p-1 rounded hover:bg-slate-700 ${conv.pinned ? 'text-amber-400' : 'text-slate-500'}`}
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
                      className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-700 rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.conversation_id, e)}
                      title="Delete"
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded"
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

      {/* 2. Main ChatGPT-grade Conversation Workspace */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 relative min-w-0">
        {/* Fixed Header */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              ハ
            </div>
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Guide Hana (ハナ)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Google Gemini Free Tier Enabled (₹0 Cost)" />
              </h2>
              <p className="text-[10px] text-slate-400">Conversational Travel Companion & Technical Guide</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-lg font-mono">
              <Cpu className="w-3 h-3 text-sky-400" />
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
                <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm relative group shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white rounded-br-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
              }`}>
                {/* Assistant message action buttons */}
                {msg.sender === 'hana' && msg.text && !msg.isError && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSpeakText(msg.text)}
                      className="p-1 text-slate-400 hover:text-white rounded bg-slate-800 cursor-pointer"
                      title="Read aloud"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-sky-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="p-1 text-slate-400 hover:text-white rounded bg-slate-800 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {/* Render normal text / markdown */}
                {renderMessageContent(msg.text)}

                {/* Visible Error Card (Prevent empty bubble) */}
                {msg.isError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 my-2 text-rose-200">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                            {msg.errorCode || 'Service Error'}
                          </span>
                        </div>
                        <p className="text-xs text-rose-200 leading-relaxed font-medium">
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
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>Verified Transit Timetables (RAPTOR):</span>
                    </div>
                    <JourneyDisplay journeys={msg.journeys} />
                  </div>
                )}

                {/* CrowdSense Quieter Alternatives */}
                {msg.crowd_alternatives && msg.crowd_alternatives.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>CrowdSense Quieter Alternatives (Simulation):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.crowd_alternatives.map((alt) => (
                        <div
                          key={alt.place_id}
                          className="bg-slate-800/80 border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-2.5"
                        >
                          <img
                            src={alt.image_url}
                            alt={alt.name_en}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-700 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-white truncate">{alt.name_en}</h4>
                              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                                -{alt.crowd_reduction_percent}%
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{alt.name_ja}</p>
                            <p className="text-[10px] text-slate-300 line-clamp-1">{alt.recommendation_reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Place Cards (Strictly conditional: never shown for general questions) */}
                {msg.places && msg.places.length > 0 && msg.response_type !== 'general' && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-slate-800">
                    <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
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

                <div className="text-[10px] text-slate-500 mt-2 text-right">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs shrink-0 mt-1 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-sky-400 p-2 max-w-4xl mx-auto">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Hana is thinking and composing response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-to-Bottom Floating Button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-24 right-8 z-20 w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
            title="Scroll to latest message"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* 3. Fixed Bottom Input Composer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Quick Prompts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400 no-scrollbar">
              <span className="shrink-0 text-slate-500 font-semibold">Try asking:</span>
              <button
                onClick={() => sendMessage('Tell me about Japanese Omotenashi hospitality and travel etiquette.')}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-sky-950 hover:text-sky-300 hover:border-sky-500/40 border border-slate-700/60 transition-all cursor-pointer"
              >
                Omotenashi Hospitality
              </button>
              <button
                onClick={() => sendMessage('How does FujiNova implement the RAPTOR public transit algorithm?')}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-sky-950 hover:text-sky-300 hover:border-sky-500/40 border border-slate-700/60 transition-all cursor-pointer"
              >
                RAPTOR Algorithm Code
              </button>
              <button
                onClick={() => sendMessage('Plan a 1-day trip from Kawaguchiko Station with great Fuji views under ¥10,000.')}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-sky-950 hover:text-sky-300 hover:border-sky-500/40 border border-slate-700/60 transition-all cursor-pointer"
              >
                1-Day Trip under ¥10,000
              </button>
              <button
                onClick={() => sendMessage('What are the best attractions around Lake Kawaguchiko for elderly visitors avoiding steep stairs?')}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-sky-950 hover:text-sky-300 hover:border-sky-500/40 border border-slate-700/60 transition-all cursor-pointer"
              >
                Barrier-Free Highlights
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-end gap-2 bg-slate-950 border border-slate-800 focus-within:border-sky-500 rounded-2xl p-2 shadow-inner transition-all"
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
                placeholder="Ask Hana anything: Japanese culture, travel advice, Python code, RAPTOR, or itinerary planning..."
                rows={1}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 resize-none focus:outline-none max-h-32 min-h-[36px]"
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
                  className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white transition-all shrink-0 cursor-pointer"
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
