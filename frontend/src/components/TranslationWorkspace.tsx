import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config';
import { 
  Languages, 
  ArrowLeftRight, 
  Volume2, 
  Copy, 
  Check, 
  Sparkles, 
  Hotel, 
  Utensils, 
  Bus, 
  Compass, 
  ShoppingBag, 
  AlertTriangle, 
  Camera, 
  History, 
  Trash2, 
  Info,
  Send
} from 'lucide-react';

interface TranslationItem {
  id: string;
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  phonetic_reading?: string;
  english_meaning?: string;
  travel_mode: string;
  formality: string;
  cultural_tip?: string;
  timestamp: string;
}

interface LanguageOption {
  code: string;
  name: string;
  native: string;
  voiceLang: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ja', name: 'Japanese', native: '日本語', voiceLang: 'ja-JP' },
  { code: 'en', name: 'English', native: 'English', voiceLang: 'en-US' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', voiceLang: 'hi-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', voiceLang: 'ta-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', voiceLang: 'kn-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', voiceLang: 'te-IN' }
];

interface TravelScenario {
  id: string;
  name: string;
  nameJa: string;
  icon: React.ComponentType<{ className?: string }>;
  presets: string[];
}

const TRAVEL_SCENARIOS: TravelScenario[] = [
  {
    id: 'transit',
    name: 'Transit & Buses',
    nameJa: '交通・バス',
    icon: Bus,
    presets: [
      'Where is the Red Line sightseeing bus stop?',
      'Does this bus go to Kawaguchiko Station?',
      'Can I use my Suica or Pasmo card here?',
      'What time does the last train to Shinjuku depart?'
    ]
  },
  {
    id: 'hotel',
    name: 'Ryokan & Hotel',
    nameJa: '旅館・宿泊',
    icon: Hotel,
    presets: [
      'Could you please hold my luggage before check-in?',
      'What time is dinner served in our room?',
      'Can we see Mount Fuji from this room?',
      'Could you arrange a taxi to Kawaguchiko Station tomorrow morning?'
    ]
  },
  {
    id: 'dining',
    name: 'Dining & Food',
    nameJa: '食事・グルメ',
    icon: Utensils,
    presets: [
      'Could I please order one bowl of Yamanashi Hoto noodles?',
      'Does this dish contain pork, beef, or alcohol?',
      'Could we have two glasses of water, please?',
      'Check, please (Okaikei onegaishimasu).'
    ]
  },
  {
    id: 'attractions',
    name: 'Attractions & Fuji',
    nameJa: '観光・富士山',
    icon: Camera,
    presets: [
      'Where is the best viewpoint to take photos of Mount Fuji today?',
      'Are there many stairs to reach the observation deck?',
      'Is the Mt. Fuji Panoramic Ropeway operating right now?',
      'How much is the admission fee for adults?'
    ]
  },
  {
    id: 'directions',
    name: 'Directions & Map',
    nameJa: '道案内・位置',
    icon: Compass,
    presets: [
      'Excuse me, where is the nearest barrier-free restroom?',
      'How long does it take to walk to Oishi Park from here?',
      'Where is the Tourist Information Center?',
      'Could you point me in the direction of Lake Kawaguchiko?'
    ]
  },
  {
    id: 'shopping',
    name: 'Shopping & Tax-Free',
    nameJa: '買い物・免税',
    icon: ShoppingBag,
    presets: [
      'Is tax-free shopping available with my passport?',
      'Could you please wrap this as a souvenir gift?',
      'Can I pay by credit card or touch payment?',
      'What is the most popular local Yamanashi souvenir?'
    ]
  },
  {
    id: 'emergency',
    name: 'Emergency & Health',
    nameJa: '緊急・医療',
    icon: AlertTriangle,
    presets: [
      'Please help me! (Tasukete kudasai)',
      'Where is the nearest hospital or medical clinic?',
      'I lost my passport / bag. Where is the nearest police box (Koban)?',
      'Please call an ambulance immediately (119).'
    ]
  }
];

export const TranslationWorkspace: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ja');
  const [inputText, setInputText] = useState('');
  const [activeScenario, setActiveScenario] = useState('transit');
  const [formality, setFormality] = useState('polite_keigo');
  
  const [currentTranslation, setCurrentTranslation] = useState<TranslationItem | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Translation history persisted in localStorage
  const [history, setHistory] = useState<TranslationItem[]>(() => {
    try {
      const saved = localStorage.getItem('fujinova_translation_history');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fujinova_translation_history', JSON.stringify(history));
    } catch (_) {}
  }, [history]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (currentTranslation) {
      setInputText(currentTranslation.translated_text);
      setCurrentTranslation(null);
    }
  };

