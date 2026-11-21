import React, { useState, useEffect } from 'react';
import { DiscoverView } from './components/DiscoverView';
import { HanaWorkspace } from './components/HanaWorkspace';
import { DigitalTwin3D } from './components/DigitalTwin3D';
import { LiveRegionMap } from './components/LiveRegionMap';
import { YourJourneyPanel } from './components/YourJourneyPanel';
import { TravelIntelligenceView } from './components/TravelIntelligenceView';
import { MyTravelView } from './components/MyTravelView';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { TravelEssentialsView } from './components/TravelEssentialsView';
import { FujiNovaLogo } from './components/brand/FujiNovaLogo';
import { TripBasketDrawer } from './components/TripBasketDrawer';
import { TripExportModal } from './components/TripExportModal';
import { PublicTripView } from './components/PublicTripView';
import { ExperienceModeProvider, useExperienceMode } from './context/ExperienceModeContext';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';
import { GlobalLanguageSelector } from './components/GlobalLanguageSelector';
import { InteractiveSakuraBackground, SeasonMode } from './components/InteractiveSakuraBackground';

import { TravellerProfile, ItineraryPlan, Place, ItineraryStop } from './types';
import ALL_VERIFIED_LANDMARKS from './data/all_landmarks.json';
import { apiUrl } from './config';
import { 
  Sparkles, 
  Compass, 
  Navigation, 
  Activity, 
  Wallet, 
  Settings,
  ShoppingBag,
  Smile,
  ChevronDown,
  Check,
  ShieldAlert
} from 'lucide-react';

export type WorkspaceTab = 
  | 'discover' 
  | 'hana' 
  | 'twin' 
  | 'journey' 
  | 'essentials'
  | 'intelligence' 
  | 'mytravel' 
  | 'settings';

