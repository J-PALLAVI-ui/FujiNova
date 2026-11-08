import React, { useState, useRef, useEffect } from 'react';
import { Place, ChatMessage } from '../types';
import { PlaceCard } from './PlaceCard';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

interface ChatDrawerProps {
  sessionId: string;
  onProfileUpdated?: (profile: any) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ sessionId, onProfileUpdated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'hana',
      text: "Konnichiwa! I'm Hana, your AI travel companion for Mount Fuji and the Fuji Five Lakes. Tell me a bit about your trip: who are you traveling with, and do you have any mobility or walking requirements?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isStreaming) return;

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
    // Create empty Hana message placeholder for streaming
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

    try {
      const response = await fetch('/api/v1/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: textToSend
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;
          const lines = eventBlock.split('\n');
          let eventType = 'message';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }

          if (eventType === 'token') {
            try {
              const parsed = JSON.parse(eventData);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === hanaMsgId ? { ...m, text: m.text + parsed.token } : m
                )
              );
            } catch (e) {
              console.error('Error parsing token event', e);
            }
          } else if (eventType === 'places') {
            try {
              const places: Place[] = JSON.parse(eventData);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === hanaMsgId ? { ...m, places } : m
                )
              );
            } catch (e) {
              console.error('Error parsing places event', e);
            }
          } else if (eventType === 'done') {
            try {
              const doneData = JSON.parse(eventData);
              if (onProfileUpdated && doneData.profile) {
                onProfileUpdated(doneData.profile);
              }
            } catch (e) {
              console.error('Error parsing done event', e);
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === hanaMsgId
            ? { ...m, text: m.text + `\n\n[Communication note: ${err.message}]` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const quickPrompts = [
    "I'm with my grandmother who uses a wheelchair",
    "Where can we get great Fuji views without steep stairs?",
    "Indoor recommendations if it rains today"
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-sky-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            ハ
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              Hana (ハナ)
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Online" />
            </h2>
            <p className="text-[11px] text-slate-500">Mount Fuji AI Tourism Companion</p>
          </div>
        </div>
        <div className="text-xs text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded font-mono">
          35 Places Grounded
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'hana' && (
              <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.sender === 'user'
                ? 'bg-sky-600 text-white rounded-br-xs'
                : 'bg-slate-100 text-slate-800 rounded-bl-xs'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

              {/* Recommended Place Cards */}
              {msg.places && msg.places.length > 0 && (
                <div className="mt-3.5 space-y-3 pt-3 border-t border-slate-200/80">
                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Verified Recommended Places ({msg.places.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {msg.places.map((place) => (
                      <PlaceCard key={place.place_id} place={place} />
                    ))}
                  </div>
                </div>
              )}

              <span className={`block text-[10px] mt-1.5 ${
                msg.sender === 'user' ? 'text-sky-200 text-right' : 'text-slate-400'
              }`}>
                {msg.timestamp}
              </span>
            </div>
            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
            <span>Hana is thinking and consulting verified places...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs bg-slate-50/50">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Try:</span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt)}
            disabled={isStreaming}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/50 transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Hana (e.g. 'Traveling with grandmother in wheelchair...')"
            disabled={isStreaming}
            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
