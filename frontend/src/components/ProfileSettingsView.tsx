import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Eye, 
  Globe, 
  Cpu, 
  Database,
  Sparkles,
  Smile,
  Compass,
  Check
} from 'lucide-react';
import { useExperienceMode } from '../context/ExperienceModeContext';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';
import { useTranslation } from '../i18n/LanguageContext';
import { ProviderStatusPanel } from './ProviderStatusPanel';

interface ProfileSettingsViewProps {
  activeModel?: string;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  activeModel = 'gemini-3.5-flash-lite'
}) => {
  const { mode: currentExperienceMode, setMode: setExperienceMode } = useExperienceMode();
  const { language, setLanguage } = useTranslation();
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('fujinova_high_contrast') === 'true';
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('fujinova_reduced_motion') === 'true';
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('fujinova_font_size') as any) || 'normal';
  });

  // Apply WCAG preferences directly to DOM
  useEffect(() => {
    localStorage.setItem('fujinova_high_contrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('fujinova_reduced_motion', String(reducedMotion));
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('fujinova_font_size', fontSize);
    document.documentElement.classList.remove('text-scale-100', 'text-scale-115', 'text-scale-130');
    if (fontSize === 'large') document.documentElement.classList.add('text-scale-115');
    else if (fontSize === 'xlarge') document.documentElement.classList.add('text-scale-130');
    else document.documentElement.classList.add('text-scale-100');
  }, [fontSize]);




  return (
    <div className="h-full overflow-y-auto bg-transparent text-[#29252B] p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 select-text">
      {/* Workspace Header */}
      <div className="flex items-center gap-3 border-b border-[#EAE0D0] pb-5">
        <div className="w-10 h-10 rounded-2xl bg-[#EFF5EE] text-[#4F734E] flex items-center justify-center font-bold">
          <Settings className="w-6 h-6 text-[#789477]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#29252B]">Profile & Accessibility Settings</h1>
          <p className="text-xs text-[#625966]">
            WCAG 2.2 AA accessibility preferences, multilingual fluency, and AI engine telemetry.
          </p>
        </div>
      </div>

      {/* 0. Multi-Age Experience Modes */}
      <div className="bg-white border border-[#E5DDD2] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#29252B] border-b border-[#E5DDD2] pb-3">
          <Sparkles className="w-4 h-4 text-[#C66B4E]" />
          <span>Multi-Age Experience Modes (FujiNova Adaptive UI)</span>
        </div>

        <p className="text-xs text-[#403944]">
          Tailor FujiNova’s interface, tone, and recommendations to who is travelling. Switch instantly at any time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Adult Mode */}
          <button
            onClick={() => setExperienceMode('adult')}
            className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
              currentExperienceMode === 'adult'
                ? 'bg-[#FAF6F0] border-[#C66B4E] ring-2 ring-[#C66B4E]/30 shadow-xs'
                : 'bg-white border-[#E5DDD2] hover:border-[#C66B4E]/40 text-[#29252B]'
            }`}
          >
            {currentExperienceMode === 'adult' && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C66B4E] text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </span>
            )}
            <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] text-[#C66B4E] flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#29252B]">Standard Explorer (Adult)</h3>
            <p className="text-xs text-[#403944] mt-1 leading-relaxed">
              Professional tables, detailed RAPTOR transit timetables, budget breakdowns & full accessibility controls.
            </p>
            <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-[#C66B4E]">
              <span className="px-2 py-0.5 rounded-lg bg-[#FAF6F0] border border-[#E5DDD2] font-bold">Transit Times</span>
              <span className="px-2 py-0.5 rounded-lg bg-[#FAF6F0] border border-[#E5DDD2] font-bold">Exact Costs</span>
            </div>
          </button>

          {/* Teen Mode */}
          <button
            onClick={() => setExperienceMode('teen')}
            className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
              currentExperienceMode === 'teen'
                ? 'bg-[#FDF2F4] border-[#E9A5B5] ring-2 ring-[#E9A5B5]/30 shadow-xs'
                : 'bg-white border-[#E5DDD2] hover:border-[#E9A5B5]/50 text-[#29252B]'
            }`}
          >
            {currentExperienceMode === 'teen' && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E9A5B5] text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </span>
            )}
            <div className="w-9 h-9 rounded-xl bg-[#FDF2F4] text-[#C64A6A] flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#29252B]">Trendsetter (Teenager)</h3>
            <p className="text-xs text-[#403944] mt-1 leading-relaxed">
              Vibrant sakura gradients, viral photography ratings, social travel summaries & Japanese pop culture cues.
            </p>
            <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-[#C64A6A]">
              <span className="px-2 py-0.5 rounded-lg bg-[#FDF2F4] border border-[#E9A5B5] font-bold">Photo Spots</span>
              <span className="px-2 py-0.5 rounded-lg bg-[#FDF2F4] border border-[#E9A5B5] font-bold">Trending</span>
            </div>
          </button>

          {/* Family Mode */}
          <button
            onClick={() => setExperienceMode('family')}
            className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
              currentExperienceMode === 'family'
                ? 'bg-[#EFF5EE] border-[#789477] ring-2 ring-[#789477]/30 shadow-xs'
                : 'bg-white border-[#E5DDD2] hover:border-[#789477]/50 text-[#29252B]'
            }`}
          >
            {currentExperienceMode === 'family' && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#789477] text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </span>
            )}
            <div className="w-9 h-9 rounded-xl bg-[#EFF5EE] text-[#4F734E] flex items-center justify-center mb-3">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#29252B]">Family & Junior Explorer</h3>
            <p className="text-xs text-[#403944] mt-1 leading-relaxed">
              Friendly playful badges, gentle stroller-friendly paths, restroom proximity alerts & explorer scavenger badges.
            </p>
            <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-[#4F734E]">
              <span className="px-2 py-0.5 rounded-lg bg-[#EFF5EE] border border-[#789477]/30 font-bold">Kid-Friendly</span>
              <span className="px-2 py-0.5 rounded-lg bg-[#EFF5EE] border border-[#789477]/30 font-bold">Step-Free</span>
            </div>
          </button>
        </div>
      </div>

      {/* 1. WCAG 2.2 AA Accessibility Preferences */}
      <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-[#29252B] border-b border-[#EAE0D0] pb-3">
          <Eye className="w-4 h-4 text-[#789477]" />
          <span>Accessibility & Universal Design (WCAG 2.2 AA)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D0] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#29252B] block">High Contrast Mode</span>
              <span className="text-[11px] text-[#5A525E] block mt-0.5">Enhance borders and text contrast (&gt;= 4.5:1)</span>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${highContrast ? 'bg-[#C66B4E]' : 'bg-[#D5C1A3]'}`}
              aria-label="Toggle high contrast mode"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${highContrast ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D0] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#29252B] block">Reduced Motion</span>
              <span className="text-[11px] text-[#5A525E] block mt-0.5">Disable intensive 3D and UI transitions</span>
            </div>
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${reducedMotion ? 'bg-[#C66B4E]' : 'bg-[#D5C1A3]'}`}
              aria-label="Toggle reduced motion"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${reducedMotion ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D0] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#29252B] block">Text Size Scaling</span>
              <span className="text-[11px] text-[#5A525E] block mt-0.5">Adjust text legibility</span>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl text-xs border border-[#EAE0D0]">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer ${fontSize === 'normal' ? 'bg-[#C66B4E] text-white' : 'text-[#5A525E]'}`}
              >
                100%
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer ${fontSize === 'large' ? 'bg-[#C66B4E] text-white' : 'text-[#5A525E]'}`}
              >
                115%
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer ${fontSize === 'xlarge' ? 'bg-[#C66B4E] text-white' : 'text-[#5A525E]'}`}
              >
                130%
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Multilingual Fluency */}
      <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#29232B] border-b border-[#EAE0D0] pb-3">
          <Globe className="w-4 h-4 text-[#789477]" />
          <span>Language & Global Multilingual Fluency (20 Languages)</span>
        </div>

        <p className="text-xs text-[#5A525E]">
          FujiNova 10.0 provides complete localization across European, Asian, Middle Eastern (with bidirectional RTL support), and Indian languages.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-80 overflow-y-auto p-1">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                language === l.code
                  ? 'bg-[#C66B4E] border-[#C66B4E] text-white shadow-xs'
                  : 'bg-white border-[#EAE0D0] text-[#29232B] hover:border-[#C66B4E]/40 hover:bg-[#FAF6F0]'
              }`}
            >
              <span className="text-sm font-bold block">{l.native}</span>
              <span className="text-[10px] block mt-0.5 opacity-80">{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. FujiNova 10.0 Live Providers Telemetry */}
      <ProviderStatusPanel />

      {/* 3. AI Engine Configuration & System Health Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#29252B] border-b border-[#EAE0D0] pb-2">
            <Cpu className="w-4 h-4 text-[#C66B4E]" />
            <span>AI Model & LLM Pipeline Telemetry</span>
          </div>

          <ul className="text-xs text-[#5A525E] space-y-2.5">
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>Primary Engine:</span>
              <strong className="text-[#4F734E] font-mono">Google AI Studio Free Tier (₹0)</strong>
            </li>
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>Active Model:</span>
              <strong className="text-[#C66B4E] font-mono">{activeModel}</strong>
            </li>
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>Streaming Protocol:</span>
              <strong className="text-[#4F734E]">Server-Sent Events (SSE)</strong>
            </li>
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>Zero-Cost Safety Lock:</span>
              <strong className="text-[#4F734E] font-mono">FREE_ONLY_MODE=true</strong>
            </li>
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>Paid OpenAI Fallback:</span>
              <strong className="text-rose-600 font-mono">Strictly Disabled (₹0 Guarantee)</strong>
            </li>
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>RAG Knowledge Base:</span>
              <strong className="text-[#29252B]">16 Verified Documents (Code & Tourism)</strong>
            </li>
            <li className="flex justify-between">
              <span>Multilingual Engine:</span>
              <strong className="text-[#29252B] font-mono">20 World Languages (EN, JA, ES, DE, FR, IT, PT, RU, NL, ZH, KO, TH, VI, ID, AR, HE, HI, TA, KN, TE)</strong>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#29252B] border-b border-[#EAE0D0] pb-2">
            <Database className="w-4 h-4 text-[#789477]" />
            <span>Database & Transit Engine Telemetry</span>
          </div>

          <ul className="text-xs text-[#5A525E] space-y-2.5">
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>Database Architecture:</span>
              <strong className="text-[#29252B] font-mono">SQLite 3 (WAL Mode, Foreign Keys ON)</strong>
            </li>
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>Canonical Places:</span>
              <strong className="text-[#29252B] font-mono">36 Verified Destination Records</strong>
            </li>
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>Public Transit Algorithm:</span>
              <strong className="text-[#C66B4E] font-mono">Deterministic RAPTOR Engine</strong>
            </li>
            <li className="flex justify-between border-b border-[#EAE0D0] pb-1">
              <span>Transit Feed:</span>
              <strong className="text-[#29252B]">Fujikyu Bus GTFS-JP + Fujisanroku Rail</strong>
            </li>
            <li className="flex justify-between">
              <span>Crowd Simulation:</span>
              <strong className="text-[#4F734E] font-mono">CrowdSense 2.0 (Multi-Evidence Model)</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};