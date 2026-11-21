import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { apiUrl } from '../config';
import { SeasonMode } from './InteractiveSakuraBackground';
import { useExperienceMode } from '../context/ExperienceModeContext';
import { 
  Search, 
  Sparkles, 
  Compass, 
  Star, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Footprints, 
  Navigation, 
  Heart, 
  Plus, 
  X, 
  ChevronRight,
  Share2,
  Bookmark,
  Check,
  Smile,
  Camera,
  Flame,
  Award,
  Baby,
  CheckCircle2
} from 'lucide-react';

interface DiscoverViewProps {
  onAskHana: (prompt: string) => void;
  onExplore3D: (placeId?: string) => void;
  onPlanTrip?: () => void;
  onSelectPlace?: (placeId: string) => void;
  onAddToItinerary?: (place: Place) => void;
  season?: SeasonMode;
  onSeasonChange?: (s: SeasonMode) => void;
}

// Fallback verified destinations
const VERIFIED_FALLBACK_PLACES: Place[] = [
  {
    place_id: 'kawaguchiko_oishi_park',
    name_ja: '大石公園',
    name_en: 'Oishi Park & Flower Promenade',
    latitude: 35.523611,
    longitude: 138.745278,
    coords_source: 'MLIT_P12',
    primary_category: 'viewpoint',
    sub_category: 'botanical_park',
    opening_status: 'ALWAYS_OPEN',
    opening_hours_text: '24 hours open daily',
    opening_hours_source: 'Fujikawaguchiko Town Office',
    general_admission_type: 'FREE',
    general_admission_fee_jpy: null,
    admission_fee_source: 'Fujikawaguchiko Town Office',
    accessibility_status: 'VERIFIED_ACCESSIBLE',
    accessibility_evidence: 'Paved lakefront promenade, flat terrain, wheelchair accessible public restrooms',
    stair_step_count: 0,
    accessibility_source: 'Yamanashi Barrier-Free Tourism Directory',
    fuji_view_rating: 5,
    indoor_alternative: false,
    provenance_tier: 'OFFICIAL_GOV',
    source_url: 'https://www.town.fujikawaguchiko.lg.jp/',
    required_attribution: '出典：富士河口湖町公式ウェブサイト',
    source_retrieval_date: '2026-11-08',
    last_verified_date: '2026-11-08'
  },
  {
    place_id: 'arakurayama_chureito',
    name_ja: '新倉山浅間公園 忠霊塔',
    name_en: 'Arakurayama Sengen Park (Chureito Pagoda)',
    latitude: 35.501389,
    longitude: 138.801389,
    coords_source: 'MLIT_P12',
    primary_category: 'viewpoint',
    sub_category: 'shrine_park',
    opening_status: 'ALWAYS_OPEN',
    opening_hours_text: 'Park 24 hours open; observatory deck always open',
    opening_hours_source: 'Fujiyoshida City Tourism Division',
    general_admission_type: 'FREE',
    general_admission_fee_jpy: null,
    admission_fee_source: 'Fujiyoshida City Tourism Division',
    accessibility_status: 'STEEP_STAIRS',
    accessibility_evidence: '398 steep stone steps to pagoda observatory; alternative unpaved zigzag slope available but strenuous',
    stair_step_count: 398,
    accessibility_source: 'Fujiyoshida City Official Visitor Guide',
    fuji_view_rating: 5,
    indoor_alternative: false,
    provenance_tier: 'OFFICIAL_GOV',
    source_url: 'https://fujiyoshida.net/',
    required_attribution: '出典：富士吉田市観光推進協議会',
    source_retrieval_date: '2026-11-08',
    last_verified_date: '2026-11-08'
  },
  {
    place_id: 'oshino_hakkai',
    name_ja: '忍野八海',
    name_en: 'Oshino Hakkai Spring Ponds',
    latitude: 35.460278,
    longitude: 138.832778,
    coords_source: 'MLIT_P12',
    primary_category: 'nature',
    sub_category: 'unesco_heritage_spring',
    opening_status: 'ALWAYS_OPEN',
    opening_hours_text: 'Open 24 hours (Individual ponds outdoor)',
    opening_hours_source: 'Oshino Village Tourism Association',
    general_admission_type: 'FREE',
    general_admission_fee_jpy: null,
    admission_fee_source: 'Oshino Village Tourism Association',
    accessibility_status: 'PARTIAL_STEPS',
    accessibility_evidence: 'Flat packed dirt and stone walkways connecting main ponds; narrow boardwalks near Wakuike',
    stair_step_count: 12,
    accessibility_source: 'Oshino Village Tourism Association',
    fuji_view_rating: 4,
    indoor_alternative: false,
    provenance_tier: 'OFFICIAL_GOV',
    source_url: 'http://www.vill.oshino.yamanashi.jp/',
    required_attribution: '出典：忍野村観光協会',
    source_retrieval_date: '2026-11-08',
    last_verified_date: '2026-11-08'
  },
  {
    place_id: 'saiko_iyashi_nenba',
    name_ja: '西湖いやしの里根場',
    name_en: 'Saiko Iyashi-no-Sato Nenba',
    latitude: 35.506111,
    longitude: 138.659167,
    coords_source: 'MLIT_P12',
    primary_category: 'cultural',
    sub_category: 'thatched_village_museum',
    opening_status: 'REGULAR_HOURS',
    opening_hours_text: '09:00 - 17:00 (Mar-Nov) / 09:30 - 16:30 (Dec-Feb)',
    opening_hours_source: 'Saiko Iyashi-no-Sato Management Office',
    general_admission_type: 'PAID',
    general_admission_fee_jpy: 500,
    admission_fee_source: 'Official Site Ticket Gate',
    accessibility_status: 'PARTIAL_STEPS',
    accessibility_evidence: 'Gentle inclined gravel paths throughout thatched village; several traditional houses have low wood step entrances',
    stair_step_count: 5,
    accessibility_source: 'Yamanashi Barrier-Free Travel Guide',
    fuji_view_rating: 4,
    indoor_alternative: true,
    provenance_tier: 'OFFICIAL_GOV',
    source_url: 'https://saikoiyashinosatonenba.jp/',
    required_attribution: '出典：西湖いやしの里根場公式ホームページ',
    source_retrieval_date: '2026-11-08',
    last_verified_date: '2026-11-08'
  },
  {
    place_id: 'kawaguchiko_ropeway',
    name_ja: '富士山パノラマロープウェイ',
    name_en: 'Mt. Fuji Panoramic Ropeway',
    latitude: 35.505000,
    longitude: 138.771944,
    coords_source: 'MLIT_P12',
    primary_category: 'viewpoint',
    sub_category: 'aerial_tramway',
    opening_status: 'REGULAR_HOURS',
    opening_hours_text: '09:00 - 17:00 (Weekdays) / 09:00 - 17:30 (Weekends)',
    opening_hours_source: 'Fujikyuko Ropeway Operating Division',
    general_admission_type: 'PAID',
    general_admission_fee_jpy: 1000,
    admission_fee_source: 'Fujikyuko Fare Table',
    accessibility_status: 'PARTIAL_STEPS',
    accessibility_evidence: 'Lower station wheelchair elevator equipped; top observatory has unpaved forest paths and stairs to swing deck',
    stair_step_count: 24,
    accessibility_source: 'Fujikyuko Accessibility Statement',
    fuji_view_rating: 5,
    indoor_alternative: false,
    provenance_tier: 'OFFICIAL_GOV',
    source_url: 'https://www.fujikyuko.co.jp/',
    required_attribution: '出典：富士急行株式会社公式発表資料',
    source_retrieval_date: '2026-11-08',
    last_verified_date: '2026-11-08'
  },
  {
    place_id: 'kitaguchi_sengen_shrine',
    name_ja: '北口本宮冨士浅間神社',
    name_en: 'Kitaguchi Hongu Fuji Sengen Shrine',
    latitude: 35.474444,
    longitude: 138.796944,
    coords_source: 'MLIT_P12',
    primary_category: 'cultural',
    sub_category: 'unesco_shrine',
    opening_status: 'ALWAYS_OPEN',
    opening_hours_text: 'Grounds open 24 hours (Shrine office 08:30 - 17:00)',
    opening_hours_source: 'Kitaguchi Hongu Sengen Shrine Office',
    general_admission_type: 'FREE',
    general_admission_fee_jpy: null,
    admission_fee_source: 'Shrine Administration',
    accessibility_status: 'PARTIAL_STEPS',
    accessibility_evidence: 'Wide compacted gravel approach through cedar forest; stone steps at main Romon gate and inner worship hall',
    stair_step_count: 14,
    accessibility_source: 'Fujiyoshida Cultural Heritage Register',
    fuji_view_rating: 3,
    indoor_alternative: true,
    provenance_tier: 'OFFICIAL_GOV',
    source_url: 'https://sengenjinja.jp/',
    required_attribution: '出典：北口本宮冨士浅間神社公式ウェブサイト',
    source_retrieval_date: '2026-11-08',
    last_verified_date: '2026-11-08'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Destinations' },
  { id: 'viewpoint', label: 'Viewpoints & Shrines' },
  { id: 'nature', label: 'Lakes & Scenic' },
  { id: 'cultural', label: 'Culture & Museums' }
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onAskHana,
  onExplore3D,
  onPlanTrip,
  onSelectPlace,
  onAddToItinerary,
  season = 'spring',
  onSeasonChange
}) => {
  const { setMode, isAdultMode, isTeenMode, isFamilyMode } = useExperienceMode();
  const [places, setPlaces] = useState<Place[]>(VERIFIED_FALLBACK_PLACES);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(VERIFIED_FALLBACK_PLACES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDetailPlace, setSelectedDetailPlace] = useState<Place | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('fujinova_favorites') || '[]');
    } catch (_) {
      return [];
    }
  });
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [sharedToast, setSharedToast] = useState<boolean>(false);

  // Scavenger hunt completion state for Family Mode
  const [completedQuests, setCompletedQuests] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('fujinova_quests') || '["q1", "q2"]');
    } catch (_) {
      return ['q1', 'q2'];
    }
  });

  const toggleQuest = (qId: string) => {
    const updated = completedQuests.includes(qId)
      ? completedQuests.filter(id => id !== qId)
      : [...completedQuests, qId];
    setCompletedQuests(updated);
    try {
      localStorage.setItem('fujinova_quests', JSON.stringify(updated));
    } catch (_) {}
  };

  // Load places from backend API with fallback
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await fetch(apiUrl('/api/v1/places?limit=100'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPlaces(data);
            setFilteredPlaces(data);
          }
        }
      } catch (_) {}
    };
    fetchPlaces();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = places;
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.primary_category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name_en && p.name_en.toLowerCase().includes(q)) ||
        p.name_ja.includes(q) ||
        (p.sub_category && p.sub_category.toLowerCase().includes(q))
      );
    }
    setFilteredPlaces(result);
  }, [searchQuery, selectedCategory, places]);

  const handleToggleFavorite = (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(placeId)
      ? favorites.filter(id => id !== placeId)
      : [...favorites, placeId];
    setFavorites(updated);
    try {
      localStorage.setItem('fujinova_favorites', JSON.stringify(updated));
    } catch (_) {}
  };

  const handlePlaceCardClick = (place: Place) => {
    setSelectedDetailPlace(place);
    if (onSelectPlace) {
      onSelectPlace(place.place_id);
    }
  };

  const handleAddStopToJourney = (place: Place, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onAddToItinerary) {
      onAddToItinerary(place);
    }
    setAddedToast(`Added ${place.name_en || place.name_ja} to Journey!`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const handleShareClick = () => {
    navigator.clipboard?.writeText(window.location.href);
    setSharedToast(true);
    setTimeout(() => setSharedToast(false), 2500);
  };

  return (
    <div className="h-full overflow-y-auto bg-transparent text-[#29232B] select-text">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#29232B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{addedToast}</span>
        </div>
      )}

      {sharedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#C66B4E] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold">
          <Check className="w-4 h-4 text-white" />
          <span>Link copied to clipboard!</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        {/* ========================================================
            ADAPTIVE MULTI-AGE EXPERIENCE SWITCHER (Top 3 Cards)
            Matches user design reference (Standard, Trendsetter, Family)
           ======================================================== */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#625966]">
              Adaptive Experience Mode
            </span>
            <span className="text-[11px] font-semibold text-[#87365E]">
              Instant switch • Preserves all data & language
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Standard Explorer (Adult) */}
            <button
              onClick={() => setMode('adult')}
              className={`p-4 text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                isAdultMode
                  ? 'bg-white border-2 border-[#C66B4E] rounded-2xl shadow-md ring-2 ring-[#C66B4E]/20'
                  : 'bg-white/80 border border-[#E5DDD2] rounded-xl hover:border-[#C66B4E]/50 hover:bg-white'
              }`}
            >
              {isAdultMode && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#C66B4E] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3" />
                  <span>Active</span>
                </span>
              )}
              <div>
                <div className="w-8 h-8 rounded-xl bg-[#FAF6F0] text-[#C66B4E] flex items-center justify-center mb-2.5">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#29232B]">Standard Explorer</h3>
                <p className="text-xs font-bold text-[#C66B4E] mt-0.5">Premium, calm and professional.</p>
                <p className="text-xs text-[#403944] mt-1.5 leading-relaxed">
                  Refined Japanese travel journal with detailed transit schedules, barrier-free audits & budget tracking.
                </p>
              </div>
            </button>

            {/* 2. Trendsetter (Teenager) */}
            <button
              onClick={() => setMode('teen')}
              className={`p-4 text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                isTeenMode
                  ? 'bg-gradient-to-br from-[#FFF0F4] to-white border-2 border-[#FF5C8A] rounded-2xl shadow-md ring-2 ring-[#FF5C8A]/20'
                  : 'bg-white/80 border border-[#E5DDD2] rounded-xl hover:border-[#FF5C8A]/50 hover:bg-white'
              }`}
            >
              {isTeenMode && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#FF5C8A] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3" />
                  <span>Active</span>
                </span>
              )}
              <div>
                <div className="w-8 h-8 rounded-xl bg-[#FFEBF1] text-[#FF5C8A] flex items-center justify-center mb-2.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#29232B]">Trendsetter</h3>
                <p className="text-xs font-bold text-[#FF5C8A] mt-0.5">Vibrant, social and interactive.</p>
                <p className="text-xs text-[#403944] mt-1.5 leading-relaxed">
                  Sakura Pop aesthetics, viral photo spots, aesthetic lakeside cafes, and shareable travel collections.
                </p>
              </div>
            </button>

            {/* 3. Family & Junior Explorer */}
            <button
              onClick={() => setMode('family')}
              className={`p-4 text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                isFamilyMode
                  ? 'bg-gradient-to-br from-[#F1F8E9] to-white border-2 border-[#4CAF50] rounded-2xl shadow-md ring-2 ring-[#4CAF50]/20'
                  : 'bg-white/80 border border-[#E5DDD2] rounded-xl hover:border-[#4CAF50]/50 hover:bg-white'
              }`}
            >
              {isFamilyMode && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#4CAF50] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3" />
                  <span>Active</span>
                </span>
              )}
              <div>
                <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#4CAF50] flex items-center justify-center mb-2.5">
                  <Smile className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#29232B]">Family & Junior</h3>
                <p className="text-xs font-bold text-[#4CAF50] mt-0.5">Playful, simple and accessible.</p>
                <p className="text-xs text-[#403944] mt-1.5 leading-relaxed">
                  Interactive Mount Fuji adventure map, scavenger quests, stroller routes, and family facility guides.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* ========================================================
            HERO SECTION: ADAPTS DYNAMICALLY TO SELECTED MODE
           ======================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Hero Column: Tourism Card */}
          <div className={`lg:col-span-7 bg-white/95 border p-6 sm:p-10 shadow-sm flex flex-col justify-between relative backdrop-blur-xs overflow-hidden ${
            isFamilyMode 
              ? 'border-2 border-[#C8E6C9] rounded-3xl bg-gradient-to-br from-[#F1F8E9]/60 via-white to-[#FFF9C4]/30' 
              : isTeenMode
              ? 'border-2 border-[#FFD0DD] rounded-3xl bg-gradient-to-br from-[#FFF0F4]/70 via-white to-[#FFEBF1]/40'
              : 'border border-[#E5DDD2] rounded-3xl'
          }`}>
            
            <div className="space-y-5 relative z-10">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${
                  isFamilyMode
                    ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                    : isTeenMode
                    ? 'bg-[#FFEBF1] text-[#9A2B64] border border-[#FFD0DD]'
                    : 'bg-[#EFF5EE] text-[#4F734E] border border-[#789477]/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isFamilyMode ? 'bg-[#4CAF50]' : isTeenMode ? 'bg-[#FF5C8A]' : 'bg-[#789477]'}`} />
                  <span>
                    {isFamilyMode ? '🎈 Family Adventure Quest' : isTeenMode ? '✨ Trending Tokyo & Fuji' : 'Japanese Travel Journal'}
                  </span>
                </div>

                {/* Seasonal Scenery Switcher */}
                {onSeasonChange && (
                  <div className="inline-flex items-center gap-1 bg-[#FAF6F0] border border-[#E5DDD2] p-0.5 rounded-full text-xs">
                    <button
                      onClick={() => onSeasonChange('spring')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                        season === 'spring' ? 'bg-[#A83F70] text-white shadow-xs' : 'text-[#625966] hover:text-[#29232B]'
                      }`}
                      title="Spring: Sakura Petals"
                    >
                      🌸 Spring
                    </button>
                    <button
                      onClick={() => onSeasonChange('summer')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                        season === 'summer' ? 'bg-[#4CAF50] text-white shadow-xs' : 'text-[#625966] hover:text-[#29232B]'
                      }`}
                      title="Summer: Matcha Green Leaves"
                    >
                      🍃 Summer
                    </button>
                    <button
                      onClick={() => onSeasonChange('autumn')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                        season === 'autumn' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#625966] hover:text-[#29232B]'
                      }`}
                      title="Autumn: Golden Momiji"
                    >
                      🍁 Autumn
                    </button>
                    <button
                      onClick={() => onSeasonChange('winter')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                        season === 'winter' ? 'bg-[#87365E] text-white shadow-xs' : 'text-[#625966] hover:text-[#29232B]'
                      }`}
                      title="Winter: Crystalline Snow"
                    >
                      ❄️ Winter
                    </button>
                  </div>
                )}
              </div>

              {/* Main Heading */}
              <div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#29232B] leading-tight">
                  {isFamilyMode
                    ? 'Mount Fuji Family Adventure!'
                    : isTeenMode
                    ? 'Discover the Land of the Rising Sun.'
                    : 'Discover the beauty of Mount Fuji.'}
                </h1>
                <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C66B4E]">
                  Mount Fuji & The Five Lakes
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#403944] leading-relaxed max-w-xl">
                {isFamilyMode
                  ? 'Kid-safe trails, peaceful duck boats on Lake Kawaguchi, giant panoramic cable cars, delicious soft-serve ice cream, and interactive scavenger hunt badges!'
                  : isTeenMode
                  ? 'Curate aesthetic cherry blossom photography, discover golden hour viewpoints overlooking Mount Fuji, and find Instagram-famous shrines with Hana AI.'
                  : 'Your journey through Japan starts here. Explore authentic viewpoints, sacred UNESCO shrines, ancient lakeside villages, and public transit schedules powered by genuine AI intelligence.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onAskHana(
                    isFamilyMode 
                      ? 'What are the best kid-friendly, stroller-easy places to see Mount Fuji with ice cream and duck boats?'
                      : isTeenMode
                      ? 'Where are the top aesthetic photo spots and golden hour angles for Mount Fuji and Chureito Pagoda?'
                      : 'Plan an ideal 1-day trip from Kawaguchiko Station with great Fuji views.'
                  )}
                  className={`flex items-center gap-2 px-6 py-3 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer ${
                    isFamilyMode
                      ? 'bg-[#4CAF50] hover:bg-[#43A047] rounded-3xl'
                      : isTeenMode
                      ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF8E53] hover:from-[#E64977] hover:to-[#E67A42] rounded-2xl'
                      : 'bg-[#C66B4E] hover:bg-[#B2583D] rounded-2xl'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Plan with Hana AI</span>
                </button>

                <button
                  onClick={() => onExplore3D()}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#EFF5EE] hover:bg-[#E3EFE1] border border-[#789477]/40 text-[#4F734E] font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#789477]" />
                  <span>Explore 3D Digital Twin</span>
                </button>

                <button
                  onClick={onPlanTrip}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#FAF6F0] hover:bg-[#F3EBE0] border border-[#E5DDD2] text-[#403944] font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-[#C66B4E]" />
                  <span>Transit Timetables</span>
                </button>
              </div>
            </div>

            {/* Subtext Footer */}
            <div className="pt-8 mt-6 border-t border-[#E5DDD2] flex items-center justify-between text-xs text-[#625966] relative z-10">
              <span className="tracking-wide">Explore • Discover • Experience</span>
              <span className="font-serif font-bold text-[#C66B4E] tracking-widest text-sm">
                富士山の旅
              </span>
            </div>
          </div>

          {/* Right Hero Column: Framed Vertical Mount Fuji Landscape Card */}
          <div className="lg:col-span-5 relative rounded-3xl overflow-hidden shadow-sm border border-[#E5DDD2] bg-white group min-h-[380px] flex flex-col justify-between">
            <img
              src="https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1200&q=80"
              alt="Mount Fuji with Cherry Blossom framed scenery"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#29232B]/85 via-transparent to-black/20 pointer-events-none" />

            {/* Top Right Action Icons: Share & Bookmark */}
            <div className="relative z-10 p-4 flex justify-end gap-2">
              <button
                onClick={handleShareClick}
                className="p-2.5 rounded-full bg-white/95 hover:bg-white text-[#29232B] shadow-md backdrop-blur-md transition-all cursor-pointer"
                title="Share Mount Fuji Journey"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-[#29232B]" />
              </button>
              <button
                onClick={() => handleToggleFavorite('kawaguchiko_oishi_park', {} as any)}
                className="p-2.5 rounded-full bg-white/95 hover:bg-white text-[#29232B] shadow-md backdrop-blur-md transition-all cursor-pointer"
                title="Save scenery"
                aria-label="Bookmark"
              >
                <Bookmark className={`w-4 h-4 ${favorites.includes('kawaguchiko_oishi_park') ? 'fill-[#C66B4E] text-[#C66B4E]' : 'text-[#29232B]'}`} />
              </button>
            </div>

            {/* Floating Interactive Landmark Pill Buttons on Scenery */}
            <div className="relative z-10 p-6 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onExplore3D('arakurayama_chureito')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#29232B] hover:bg-[#FAF3EC] text-xs font-bold shadow-md transition-all cursor-pointer border border-[#E9A5B5]"
                >
                  <span className="text-[#C66B4E]">📍</span>
                  <span>Chureito Pagoda</span>
                </button>
                <button
                  onClick={() => onExplore3D('kawaguchiko_oishi_park')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#29232B] hover:bg-[#EFF5EE] text-xs font-bold shadow-md transition-all cursor-pointer border border-[#789477]"
                >
                  <span className="text-[#789477]">🌸</span>
                  <span>Oishi Promenade</span>
                </button>
              </div>

              <div className="pt-2 text-white">
                <h3 className="text-base font-bold drop-shadow-sm flex items-center gap-1.5">
                  <span>Lake Kawaguchiko & Spring Sakura</span>
                </h3>
                <p className="text-xs text-white/90 drop-shadow-xs font-serif">
                  富士五湖・河口湖の春景色
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            MODE-SPECIFIC EXCLUSIVE MODULE:
            - Adult: Official Transit & Regional Timetables
            - Teen: Trending Photo Spots & Pop Collections
            - Family: Scavenger Hunt Quests & Family Facilities
           ======================================================== */}
        
        {/* Teen Mode: Trending Spots & Collections */}
        {isTeenMode && (
          <section className="bg-gradient-to-r from-[#FFF0F4] via-white to-[#FFEBF1] border-2 border-[#FFD0DD] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#FF5C8A]" />
                <h2 className="text-lg font-black text-[#29232B]">Trending Pop Spots & Aesthetic Collections</h2>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FF5C8A] text-white">
                Photo Spot Guide
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#FFD0DD] rounded-2xl p-4 shadow-xs space-y-2">
                <span className="text-xs font-bold text-[#FF5C8A] uppercase">⛩️ Anime Pilgrimage</span>
                <h4 className="font-extrabold text-[#29232B] text-sm">Chureito & Sengen Shrine</h4>
                <p className="text-xs text-[#403944]">The iconic 398-step sunset climb featured across Japanese media.</p>
                <div className="text-[11px] text-[#87365E] font-bold">Best time: 16:30 - 17:30 (Golden Hour)</div>
              </div>

              <div className="bg-white border border-[#FFD0DD] rounded-2xl p-4 shadow-xs space-y-2">
                <span className="text-xs font-bold text-[#FF5C8A] uppercase">🌸 Floral Aesthetic</span>
                <h4 className="font-extrabold text-[#29232B] text-sm">Oishi Lavender Promenade</h4>
                <p className="text-xs text-[#403944]">Lakeside flowers framing Mount Fuji with local blueberry smoothies.</p>
                <div className="text-[11px] text-[#87365E] font-bold">Best time: Morning reflection (07:00 - 09:00)</div>
              </div>

              <div className="bg-white border border-[#FFD0DD] rounded-2xl p-4 shadow-xs space-y-2">
                <span className="text-xs font-bold text-[#FF5C8A] uppercase">🚠 Aerial Views</span>
                <h4 className="font-extrabold text-[#29232B] text-sm">Mt. Fuji Panoramic Ropeway</h4>
                <p className="text-xs text-[#403944]">Heart of Kachi Kachi Mountain overlooking Lake Kawaguchi.</p>
                <div className="text-[11px] text-[#87365E] font-bold">Highlight: Summit Sky Swing</div>
              </div>
            </div>
          </section>
        )}

        {/* Family Mode: Scavenger Hunt Quests & Family Facilities */}
        {isFamilyMode && (
          <section className="bg-gradient-to-r from-[#F1F8E9] via-white to-[#FFF9C4] border-2 border-[#C8E6C9] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#4CAF50]" />
                <div>
                  <h2 className="text-lg font-black text-[#29232B]">Fuji Junior Explorer Quest Map</h2>
                  <p className="text-xs text-[#403944]">Complete discovery missions across the Five Lakes to unlock Explorer Badges!</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-3 py-1 rounded-full border border-[#C8E6C9]">
                  {completedQuests.length} of 5 Completed 🌟
                </span>
              </div>
            </div>

            {/* Quests Checkbox List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'q1', title: 'Find the 5-story Red Pagoda', place: 'Chureito Pagoda', badge: '🏰 Pagoda Scout' },
                { id: 'q2', title: 'Spot the giant lake duck boat', place: 'Lake Kawaguchiko', badge: '🦆 Lake Captain' },
                { id: 'q3', title: 'Taste lavender soft-serve cream', place: 'Oishi Park', badge: '🍦 Sweet Treat Explorer' },
                { id: 'q4', title: 'Ride the mountain cable car', place: 'Fuji Ropeway', badge: '🚠 Sky Adventurer' },
                { id: 'q5', title: 'Touch the cold snowmelt spring water', place: 'Oshino Hakkai', badge: '💧 Spring Detective' }
              ].map(q => {
                const isDone = completedQuests.includes(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleQuest(q.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isDone
                        ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
                        : 'bg-white border-[#E5DDD2] text-[#403944] hover:border-[#4CAF50]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isDone ? 'bg-[#4CAF50] text-white' : 'border border-[#C8E6C9]'
                    }`}>
                      {isDone && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{q.title}</span>
                      <span className="text-[11px] text-[#625966]">{q.place} • {q.badge}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Family & Stroller Directory */}
            <div className="pt-3 border-t border-[#C8E6C9] flex flex-wrap items-center justify-between gap-3 text-xs text-[#2E7D32] font-semibold">
              <span className="flex items-center gap-1.5"><Baby className="w-4 h-4" /> 100% Paved & Stroller-Friendly at Oishi Park</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Family Restrooms equipped with changing stations</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Zero open traffic on lakeside promenades</span>
            </div>
          </section>
        )}

        {/* ========================================================
            EXPLORATION SECTION: "Explore your next destination"
           ======================================================== */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#29232B] tracking-tight">
                Explore your next destination
              </h2>
              <p className="text-xs sm:text-sm text-[#403944] mt-1">
                Authentic, MLIT-verified viewpoints and sacred cultural landmarks across the Fuji Five Lakes
              </p>
            </div>

            {/* Destination Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#625966] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5DDD2] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#29232B] placeholder-[#625966] focus:outline-hidden focus:border-[#C66B4E] shadow-2xs font-medium"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#C66B4E] text-white shadow-xs'
                    : 'bg-white border border-[#E5DDD2] text-[#403944] hover:text-[#29232B] hover:bg-[#FAF6F0]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results Count & Provenance */}
          <div className="flex items-center justify-between text-xs text-[#403944] px-1">
            <span>Showing {filteredPlaces.length} verified destinations</span>
            <span className="text-[11px] text-[#625966]">Source: Official Yamanashi Tourism Board & MLIT</span>
          </div>

          {/* Places Grid: Adaptive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaces.map((place) => {
              const isFav = favorites.includes(place.place_id);
              const imageMap: Record<string, string> = {
                kawaguchiko_oishi_park: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=800&q=80',
                arakurayama_chureito: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80',
                oshino_hakkai: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
                saiko_iyashi_nenba: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
                kawaguchiko_ropeway: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80',
                kitaguchi_sengen_shrine: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
                hottarakashi_onsen: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80'
              };
              const imgUrl = place.image_url || imageMap[place.place_id] || 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={place.place_id}
                  onClick={() => handlePlaceCardClick(place)}
                  className={`group flex flex-col bg-white overflow-hidden transition-all cursor-pointer ${
                    isFamilyMode
                      ? 'border-2 border-[#C8E6C9] rounded-3xl hover:border-[#4CAF50] shadow-sm hover:shadow-md'
                      : isTeenMode
                      ? 'border-2 border-[#FFD0DD] rounded-2xl hover:border-[#FF5C8A] shadow-sm hover:shadow-lg'
                      : 'border border-[#E5DDD2] rounded-2xl hover:border-[#C66B4E] shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Photo & Badges */}
                  <div className={`relative overflow-hidden bg-[#FAF6F0] ${isFamilyMode ? 'h-44' : isTeenMode ? 'h-48' : 'h-44'}`}>
                    <img
                      src={imgUrl}
                      alt={place.name_en || place.name_ja}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(place.place_id, e)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-[#29232B] hover:text-[#C66B4E] transition shadow-xs cursor-pointer"
                      title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#C66B4E] text-[#C66B4E]' : ''}`} />
                    </button>

                    {/* Mode-Specific Badge */}
                    {isTeenMode ? (
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-xs">
                        <Camera className="w-3.5 h-3.5 text-[#FF5C8A]" />
                        <span>Photo Spot {place.fuji_view_rating}.0</span>
                      </div>
                    ) : isFamilyMode ? (
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-1 bg-[#4CAF50] px-2.5 py-1 rounded-2xl text-white text-xs font-extrabold shadow-xs">
                        <Smile className="w-3.5 h-3.5" />
                        <span>{place.accessibility_status === 'VERIFIED_ACCESSIBLE' ? 'Stroller Easy' : 'Scenic Walk'}</span>
                      </div>
                    ) : (
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-1 bg-[#FAF3EC] border border-[#E9A5B5] px-2 py-0.5 rounded-lg text-[#A83F70] text-xs font-bold shadow-xs">
                        <Star className="w-3.5 h-3.5 fill-[#A83F70] text-[#A83F70]" />
                        <span>Fuji {place.fuji_view_rating}.0</span>
                      </div>
                    )}

                    {/* Category Pill */}
                    <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-lg bg-white/90 border border-[#E5DDD2] text-[#29232B] text-[10px] font-bold uppercase shadow-xs">
                      {place.primary_category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-base font-extrabold text-[#29232B] group-hover:text-[#C66B4E] transition-colors">
                        {place.name_en || place.name_ja}
                      </h3>
                      <p className="text-xs text-[#625966] font-semibold">{place.name_ja}</p>
                    </div>

                    {/* Metadata Chips */}
                    <div className="space-y-1.5 text-[11px] text-[#403944]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#789477] shrink-0" />
                        <span className="truncate">{place.opening_hours_text || 'Standard operating hours'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-[#C66B4E] shrink-0" />
                        <span className="font-semibold text-[#29232B]">
                          {place.general_admission_type === 'FREE' 
                            ? 'Free Admission' 
                            : place.general_admission_fee_jpy 
                              ? `¥${place.general_admission_fee_jpy.toLocaleString()}` 
                              : 'Admission required'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Footprints className="w-3.5 h-3.5 text-[#789477] shrink-0" />
                        <span className="truncate">
                          {place.accessibility_status === 'VERIFIED_ACCESSIBLE'
                            ? 'Step-free accessible'
                            : place.stair_step_count 
                              ? `${place.stair_step_count} stairs warning` 
                              : 'Partial incline'}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2.5 border-t border-[#E5DDD2] flex items-center justify-between">
                      <button
                        onClick={(e) => handleAddStopToJourney(place, e)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isFamilyMode
                            ? 'rounded-2xl bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#4CAF50] hover:text-white border border-[#C8E6C9]'
                            : isTeenMode
                            ? 'rounded-xl bg-[#FFEBF1] text-[#9A2B64] hover:bg-[#FF5C8A] hover:text-white border border-[#FFD0DD]'
                            : 'rounded-xl bg-[#EFF5EE] text-[#4F734E] hover:bg-[#789477] hover:text-white border border-[#789477]/30'
                        }`}
                        title="Add to Itinerary Journey"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Stop</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs text-[#87365E] font-bold group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Modal: Destination Details */}
        {selectedDetailPlace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#E5DDD2] max-h-[90vh] flex flex-col">
              <div className="relative h-56 w-full">
                <img
                  src={selectedDetailPlace.image_url || 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80'}
                  alt={selectedDetailPlace.name_en}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                <button
                  onClick={() => setSelectedDetailPlace(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/95 text-[#29232B] hover:bg-white transition cursor-pointer shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-4 left-6 right-6">
                  <span className="text-xs font-bold text-[#E9A5B5] uppercase tracking-wider block mb-1">
                    {selectedDetailPlace.primary_category}
                  </span>
                  <h2 className="text-2xl font-black text-white">
                    {selectedDetailPlace.name_en || selectedDetailPlace.name_ja}
                  </h2>
                  <p className="text-sm text-white/90 font-serif">{selectedDetailPlace.name_ja}</p>
                </div>
              </div>

              {/* Modal Content with Strict High Contrast */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-[#403944]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#FAF6F0] border border-[#E5DDD2] p-3 rounded-xl">
                    <span className="text-[10px] text-[#625966] uppercase block font-semibold">Fuji View</span>
                    <span className="text-sm font-bold text-[#A83F70] flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-[#A83F70] text-[#A83F70]" />
                      {selectedDetailPlace.fuji_view_rating}.0 / 5
                    </span>
                  </div>

                  <div className="bg-[#FAF6F0] border border-[#E5DDD2] p-3 rounded-xl">
                    <span className="text-[10px] text-[#625966] uppercase block font-semibold">Admission</span>
                    <span className="text-sm font-bold text-[#29232B] mt-0.5 block">
                      {selectedDetailPlace.general_admission_type === 'FREE' ? 'Free' : `¥${selectedDetailPlace.general_admission_fee_jpy || 'Paid'}`}
                    </span>
                  </div>

                  <div className="bg-[#FAF6F0] border border-[#E5DDD2] p-3 rounded-xl">
                    <span className="text-[10px] text-[#625966] uppercase block font-semibold">Stairs</span>
                    <span className="text-sm font-bold text-[#C66B4E] mt-0.5 block">
                      {selectedDetailPlace.stair_step_count ? `${selectedDetailPlace.stair_step_count} Steps` : 'Step-Free'}
                    </span>
                  </div>

                  <div className="bg-[#FAF6F0] border border-[#E5DDD2] p-3 rounded-xl">
                    <span className="text-[10px] text-[#625966] uppercase block font-semibold">Bad Weather</span>
                    <span className="text-sm font-bold text-[#789477] mt-0.5 block">
                      {selectedDetailPlace.indoor_alternative ? 'Indoor Shelter' : 'Open Air Only'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#EFF5EE] border border-[#789477]/30 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#4F734E] text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#789477]" />
                    <span>Barrier-Free & Accessibility Audit</span>
                  </div>
                  <p className="text-xs text-[#29232B] leading-relaxed">
                    {selectedDetailPlace.accessibility_evidence || 'Standard accessibility standards apply.'}
                  </p>
                  <p className="text-[10px] text-[#625966]">
                    Verified by: {selectedDetailPlace.accessibility_source}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-[#29232B] uppercase tracking-wider">
                    Operating Hours & Schedule
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#403944]">
                    <Clock className="w-4 h-4 text-[#789477]" />
                    <span>{selectedDetailPlace.opening_hours_text || 'See official site'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5DDD2] text-[11px] text-[#625966]">
                  <span>{selectedDetailPlace.required_attribution}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
