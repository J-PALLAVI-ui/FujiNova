import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { apiUrl } from '../config';
import { SeasonMode } from './InteractiveSakuraBackground';
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
  Check
} from 'lucide-react';

interface DiscoverViewProps {
  onAskHana: (prompt: string) => void;
  onExplore3D: (placeId?: string) => void;
  onPlanTrip: () => void;
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
    source_url: 'https://lake-yamanakako.com/',
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
    latitude: 35.478611,
    longitude: 138.794722,
    coords_source: 'MLIT_P12',
    primary_category: 'cultural',
    sub_category: 'unesco_world_heritage_shrine',
    opening_status: 'ALWAYS_OPEN',
    opening_hours_text: 'Shrine grounds open 24 hours; office 08:30 - 17:00',
    opening_hours_source: 'Kitaguchi Hongu Fuji Sengen Shrine Office',
    general_admission_type: 'FREE',
    general_admission_fee_jpy: null,
    admission_fee_source: 'Kitaguchi Hongu Fuji Sengen Shrine Office',
    accessibility_status: 'PARTIAL_STEPS',
    accessibility_evidence: 'Wide gravel approach through towering ancient cedar trees; gentle stone steps into main hall courtyard',
    stair_step_count: 8,
    accessibility_source: 'Yamanashi Shrine Association',
    fuji_view_rating: 3,
    indoor_alternative: false,
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
    <div className="h-full overflow-y-auto bg-transparent text-[#29252B] select-text">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#789477] px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-fade-in">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>{addedToast}</span>
        </div>
      )}

      {sharedToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#C66B4E] px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-fade-in">
          <Check className="w-4 h-4 text-white" />
          <span>Link copied to clipboard!</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
        
        {/* ========================================================
            HERO SECTION: Sakura Garden Two-Column Split Layout
            (Left: Warm Ivory Brand Card | Right: Framed Mount Fuji Landscape)
           ======================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Hero Column: Warm Ivory Tourism Card */}
          <div className="lg:col-span-7 bg-white/95 border border-[#EAE0D0] rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col justify-between relative backdrop-blur-xs overflow-hidden">
            {/* Soft decorative background leaf watermark */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#E9A5B5]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-5 relative z-10">
              {/* Header Badges: Japanese Travel Tag & Seasonal Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF5EE] border border-[#789477]/30 text-[#4F734E] text-xs font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#789477]" />
                  <span>Japanese Travel</span>
                </div>

                {/* Seasonal Scenery Switcher */}
                {onSeasonChange && (
                  <div className="inline-flex items-center gap-1 bg-[#FAF6F0] border border-[#EAE0D0] p-0.5 rounded-full text-xs">
                    <button
                      onClick={() => onSeasonChange('spring')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                        season === 'spring' ? 'bg-[#E9A5B5] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
                      }`}
                      title="Spring: Sakura Petals"
                    >
                      🌸 Spring
                    </button>
                    <button
                      onClick={() => onSeasonChange('summer')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                        season === 'summer' ? 'bg-[#789477] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
                      }`}
                      title="Summer: Matcha Green Leaves"
                    >
                      🍃 Summer
                    </button>
                    <button
                      onClick={() => onSeasonChange('autumn')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                        season === 'autumn' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
                      }`}
                      title="Autumn: Golden Momiji"
                    >
                      🍁 Autumn
                    </button>
                    <button
                      onClick={() => onSeasonChange('winter')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                        season === 'winter' ? 'bg-[#B99BCB] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
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
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#29252B] leading-tight font-sans">
                  Discover the beauty of Mount Fuji.
                </h1>
                <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C66B4E]">
                  Mount Fuji & The Five Lakes
                </p>
              </div>

              {/* Welcoming Description */}
              <p className="text-xs sm:text-sm text-[#5A525E] leading-relaxed max-w-xl">
                Your journey through Japan starts here. Explore authentic viewpoints, sacred UNESCO shrines, ancient lakeside villages, and public transit schedules powered by genuine AI intelligence.
              </p>

              {/* Action Buttons: Sunset Vermilion CTA & Secondary Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onAskHana('Plan an ideal 1-day trip from Kawaguchiko Station with great Fuji views.')}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C66B4E] hover:bg-[#B2583D] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#FDF2F4]" />
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
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#FAF6F0] hover:bg-[#F3EBE0] border border-[#EAE0D0] text-[#5A525E] font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-[#C66B4E]" />
                  <span>Transit Timetables</span>
                </button>
              </div>
            </div>

            {/* Subtext Footer */}
            <div className="pt-8 mt-6 border-t border-[#EAE0D0] flex items-center justify-between text-xs text-[#8A808F] relative z-10">
              <span className="tracking-wide">Explore • Discover • Experience</span>
              <span className="font-serif font-bold text-[#C66B4E] tracking-widest text-sm">
                富士山の旅
              </span>
            </div>
          </div>

          {/* Right Hero Column: Framed Vertical Mount Fuji Landscape Card */}
          <div className="lg:col-span-5 relative rounded-3xl overflow-hidden shadow-sm border border-[#EAE0D0] bg-white group min-h-[380px] flex flex-col justify-between">
            {/* Large Scenic Mount Fuji & Lake Kawaguchiko Image */}
            <img
              src="https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1200&q=80"
              alt="Mount Fuji with Cherry Blossom framed scenery"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            
            {/* Elegant Gradient overlays: soft light at top, subtle dark at bottom for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#29252B]/80 via-transparent to-black/20 pointer-events-none" />

            {/* Top Right Action Icons: Share & Bookmark */}
            <div className="relative z-10 p-4 flex justify-end gap-2">
              <button
                onClick={handleShareClick}
                className="p-2.5 rounded-full bg-white/90 hover:bg-white text-[#29252B] shadow-md backdrop-blur-md transition-all cursor-pointer"
                title="Share Mount Fuji Journey"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-[#29252B]" />
              </button>
              <button
                onClick={() => handleToggleFavorite('kawaguchiko_oishi_park', {} as any)}
                className="p-2.5 rounded-full bg-white/90 hover:bg-white text-[#29252B] shadow-md backdrop-blur-md transition-all cursor-pointer"
                title="Save scenery"
                aria-label="Bookmark"
              >
                <Bookmark className={`w-4 h-4 ${favorites.includes('kawaguchiko_oishi_park') ? 'fill-[#C66B4E] text-[#C66B4E]' : 'text-[#29252B]'}`} />
              </button>
            </div>

            {/* Floating Interactive Landmark Pill Buttons on Scenery */}
            <div className="relative z-10 p-6 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onExplore3D('arakurayama_chureito')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#29252B] hover:bg-[#FDF2F4] text-xs font-bold shadow-md transition-all cursor-pointer border border-[#E9A5B5]"
                >
                  <span className="text-[#C66B4E]">📍</span>
                  <span>Chureito Pagoda</span>
                </button>
                <button
                  onClick={() => onExplore3D('kawaguchiko_oishi_park')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#29252B] hover:bg-[#EFF5EE] text-xs font-bold shadow-md transition-all cursor-pointer border border-[#789477]"
                >
                  <span className="text-[#789477]">🌸</span>
                  <span>Oishi Promenade</span>
                </button>
              </div>

              <div className="pt-2 text-white">
                <h3 className="text-base font-bold drop-shadow-sm flex items-center gap-1.5">
                  <span>Lake Kawaguchiko & Spring Sakura</span>
                </h3>
                <p className="text-xs text-white/80 drop-shadow-xs font-serif">
                  富士五湖・河口湖の春景色
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            EXPLORATION SECTION: "Explore your next destination"
           ======================================================== */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#29252B] tracking-tight">
                Explore your next destination
              </h2>
              <p className="text-xs sm:text-sm text-[#5A525E] mt-1">
                Authentic, MLIT-verified viewpoints and sacred cultural landmarks across the Fuji Five Lakes
              </p>
            </div>

            {/* Destination Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#8A808F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#EAE0D0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#29252B] placeholder-[#8A808F] focus:outline-none focus:border-[#C66B4E] shadow-2xs"
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
                    : 'bg-white border border-[#EAE0D0] text-[#5A525E] hover:text-[#29252B] hover:bg-[#FAF6F0]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results Count & Provenance */}
          <div className="flex items-center justify-between text-xs text-[#5A525E] px-1">
            <span>Showing {filteredPlaces.length} verified destinations</span>
            <span className="text-[11px] text-[#8A808F]">Source: Official Yamanashi Tourism Board & MLIT</span>
          </div>

          {/* Places Grid: Clean Ivory Cards */}
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
                  className="group flex flex-col bg-white border border-[#EAE0D0] rounded-2xl overflow-hidden hover:border-[#E9A5B5] hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  {/* Photo & Badges */}
                  <div className="relative h-48 overflow-hidden bg-[#FAF6F0]">
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
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-[#29252B] hover:text-[#C66B4E] transition shadow-xs cursor-pointer"
                      title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#C66B4E] text-[#C66B4E]' : ''}`} />
                    </button>

                    {/* Fuji View Rating Badge */}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-1 bg-[#FDF2F4] border border-[#E9A5B5] px-2 py-0.5 rounded-lg text-[#C64A6A] text-xs font-bold shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-[#E9A5B5] text-[#E9A5B5]" />
                      <span>Fuji {place.fuji_view_rating}.0</span>
                    </div>

                    {/* Category Pill */}
                    <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-lg bg-white/90 border border-[#EAE0D0] text-[#29252B] text-[10px] font-bold uppercase shadow-xs">
                      {place.primary_category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-[#29252B] group-hover:text-[#C66B4E] transition-colors">
                        {place.name_en || place.name_ja}
                      </h3>
                      <p className="text-xs text-[#5A525E] font-serif">{place.name_ja}</p>
                    </div>

                    {/* Metadata Chips */}
                    <div className="space-y-1.5 text-[11px] text-[#5A525E]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#789477] shrink-0" />
                        <span className="truncate">{place.opening_hours_text || 'Standard operating hours'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-[#C66B4E] shrink-0" />
                        <span className="font-semibold">
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

                    {/* Action Bar: Add to Journey & Details */}
                    <div className="pt-2 border-t border-[#EAE0D0] flex items-center justify-between">
                      <button
                        onClick={(e) => handleAddStopToJourney(place, e)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFF5EE] hover:bg-[#789477] text-[#4F734E] hover:text-white border border-[#789477]/30 text-xs font-bold transition-all cursor-pointer"
                        title="Add to Itinerary Journey"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Stop</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs text-[#C66B4E] font-bold group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Destination Detail Modal */}
      {selectedDetailPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white border border-[#EAE0D0] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header Image */}
            <div className="relative h-60 bg-[#FAF6F0] shrink-0">
              <img
                src={selectedDetailPlace.image_url || (selectedDetailPlace.place_id === 'hottarakashi_onsen' ? 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80' : 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80')}
                alt={selectedDetailPlace.name_en}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <button
                onClick={() => setSelectedDetailPlace(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/90 text-[#29252B] hover:bg-white transition cursor-pointer shadow-md"
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

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-[#29252B]">
              {/* Key Verified Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FAF6F0] border border-[#EAE0D0] p-3 rounded-xl">
                  <span className="text-[10px] text-[#8A808F] uppercase block font-semibold">Fuji View</span>
                  <span className="text-sm font-bold text-[#C64A6A] flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-[#E9A5B5] text-[#E9A5B5]" />
                    {selectedDetailPlace.fuji_view_rating}.0 / 5
                  </span>
                </div>

                <div className="bg-[#FAF6F0] border border-[#EAE0D0] p-3 rounded-xl">
                  <span className="text-[10px] text-[#8A808F] uppercase block font-semibold">Admission</span>
                  <span className="text-sm font-bold text-[#4F734E] mt-0.5 block">
                    {selectedDetailPlace.general_admission_type === 'FREE' ? 'Free' : `¥${selectedDetailPlace.general_admission_fee_jpy || 'Paid'}`}
                  </span>
                </div>

                <div className="bg-[#FAF6F0] border border-[#EAE0D0] p-3 rounded-xl">
                  <span className="text-[10px] text-[#8A808F] uppercase block font-semibold">Stairs</span>
                  <span className="text-sm font-bold text-[#C66B4E] mt-0.5 block">
                    {selectedDetailPlace.stair_step_count ? `${selectedDetailPlace.stair_step_count} Steps` : 'Step-Free'}
                  </span>
                </div>

                <div className="bg-[#FAF6F0] border border-[#EAE0D0] p-3 rounded-xl">
                  <span className="text-[10px] text-[#8A808F] uppercase block font-semibold">Bad Weather</span>
                  <span className="text-sm font-bold text-[#789477] mt-0.5 block">
                    {selectedDetailPlace.indoor_alternative ? 'Indoor Shelter' : 'Open Air Only'}
                  </span>
                </div>
              </div>

              {/* Barrier-Free Accessibility Details */}
              <div className="bg-[#EFF5EE] border border-[#789477]/30 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#4F734E] text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#789477]" />
                  <span>Barrier-Free & Accessibility Audit</span>
                </div>
                <p className="text-xs text-[#29252B] leading-relaxed">
                  {selectedDetailPlace.accessibility_evidence || 'Standard accessibility standards apply.'}
                </p>
                <p className="text-[10px] text-[#5A525E]">
                  Verified by: {selectedDetailPlace.accessibility_source}
                </p>
              </div>

              {/* Operating Hours & Notes */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[#29252B] uppercase tracking-wider">
                  Operating Hours & Schedule
                </h4>
                <div className="flex items-center gap-2 text-xs text-[#5A525E]">
                  <Clock className="w-4 h-4 text-[#789477]" />
                  <span>{selectedDetailPlace.opening_hours_text || 'See official site'}</span>
                </div>
              </div>

              {/* Legal Attribution */}
              <div className="pt-3 border-t border-[#EAE0D0] text-[11px] text-[#8A808F]">
                <span>{selectedDetailPlace.required_attribution}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#FAF6F0] border-t border-[#EAE0D0] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  onAskHana(`Tell me more about visiting ${selectedDetailPlace.name_en || selectedDetailPlace.name_ja}, best timing and transit routes.`);
                  setSelectedDetailPlace(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#EAE0D0] hover:bg-[#FAF6F0] text-[#29252B] text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C66B4E]" />
                <span>Ask Hana About This</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onExplore3D(selectedDetailPlace.place_id);
                    setSelectedDetailPlace(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFF5EE] hover:bg-[#E3EFE1] border border-[#789477]/40 text-[#4F734E] text-xs font-bold transition cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-[#789477]" />
                  <span>View in 3D</span>
                </button>

                <button
                  onClick={() => {
                    handleAddStopToJourney(selectedDetailPlace);
                    setSelectedDetailPlace(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C66B4E] hover:bg-[#B2583D] text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Journey</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
