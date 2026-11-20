import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { apiUrl } from '../config';
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
  Layers, 
  ChevronRight 
} from 'lucide-react';

interface DiscoverViewProps {
  onAskHana: (prompt: string) => void;
  onExplore3D: (placeId?: string) => void;
  onPlanTrip: () => void;
  onSelectPlace?: (placeId: string) => void;
  onAddToItinerary?: (place: Place) => void;
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
    opening_hours_text: '09:00-17:00 (March-Nov), 09:30-16:30 (Dec-Feb)',
    opening_hours_source: 'Saiko Iyashi-no-Sato Nenba Operating Committee',
    general_admission_type: 'PAID',
    general_admission_fee_jpy: 500,
    admission_fee_source: 'Saiko Iyashi-no-Sato Nenba Operating Committee',
    accessibility_status: 'PARTIAL_STEPS',
    accessibility_evidence: 'Paved central incline path; historic thatched buildings require step up into entrance',
    stair_step_count: 5,
    accessibility_source: 'Saiko Iyashi-no-Sato Official Brochure',
    fuji_view_rating: 4,
    indoor_alternative: true,
    provenance_tier: 'OFFICIAL_OPERATOR',
    source_url: 'https://saikoiyashinosatonenba.jp/',
    required_attribution: '出典：西湖いやしの里根場',
    source_retrieval_date: '2026-11-08',
    last_verified_date: '2026-11-08'
  },
  {
    place_id: 'kawaguchiko_ropeway',
    name_ja: '富士山パノラマロープウェイ',
    name_en: 'Mt. Fuji Panoramic Ropeway',
    latitude: 35.504167,
    longitude: 138.772222,
    coords_source: 'MLIT_P12',
    primary_category: 'viewpoint',
    sub_category: 'cable_car_observatory',
    opening_status: 'REGULAR_HOURS',
    opening_hours_text: '09:00-17:00 (Weekdays), 09:00-17:30 (Weekends)',
    opening_hours_source: 'Fujikyuko Co., Ltd.',
    general_admission_type: 'PAID',
    general_admission_fee_jpy: 1000,
    admission_fee_source: 'Fujikyuko Co., Ltd.',
    accessibility_status: 'PARTIAL_STEPS',
    accessibility_evidence: 'Ropeway cabins wheelchair accessible; mountain top observation deck has stairs and gravel path',
    stair_step_count: 24,
    accessibility_source: 'Fujikyuko Barrier-Free Guide',
    fuji_view_rating: 5,
    indoor_alternative: false,
    provenance_tier: 'OFFICIAL_OPERATOR',
    source_url: 'https://www.fujikyu-travel.co.jp/',
    required_attribution: '出典：富士急行株式会社',
    source_retrieval_date: '2026-11-08',
    last_verified_date: '2026-11-08'
  },
  {
    place_id: 'kitaguchi_sengen_shrine',
    name_ja: '北口本宮冨士浅間神社',
    name_en: 'Kitaguchi Hongu Fuji Sengen Shrine',
    latitude: 35.478611,
    longitude: 138.804722,
    coords_source: 'MLIT_P12',
    primary_category: 'cultural',
    sub_category: 'unesco_heritage_shrine',
    opening_status: 'ALWAYS_OPEN',
    opening_hours_text: 'Shrine grounds open 24 hours; office 09:00-16:30',
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
  onAddToItinerary
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

  const handleAddStopToJourney = (place: Place) => {
    if (onAddToItinerary) {
      onAddToItinerary(place);
    }
    setAddedToast(`Added ${place.name_en || place.name_ja} to Journey!`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 select-text">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-fade-in">
          <ShieldCheck className="w-4 h-4" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[380px] md:min-h-[440px] flex items-center justify-center p-6 md:p-12 overflow-hidden border-b border-slate-800">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 transform scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1600&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Fuji Five Lakes • Yamanashi Prefecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Mount Fuji & The Five Lakes
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Explore authentic viewpoints, sacred UNESCO shrines, ancient lakeside villages, and public transit schedules powered by genuine AI intelligence.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onAskHana('Plan an ideal 1-day trip from Kawaguchiko Station with great Fuji views.')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Plan with Hana AI</span>
            </button>

            <button
              onClick={() => onExplore3D()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Explore 3D Digital Twin</span>
            </button>

            <button
              onClick={onPlanTrip}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Transit Timetables</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Exploration Body */}
      <section className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Search & Category Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search destinations by English or Japanese name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count & Attribution Label */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {filteredPlaces.length} verified regional destinations</span>
          <span className="text-[11px] text-slate-500">Source: Yamanashi Tourism Database & MLIT Data</span>
        </div>

        {/* Places Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                className="group flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-sky-500/40 hover:shadow-xl transition-all cursor-pointer"
              >
                {/* Photo & Badges */}
                <div className="relative h-44 overflow-hidden bg-slate-800">
                  <img
                    src={imgUrl}
                    alt={place.name_en || place.name_ja}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => handleToggleFavorite(place.place_id, e)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 backdrop-blur-md text-white hover:text-rose-400 transition cursor-pointer"
                    title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Fuji View Rating Badge */}
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-amber-300 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{place.fuji_view_rating}.0</span>
                  </div>

                  {/* Category Pill */}
                  <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-semibold uppercase">
                    {place.primary_category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                      {place.name_en || place.name_ja}
                    </h3>
                    <p className="text-xs text-slate-400 font-serif">{place.name_ja}</p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{place.opening_hours_text || 'Standard operating hours'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        {place.general_admission_type === 'FREE' 
                          ? 'Free Admission' 
                          : place.general_admission_fee_jpy 
                            ? `¥${place.general_admission_fee_jpy.toLocaleString()}` 
                            : 'Admission required'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Footprints className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {place.accessibility_status === 'VERIFIED_ACCESSIBLE'
                          ? 'Step-free accessible'
                          : place.stair_step_count 
                            ? `${place.stair_step_count} stairs warning` 
                            : 'Partial incline'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Card Action */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-sky-400 font-semibold group-hover:text-sky-300">
                    <span>View Destination Details</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Destination Detail Slide-Over Modal */}
      {selectedDetailPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header Image */}
            <div className="relative h-60 bg-slate-800 shrink-0">
              <img
                src={selectedDetailPlace.image_url || (selectedDetailPlace.place_id === 'hottarakashi_onsen' ? 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80' : 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80')}
                alt={selectedDetailPlace.name_en}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

              <button
                onClick={() => setSelectedDetailPlace(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 text-white hover:bg-slate-950 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                  {selectedDetailPlace.primary_category}
                </span>
                <h2 className="text-2xl font-black text-white">
                  {selectedDetailPlace.name_en || selectedDetailPlace.name_ja}
                </h2>
                <p className="text-sm text-slate-300 font-serif">{selectedDetailPlace.name_ja}</p>
              </div>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300">
              {/* Key Verified Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase block">Fuji View</span>
                  <span className="text-sm font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {selectedDetailPlace.fuji_view_rating}.0 / 5
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase block">Admission</span>
                  <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                    {selectedDetailPlace.general_admission_type === 'FREE' ? 'Free' : `¥${selectedDetailPlace.general_admission_fee_jpy || 'Paid'}`}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase block">Stairs</span>
                  <span className="text-sm font-bold text-sky-400 mt-0.5 block">
                    {selectedDetailPlace.stair_step_count ? `${selectedDetailPlace.stair_step_count} Steps` : 'Step-Free'}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase block">Coordinates</span>
                  <span className="text-xs font-mono text-slate-300 mt-1 block">
                    {selectedDetailPlace.latitude.toFixed(3)}°N
                  </span>
                </div>
              </div>

              {/* Hours and Accessibility description */}
              <div className="space-y-3 bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Verified Operating Hours</span>
                  </h4>
                  <p className="text-xs text-slate-300">{selectedDetailPlace.opening_hours_text || '24 hours'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Accessibility Assessment</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    {selectedDetailPlace.accessibility_evidence || 'Standard regional walking trail.'}
                  </p>
                </div>
              </div>

              {/* Real Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    const prompt = `Tell me about ${selectedDetailPlace.name_en || selectedDetailPlace.name_ja} (${selectedDetailPlace.name_ja}). What are the best photography angles, how do I get there by Fujikyu bus, and what are the key travel tips?`;
                    setSelectedDetailPlace(null);
                    onAskHana(prompt);
                  }}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask Hana About This</span>
                </button>

                <button
                  onClick={() => {
                    handleAddStopToJourney(selectedDetailPlace);
                    setSelectedDetailPlace(null);
                  }}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Journey</span>
                </button>

                <button
                  onClick={() => {
                    const pid = selectedDetailPlace.place_id;
                    setSelectedDetailPlace(null);
                    onExplore3D(pid);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>View in 3D</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