const AppInner: React.FC = () => {
  // Check if opening a public shared trip via URL
  const [publicShareToken, setPublicShareToken] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/trip/')) {
      return path.replace('/trip/', '').trim();
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('trip');
  });

  // Persist current active session ID
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem('fujinova_active_session') || `fn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  });

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('discover');
  const [_profile, setProfile] = useState<TravellerProfile>({});
  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null);
  const [basket, setBasket] = useState<Place[]>([]);
  const [isBasketOpen, setIsBasketOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [externalPrompt, setExternalPrompt] = useState<string | undefined>(undefined);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [twinMode2D, setTwinMode2D] = useState(false);
  const [season, setSeason] = useState<SeasonMode>('spring');

  const { t } = useTranslation();
  const { isAdultMode, isTeenMode, isFamilyMode, modeTitle, modeBadgeColor, setMode } = useExperienceMode();
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

  const [health, setHealth] = useState<{
    status: string;
    primary_model: string;
    active_model?: string;
    active_provider?: string;
    gemini_configured?: boolean;
    free_only_mode?: boolean;
    openai_fallback_disabled?: boolean;
  } | null>(null);

  // Sync session ID to localStorage
  useEffect(() => {
    localStorage.setItem('fujinova_active_session', sessionId);
  }, [sessionId]);

  // System Health Check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        let res = await fetch(apiUrl('/health'));
        if (!res.ok) res = await fetch(apiUrl('/api/v1/health'));
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        } else {
          setHealth({ status: 'offline', primary_model: 'gemini-3.5-flash-lite', active_model: 'gemini-3.5-flash-lite', active_provider: 'google' });
        }
      } catch (_) {
        setHealth({ status: 'offline', primary_model: 'gemini-3.5-flash-lite', active_model: 'gemini-3.5-flash-lite', active_provider: 'google' });
      }
    };
    checkHealth();
  }, []);

  const handleAskHana = (prompt: string) => {
    setExternalPrompt(prompt);
    setActiveTab('hana');
  };

  const handleRemoveStop = (dayNumber: number, stopIndex: number) => {
    if (!itinerary) return;
    const newDays = itinerary.days.map((d) => {
      if (d.day_number === dayNumber) {
        const newStops = [...d.stops];
        newStops.splice(stopIndex, 1);
        return { ...d, stops: newStops };
      }
      return d;
    });
    setItinerary({ ...itinerary, days: newDays });
  };

  const handleAddStop = (place: Place) => {
    const newStop: ItineraryStop = {
      stop_id: `stop_${Date.now()}_${place.place_id}`,
      place_id: place.place_id,
      name_en: place.name_en || place.name_ja,
      name_ja: place.name_ja,
      category: place.primary_category,
      fuji_view_rating: place.fuji_view_rating,
      accessibility_status: place.accessibility_status,
      estimated_arrival: '14:00',
      duration_minutes: 90,
      image_url: place.image_url || 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=600&q=80',
      admission_info: place.general_admission_type === 'FREE' ? 'Free Entry' : `¥${place.general_admission_fee_jpy || 1000}`
    };

    if (itinerary && itinerary.days && itinerary.days.length > 0) {
      const updatedDays = [...itinerary.days];
      updatedDays[0] = {
        ...updatedDays[0],
        stops: [...updatedDays[0].stops, newStop]
      };
      setItinerary({ ...itinerary, days: updatedDays });
    } else {
      setItinerary({
        plan_id: `plan_${Date.now()}`,
        title: 'Custom Mount Fuji Exploration',
        total_days: 1,
        party_composition: 'traveller',
        budget_tier: 'standard',
        pace: 'moderate',
        days: [
          {
            day_number: 1,
            title: 'Day 1: Highlights & Lakeside Views',
            stops: [newStop]
          }
        ]
      });
    }

    // Also add to basket for seamless curation
    if (!basket.some(p => p.place_id === place.place_id)) {
      setBasket(prev => [...prev, place]);
    }
  };

  const handleReorderStop = (dayNumber: number, stopIndex: number, direction: 'up' | 'down') => {
    if (!itinerary) return;
    const newDays = itinerary.days.map((d) => {
      if (d.day_number === dayNumber) {
        const newStops = [...d.stops];
        const targetIndex = direction === 'up' ? stopIndex - 1 : stopIndex + 1;
        if (targetIndex >= 0 && targetIndex < newStops.length) {
          const temp = newStops[stopIndex];
          newStops[stopIndex] = newStops[targetIndex];
          newStops[targetIndex] = temp;
        }
        return { ...d, stops: newStops };
      }
      return d;
    });
    setItinerary({ ...itinerary, days: newDays });
  };

  // Trip Basket Actions
  const handleRemoveFromBasket = (placeId: string) => {
    setBasket(prev => prev.filter(p => p.place_id !== placeId));
  };

  const handleClearBasket = () => {
    setBasket([]);
  };

  const handleReorderBasket = (index: number, direction: 'up' | 'down') => {
    const newBasket = [...basket];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newBasket.length) {
      const temp = newBasket[index];
      newBasket[index] = newBasket[targetIndex];
      newBasket[targetIndex] = temp;
      setBasket(newBasket);
    }
  };

  const handleGenerateWithHana = (places: Place[]) => {
    const names = places.map(p => p.name_en || p.name_ja).join(', ');
    const prompt = `Plan a personalized, connected Mount Fuji itinerary including these stops in order: ${names}. Ensure optimal transit routes, step-free barrier advice, and prime Fuji viewing times.`;
    setIsBasketOpen(false);
    handleAskHana(prompt);
  };

  const handleViewBasketIn3D = (places: Place[]) => {
    const stops: ItineraryStop[] = places.map((place, idx) => ({
      stop_id: `basket_stop_${Date.now()}_${idx}`,
      place_id: place.place_id,
      name_en: place.name_en || place.name_ja,
      name_ja: place.name_ja,
      category: place.primary_category,
      fuji_view_rating: place.fuji_view_rating,
      accessibility_status: place.accessibility_status,
      estimated_arrival: `${9 + idx * 2}:00`,
      duration_minutes: 90,
      image_url: place.image_url || 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=600&q=80',
      admission_info: place.general_admission_type === 'FREE' ? 'Free Entry' : `¥${place.general_admission_fee_jpy || 1000}`
    }));

    setItinerary({
      plan_id: `basket_plan_${Date.now()}`,
      title: 'Curated Fuji Destination Route',
      total_days: 1,
      budget_tier: 'standard',
      pace: 'moderate',
      party_composition: 'traveller',
      days: [
        {
          day_number: 1,
          title: 'Day 1: Curated Stops',
          stops: stops
        }
      ]
    });

    setIsBasketOpen(false);
    setActiveTab('twin');
  };

  // If viewing a public shared trip via link
  if (publicShareToken) {
    return (
      <PublicTripView
        shareToken={publicShareToken}
        onOpenInApp={(importedItin) => {
          setItinerary(importedItin);
          setPublicShareToken(null);
          setActiveTab('twin');
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7EFE5] text-[#29252B] flex flex-col font-sans select-none antialiased relative">
      {/* Background System: Mount Fuji Silhouette + Interactive Falling Sakura Petals & Seasonal Scenery */}
      <InteractiveSakuraBackground activeTab={activeTab} season={season} />

      {/* WCAG 2.2 AA Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C66B4E] focus:text-white focus:rounded-xl focus:shadow-2xl focus:ring-2 focus:ring-white focus:outline-hidden text-xs font-bold"
      >
        {t('skip_content', 'Skip to main content (Alt+1)')}
      </a>

      {/* Top Header Navigation - Sakura Garden Warm Ivory & Charcoal Aesthetic */}
      <header className="bg-[#F7EFE5]/92 backdrop-blur-md border-b border-[#EAE0D0] sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1920px] mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo & Brand Identity */}
          <button 
            onClick={() => setActiveTab('discover')}
            className="flex items-center hover:opacity-95 transition-opacity shrink-0"
            aria-label="FujiNova Home"
          >
            <FujiNovaLogo variant="full-horizontal" size="sm" />
          </button>

          {/* Primary Workspace Navigation Tabs (Streamlined 7 Sections, Zero Horizontal Scrollbar) */}
          <nav className="flex items-center gap-1 bg-[#EFE4D6]/90 p-1 rounded-xl border border-[#E2D5C4] shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'discover'
                  ? 'bg-[#C66B4E] text-white shadow-xs'
                  : 'text-[#5A525E] hover:text-[#29252B] hover:bg-[#F7EFE5]/80'
              }`}
            >
              <span>{t('nav_discover', 'Discover')}</span>
            </button>

            <button
              onClick={() => setActiveTab('hana')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hana'
                  ? 'bg-[#C66B4E] text-white shadow-xs'
                  : 'text-[#5A525E] hover:text-[#29252B] hover:bg-[#F7EFE5]/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E9A5B5]" />
              <span>{t('nav_hana', 'Hana AI')}</span>
            </button>

            <button
              onClick={() => setActiveTab('twin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'twin'
                  ? 'bg-[#C66B4E] text-white shadow-xs'
                  : 'text-[#5A525E] hover:text-[#29252B] hover:bg-[#F7EFE5]/80'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#789477]" />
              <span>{t('nav_twin', '3D Digital Twin')}</span>
            </button>

            <button
              onClick={() => setActiveTab('journey')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'journey'
                  ? 'bg-[#C66B4E] text-white shadow-xs'
                  : 'text-[#5A525E] hover:text-[#29252B] hover:bg-[#F7EFE5]/80'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-[#789477]" />
              <span>{t('nav_journey', 'Journey Planner')}</span>
              {itinerary && (
                <span className="w-2 h-2 rounded-full bg-[#789477] inline-block" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('essentials')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'essentials'
                  ? 'bg-[#C66B4E] text-white shadow-xs'
                  : 'text-[#5A525E] hover:text-[#29252B] hover:bg-[#F7EFE5]/80'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#C66B4E]" />
              <span>{t('nav_essentials', 'Essentials')}</span>
            </button>

            <button
              onClick={() => setActiveTab('intelligence')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'intelligence'
                  ? 'bg-[#C66B4E] text-white shadow-xs'
                  : 'text-[#5A525E] hover:text-[#29252B] hover:bg-[#F7EFE5]/80'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#B99BCB]" />
              <span>{t('nav_intelligence', 'Travel Intelligence')}</span>
            </button>

            <button
              onClick={() => setActiveTab('mytravel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mytravel'
                  ? 'bg-[#C66B4E] text-white shadow-xs'
                  : 'text-[#5A525E] hover:text-[#29252B] hover:bg-[#F7EFE5]/80'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-[#C66B4E]" />
              <span>{t('nav_mytravel', 'My Travel')}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#C66B4E] text-white shadow-xs'
                  : 'text-[#5A525E] hover:text-[#29252B] hover:bg-[#F7EFE5]/80'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-[#5A525E]" />
              <span>{t('nav_settings', 'Settings')}</span>
            </button>
          </nav>

          {/* Right Action Cluster: Global Language Selector, Experience Mode, Trip Basket & Health */}
          <div className="flex items-center gap-2">
            {/* Global Multilingual Selector Dropdown */}
            <GlobalLanguageSelector />

            {/* Experience Mode Interactive Quick Switcher */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${modeBadgeColor}`}
                title="Click to switch Multi-Age Experience Mode instantly"
              >
                {isFamilyMode ? <Smile className="w-3 h-3" /> : isTeenMode ? <Sparkles className="w-3 h-3" /> : <Compass className="w-3 h-3" />}
                <span>{modeTitle.split(' ')[0]}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {isModeMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-[#E5DDD2] py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-[#625966] uppercase tracking-wider border-b border-[#E5DDD2]">
                    Switch Experience Mode
                  </div>
                  <button
                    onClick={() => { setMode('adult'); setIsModeMenuOpen(false); }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#FAF6F0] transition-colors cursor-pointer ${
                      isAdultMode ? 'font-bold text-[#C66B4E] bg-[#FAF6F0]' : 'text-[#403944]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-[#C66B4E]" />
                      <span>Standard Explorer (Adult)</span>
                    </div>
                    {isAdultMode && <Check className="w-3.5 h-3.5 text-[#C66B4E]" />}
                  </button>
                  <button
                    onClick={() => { setMode('teen'); setIsModeMenuOpen(false); }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#FFF0F4] transition-colors cursor-pointer ${
                      isTeenMode ? 'font-bold text-[#FF5C8A] bg-[#FFF0F4]' : 'text-[#403944]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF5C8A]" />
                      <span>Trendsetter (Teenager)</span>
                    </div>
                    {isTeenMode && <Check className="w-3.5 h-3.5 text-[#FF5C8A]" />}
                  </button>
                  <button
                    onClick={() => { setMode('family'); setIsModeMenuOpen(false); }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#F1F8E9] transition-colors cursor-pointer ${
                      isFamilyMode ? 'font-bold text-[#4CAF50] bg-[#F1F8E9]' : 'text-[#403944]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smile className="w-3.5 h-3.5 text-[#4CAF50]" />
                      <span>Family & Junior Explorer</span>
                    </div>
                    {isFamilyMode && <Check className="w-3.5 h-3.5 text-[#4CAF50]" />}
                  </button>
                </div>
              )}
            </div>

            {/* Trip Basket Button */}
            <button
              onClick={() => setIsBasketOpen(true)}
              className="relative p-2 rounded-xl bg-white hover:bg-[#FAF6F0] text-[#29252B] border border-[#EAE0D0] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Open Trip Selection Basket"
              aria-label={`Trip basket with ${basket.length} places`}
            >
              <ShoppingBag className="w-4 h-4 text-[#C66B4E]" />
              <span className="text-xs font-bold hidden sm:inline">{t('basket', 'Basket')}</span>
              {basket.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#C66B4E] text-white font-bold text-[10px]">
                  {basket.length}
                </span>
              )}
            </button>

            {/* Live Free Tier Engine Telemetry */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-[#EAE0D0] text-xs shadow-xs">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  health?.status === 'ok' ? 'bg-[#789477] animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[10px] uppercase font-bold text-[#C66B4E] tracking-wider">
                Google Gemini
              </span>
              <span className="text-[#D5C1A3]">|</span>
              <span className="font-mono text-[11px] font-semibold text-[#29252B]">
                {health?.active_model || health?.primary_model || 'gemini-3.5-flash-lite'}
              </span>
              <span className="text-[9px] bg-[#EFF5EE] text-[#4F734E] border border-[#789477]/30 px-1.5 py-0.2 rounded font-semibold">
                Free Tier (₹0)
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Display Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 overflow-hidden relative outline-hidden">
        {activeTab === 'discover' && (
          <DiscoverView
            season={season}
            onSeasonChange={setSeason}
            onAskHana={handleAskHana}
            onExplore3D={(pid) => {
              if (pid) setSelectedPlaceId(pid);
              setActiveTab('twin');
            }}
            onPlanTrip={() => setActiveTab('journey')}
            onSelectPlace={(pid) => setSelectedPlaceId(pid)}
            onAddToItinerary={handleAddStop}
          />
        )}

        {activeTab === 'hana' && (
          <HanaWorkspace
            currentSessionId={sessionId}
            onSelectSession={(sid) => setSessionId(sid)}
            onItineraryUpdated={(itin) => setItinerary(itin)}
            onProfileUpdated={(p) => setProfile(p)}
            activeModel={health?.active_model || health?.primary_model || 'gemini-3.5-flash-lite'}
            externalPrompt={externalPrompt}
          />
        )}

        {activeTab === 'twin' && (
          twinMode2D ? (
            <div className="h-full flex flex-col">
              <div className="p-2 bg-white border-b border-[#EAE0D0] flex justify-between items-center px-4 shadow-xs">
                <span className="text-xs text-[#29252B] font-bold">Accessible 2D Vector Map</span>
                <button
                  onClick={() => setTwinMode2D(false)}
                  className="px-3 py-1 rounded-lg bg-[#C66B4E] hover:bg-[#B2583D] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Switch to 3D Digital Twin
                </button>
              </div>
              <div className="flex-1">
                <LiveRegionMap
                  onAskHana={handleAskHana}
                  onSelectPlace={(pid) => setSelectedPlaceId(pid)}
                  selectedPlaceId={selectedPlaceId}
                />
              </div>
            </div>
          ) : (
            <DigitalTwin3D
              itinerary={itinerary}
              onAskHana={handleAskHana}
              onSelectPlace={(pid) => setSelectedPlaceId(pid)}
              selectedPlaceId={selectedPlaceId}
              onSwitchTo2D={() => setTwinMode2D(true)}
              onAddToItinerary={(pid) => {
                const matched = ALL_VERIFIED_LANDMARKS.find(l => l.id === pid);
                if (matched) {
                  handleAddStop({
                    place_id: matched.id,
                    name_ja: matched.name_ja,
                    name_en: matched.name_en,
                    latitude: matched.lat,
                    longitude: matched.lon,
                    coords_source: 'MLIT',
                    primary_category: matched.category,
                    opening_status: 'ALWAYS_OPEN',
                    opening_hours_source: 'official',
                    general_admission_type: matched.admission.toLowerCase().includes('free') ? 'FREE' : 'PAID',
                    admission_fee_source: 'official',
                    accessibility_status: (matched.accessibility.toLowerCase().includes('barrier-free') || matched.accessibility.toLowerCase().includes('paved')) ? 'VERIFIED_ACCESSIBLE' : 'PARTIAL_STEPS',
                    accessibility_source: 'official',
                    fuji_view_rating: matched.fuji_rating,
                    indoor_alternative: false,
                    provenance_tier: 'OFFICIAL_GOV',
                    source_url: '',
                    required_attribution: '',
                    source_retrieval_date: '',
                    last_verified_date: ''
                  });
                }
              }}
            />
          )
        )}

        {activeTab === 'journey' && (
          <div className="h-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <YourJourneyPanel
              itinerary={itinerary}
              onAskHana={handleAskHana}
              onRemoveStop={handleRemoveStop}
              onReorderStop={handleReorderStop}
              onOpenExport={() => setIsExportOpen(true)}
              onViewIn3D={() => setActiveTab('twin')}
            />
          </div>
        )}

        {activeTab === 'essentials' && (
          <div className="h-full overflow-y-auto">
            <TravelEssentialsView />
          </div>
        )}

        {activeTab === 'intelligence' && (
          <TravelIntelligenceView onAskHana={handleAskHana} />
        )}

        {activeTab === 'mytravel' && (
          <MyTravelView onAskHana={handleAskHana} />
        )}

        {activeTab === 'settings' && (
          <ProfileSettingsView activeModel={health?.active_model || health?.primary_model || 'gemini-3.5-flash-lite'} />
        )}
      </main>

      {/* Slide-out Trip Basket Drawer */}
      <TripBasketDrawer
        isOpen={isBasketOpen}
        onClose={() => setIsBasketOpen(false)}
        basket={basket}
        onRemoveFromBasket={handleRemoveFromBasket}
        onClearBasket={handleClearBasket}
        onReorderBasket={handleReorderBasket}
        onGenerateWithHana={handleGenerateWithHana}
        onViewIn3D={handleViewBasketIn3D}
      />

      {/* Share & Export Itinerary Modal (QR + PDF) */}
      <TripExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        itinerary={itinerary}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ExperienceModeProvider>
        <AppInner />
      </ExperienceModeProvider>
    </LanguageProvider>
  );
};