  const handleTranslate = async (textOverride?: string) => {
    const textToTranslate = (textOverride || inputText).trim();
    if (!textToTranslate || isTranslating) return;

    setIsTranslating(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/v1/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          source_language: sourceLang,
          target_language: targetLang,
          travel_mode: activeScenario,
          formality: formality
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned error HTTP ${res.status}`);
      }

      const data = await res.json();
      const newItem: TranslationItem = {
        id: `trans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        original_text: data.original_text,
        translated_text: data.translated_text,
        source_language: data.source_language || sourceLang,
        target_language: data.target_language || targetLang,
        phonetic_reading: data.phonetic_reading,
        english_meaning: data.english_meaning,
        travel_mode: data.travel_mode || activeScenario,
        formality: data.formality || formality,
        cultural_tip: data.cultural_tip,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setCurrentTranslation(newItem);
      setHistory(prev => [newItem, ...prev.filter(h => h.original_text !== newItem.original_text)].slice(0, 30));
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'Failed to complete translation. Please check your Gemini connection.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetVoiceLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.voiceLang || 'ja-JP';
    utterance.lang = targetVoiceLang;
    utterance.rate = 0.9; // Slightly slower for clarity

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const currentScenarioObj = TRAVEL_SCENARIOS.find(s => s.id === activeScenario) || TRAVEL_SCENARIOS[0];

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shadow-lg">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Japanese Travel Translation</h1>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                Gemini Free Tier (₹0)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural Keigo honorifics, verified Romaji readings, and Mount Fuji travel phrases across 6 languages.
            </p>
          </div>
        </div>

        {/* Politeness selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFormality('polite_keigo')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              formality === 'polite_keigo' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Polite (丁寧語)
          </button>
          <button
            onClick={() => setFormality('casual')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              formality === 'casual' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Casual (日常会話)
          </button>
        </div>
      </div>

      {/* Language Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg">
        {/* Source Language */}
        <div className="flex-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">From</label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.native} ({l.name})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="pt-4">
          <button
            onClick={handleSwapLanguages}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition hover:rotate-180 transform duration-300 cursor-pointer"
            title="Swap source and target languages"
            aria-label="Swap source and target languages"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Target Language */}
        <div className="flex-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">To</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.native} ({l.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Travel Scenario Filter Bar */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300">Select Travel Scenario:</span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {TRAVEL_SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const isActive = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setActiveScenario(sc.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition border ${
                  isActive
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sc.name}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">({sc.nameJa})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Travel Presets */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5 text-sky-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recommended Regional Phrases for {currentScenarioObj.name}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">Click any phrase to translate immediately</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentScenarioObj.presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(preset);
                handleTranslate(preset);
              }}
              className="text-left text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 text-slate-200 transition cursor-pointer flex items-center justify-between group"
            >
              <span className="truncate pr-2">{preset}</span>
              <span className="text-[10px] text-sky-400 font-semibold group-hover:translate-x-0.5 transition shrink-0">
                Translate →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Input / Output Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Enter phrase or question
              </span>
              {inputText && (
                <button
                  onClick={() => setInputText('')}
                  className="text-xs text-slate-500 hover:text-slate-300 transition"
                >
                  Clear
                </button>
              )}
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Can I pay with Suica? Where is the Lake Kawaguchiko pier?"
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500 resize-none font-sans"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleTranslate();
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-500">Press Ctrl+Enter to translate</span>
            <button
              onClick={() => handleTranslate()}
              disabled={!inputText.trim() || isTranslating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg transition cursor-pointer"
            >
              {isTranslating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Translate Phrase</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Translation Output Result */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl min-h-[260px]">
          {error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Translation Error</strong>
                <span>{error}</span>
              </div>
            </div>
          ) : currentTranslation ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-bold uppercase tracking-wider text-sky-400">
                    {SUPPORTED_LANGUAGES.find(l => l.code === currentTranslation.target_language)?.name} Translation
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded-md text-[10px] text-slate-300 font-semibold">
                    {currentTranslation.formality === 'polite_keigo' ? 'Polite (丁寧語)' : 'Casual (日常会話)'}
                  </span>
                </div>

                {/* Primary Script */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xl sm:text-2xl font-bold text-white leading-relaxed select-all">
                  {currentTranslation.translated_text}
                </div>

                {/* Phonetics / Romaji */}
                {currentTranslation.phonetic_reading && (
                  <div className="mt-3 p-3 rounded-xl bg-sky-950/30 border border-sky-800/40 text-sky-300 text-xs">
                    <span className="text-[10px] font-bold uppercase text-sky-400 block mb-0.5">Phonetic Reading (Romaji)</span>
                    <span className="font-mono text-sm">{currentTranslation.phonetic_reading}</span>
                  </div>
                )}

                {/* Cultural Travel Tip */}
                {currentTranslation.cultural_tip && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-amber-200 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-300 text-[11px]">Travel Etiquette Tip</span>
                      <p className="text-slate-300 leading-relaxed text-[11px] mt-0.5">{currentTranslation.cultural_tip}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Audio Pronounce & Copy */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  onClick={() => handleSpeak(currentTranslation.translated_text, currentTranslation.target_language)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    isSpeaking 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                  title="Pronounce phrase aloud"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  <span>{isSpeaking ? 'Playing Voice...' : 'Play Audio Voice'}</span>
                </button>

                <button
                  onClick={() => handleCopy(currentTranslation.translated_text)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  title="Copy translated text to clipboard"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
              <Languages className="w-10 h-10 text-slate-700 mb-1" />
              <p className="text-sm font-semibold text-slate-400">Translation result will appear here</p>
              <p className="text-xs text-slate-600 max-w-xs">
                Select a recommended Mount Fuji travel phrase above, or type custom text in the box to translate.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Translation History Section */}
      {history.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Saved Translation History</h3>
              <span className="text-[11px] text-slate-500 font-normal">({history.length} items)</span>
            </div>
            <button
              onClick={() => {
                if (confirm('Clear translation history?')) {
                  setHistory([]);
                  localStorage.removeItem('fujinova_translation_history');
                }
              }}
              className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setCurrentTranslation(item)}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-sky-500/40 transition cursor-pointer flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="uppercase font-bold text-sky-400">{item.travel_mode}</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{item.original_text}</p>
                  <p className="text-sm font-bold text-white mt-1 leading-snug">{item.translated_text}</p>
                  {item.phonetic_reading && (
                    <p className="text-[11px] font-mono text-sky-300 mt-0.5 truncate">{item.phonetic_reading}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(item.translated_text, item.target_language);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Speak"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item.translated_text);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
