import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Sparkles, 
  Mountain, 
  Coffee, 
  Waves, 
  TreePine, 
  ShoppingBag, 
  UtensilsCrossed, 
  Plus, 
  ChevronRight, 
  Users, 
  Car, 
  CloudSun, 
  Check, 
  Crosshair,
  Edit3
} from 'lucide-react';
import { DayPlanTimeline, TimelineItem } from './DayPlanTimeline';

interface SelectedDest {
  id: string;
  name: string;
  tag: string;
  image_url: string;
  crowd: string;
}

interface PlanMyTripViewProps {
  onNavigateToTab?: (tab: string) => void;
}

export const PlanMyTripView: React.FC<PlanMyTripViewProps> = ({ onNavigateToTab }) => {
  const [origin, setOrigin] = useState('Kawaguchiko Station');
  const [_originCoords, setOriginCoords] = useState({ lat: 35.4983, lon: 138.7692 });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [_isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Categories multi-select state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'famous_attractions', 
    'hidden_gems', 
    'cafes_bakeries', 
    'lakes_nature'
  ]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Selected Destinations in day plan
  const [destinations] = useState<SelectedDest[]>([
    {
      id: 'chureito_pagoda',
      name: 'Chureito Pagoda',
      tag: 'Iconic View',
      image_url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=400&auto=format&fit=crop&q=80',
      crowd: 'Moderate'
    },
    {
      id: 'lake_kawaguchi',
      name: 'Lake Kawaguchi',
      tag: 'Scenic Lake',
      image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&auto=format&fit=crop&q=80',
      crowd: 'Moderate'
    },
    {
      id: 'oishi_park',
      name: 'Oishi Park',
      tag: 'Flower Park',
      image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&auto=format&fit=crop&q=80',
      crowd: 'Moderate'
    },
    {
      id: 'cafe_mignon',
      name: 'Hidden Café (Café Mignon)',
      tag: 'Hidden Gem',
      image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80',
      crowd: 'Quiet'
    }
  ]);

  // Timeline state from API
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Primary category chips
  const primaryCategories = [
    { id: 'famous_attractions', title: 'Famous Attractions', icon: Mountain },
    { id: 'hidden_gems', title: 'Hidden Gems', icon: Sparkles },
    { id: 'cafes_bakeries', title: 'Cafés & Bakeries', icon: Coffee },
    { id: 'lakes_nature', title: 'Lakes & Waterviews', icon: Waves },
    { id: 'nature_hiking', title: 'Nature & Hiking', icon: TreePine },
    { id: 'shopping_souvenirs', title: 'Shopping & Souvenirs', icon: ShoppingBag },
    { id: 'local_food', title: 'Local Food & Restaurants', icon: UtensilsCrossed }
  ];

  // Extended categories
  const extendedCategories = [
    { id: 'shrines_temples', title: 'Shrines & Temples' },
    { id: 'photo_locations', title: 'Photography Locations' },
    { id: 'museums_entertainment', title: 'Museums & Entertainment' },
    { id: 'family_activities', title: 'Family-Friendly Activities' },
    { id: 'hotels_ryokans', title: 'Hotels & Ryokans' },
    { id: 'activities_experiences', title: 'Activities & Experiences' },
    { id: 'quiet_scenic', title: 'Quiet Scenic Locations' },
    { id: 'essential_services', title: 'Essential Services' },
    { id: 'railway_stations', title: 'Railway Stations' },
    { id: 'bus_stops', title: 'Bus Stops & Routes' }
  ];

  // Fetch full day plan on mount or when origin changes
  const fetchDayPlan = async () => {
    try {
      const resp = await fetch(`/api/v1/journey/dayplan?origin=${encodeURIComponent(origin)}`);
      if (resp.ok) {
        const data = await resp.json();
        setTimeline(data.timeline || []);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error('Failed to fetch day plan:', err);
    }
  };

  useEffect(() => {
    fetchDayPlan();
  }, [origin]);

  // Handle GPS location
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setLocationStatus('Requesting GPS location...');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          setOriginCoords({ lat, lon });
          setGpsAccuracy(acc);

          try {
            const resp = await fetch(`/api/v1/journey/locations/nearby?lat=${lat}&lon=${lon}`);
            if (resp.ok) {
              const data = await resp.json();
              const stationName = data.closest_station?.name_en || 'Kawaguchiko Station';
              const distText = data.closest_station?.distance_text ? ` (${data.closest_station.distance_text})` : '';
              setOrigin(`${stationName}${distText}`);
              setLocationStatus(`GPS Confirmed (±${acc}m accuracy)`);
            } else {
              setOrigin('Kawaguchiko Station Area');
              setLocationStatus(`Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)} (±${acc}m)`);
            }
          } catch (_) {
            setOrigin('Kawaguchiko Station Area');
            setLocationStatus(`GPS Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          } finally {
            setIsLocating(false);
          }
        },
        (_err) => {
          setIsLocating(false);
          setLocationStatus('GPS permission declined. Using Kawaguchiko Station.');
          setOrigin('Kawaguchiko Station');
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      setLocationStatus('Geolocation unsupported on this browser.');
    }
  };

  // Search input autocompletion
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await fetch(`/api/v1/journey/locations/search?q=${encodeURIComponent(searchQuery)}`);
        if (resp.ok) {
          const data = await resp.json();
          setSearchResults(data);
          setShowSearchDropdown(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) 
        ? prev.filter(c => c !== catId) 
        : [...prev, catId]
    );
  };

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 pb-12">
      {/* 3-Column Desktop Grid Layout Matching User Mockup media_1795420211344_5bbc2fe5.jpg */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* ========================================================
            LEFT COLUMN (3.5 cols): Origin Setup & 17 Categories
            ======================================================== */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-[#EAD7C8] shadow-sm p-4 sm:p-5 space-y-4">
          {/* Hana Greeting Card */}
          <div className="flex items-start gap-3 bg-[#FFF4F6] border border-[#FAD6DF] p-3 rounded-xl shadow-2xs">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#E9A5B5] shrink-0 bg-white shadow-xs">
              <img 
                src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80" 
                alt="Hana" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[#29252B]">Hana</span>
                <span className="text-xs">🌸</span>
              </div>
              <h2 className="font-bold text-sm text-[#29252B] mt-0.5">こんにちは!</h2>
              <p className="text-xs text-[#625966] leading-snug">Where are you starting your journey today?</p>
            </div>
          </div>

          {/* Action 1: Use Current Location (GPS) */}
          <div>
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="w-full py-2.5 px-3 rounded-xl bg-[#C66B4E] hover:bg-[#B3583C] text-white flex items-center justify-between font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                <span>Use my current location</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                (GPS{gpsAccuracy ? ` ±${gpsAccuracy}m` : ''})
              </span>
            </button>
            {locationStatus && (
              <p className="text-[10px] text-[#789477] font-semibold mt-1 px-1">
                ✓ {locationStatus}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#625966] font-medium my-1">
            <div className="flex-1 h-px bg-[#EAD7C8]" />
            <span>or</span>
            <div className="flex-1 h-px bg-[#EAD7C8]" />
          </div>

          {/* Action 2: Search Input */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-[#F7EFE5]/60 border border-[#EAD7C8] rounded-xl px-3 py-2 text-xs">
              <Search className="w-3.5 h-3.5 text-[#625966] shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a station, hotel, bus stop or landmark..." 
                className="bg-transparent w-full text-[#29252B] outline-none placeholder-[#625966]"
              />
            </div>

            {/* Dropdown search results */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EAD7C8] rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-[#F7EFE5]">
                {searchResults.map((res) => (
                  <div 
                    key={res.id}
                    onClick={() => {
                      setOrigin(res.title);
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                    }}
                    className="p-2 hover:bg-[#FAF5F0] cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[#29252B]">{res.title}</div>
                      <div className="text-[10px] text-[#625966]">{res.subtitle}</div>
                    </div>
                    <span className="text-[10px] bg-[#F7EFE5] text-[#87365E] px-1.5 py-0.5 rounded">
                      {res.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Location Chips */}
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => setOrigin('Kawaguchiko Station')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                origin.includes('Kawaguchiko') 
                  ? 'border-[#C66B4E] bg-[#C66B4E]/10 font-bold text-[#C66B4E]' 
                  : 'border-[#EAD7C8] bg-white text-[#403944] hover:bg-[#FAF5F0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Kawaguchiko Station</span>
                {origin.includes('Kawaguchiko') && <Check className="w-3 h-3 text-[#C66B4E]" />}
              </div>
            </button>

            <button
              onClick={() => setOrigin('Fujisan Station')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                origin.includes('Fujisan') 
                  ? 'border-[#C66B4E] bg-[#C66B4E]/10 font-bold text-[#C66B4E]' 
                  : 'border-[#EAD7C8] bg-white text-[#403944] hover:bg-[#FAF5F0]'
              }`}
            >
              <span>Fujisan Station</span>
            </button>

            <button
              onClick={() => {
                setOrigin('Lakeside Hotel');
                setSearchQuery('Hotel');
              }}
              className="p-2 rounded-xl border border-[#EAD7C8] bg-white text-[#403944] hover:bg-[#FAF5F0] text-left cursor-pointer"
            >
              <span>Your Hotel (search)</span>
            </button>

            <button
              onClick={() => onNavigateToTab?.('treasure_map')}
              className="p-2 rounded-xl border border-[#EAD7C8] bg-white text-[#403944] hover:bg-[#FAF5F0] text-left cursor-pointer flex items-center gap-1"
            >
              <MapPin className="w-3 h-3 text-[#87365E]" />
              <span>Select on Map</span>
            </button>
          </div>

          {/* Experience Categories Selection */}
          <div className="pt-2 border-t border-[#F7EFE5] space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#29252B]">
                <span className="text-sm">🌸</span>
                <span>What would you like to experience today?</span>
              </div>
              <p className="text-[11px] text-[#625966]">Choose one or more (Hana will create the best route for you)</p>
            </div>

            {/* Category Chips Container */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {primaryCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategories.includes(cat.id);

                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[#87365E] bg-[#87365E]/10 text-[#87365E] font-bold shadow-2xs' 
                        : 'border-[#EAD7C8] bg-white text-[#403944] hover:bg-[#FAF5F0]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.title}</span>
                  </button>
                );
              })}

              {/* Toggle More Interests */}
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-[#87365E] bg-[#FFF4F6] text-[#87365E] text-xs font-bold hover:bg-[#FAD6DF]/50 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAllCategories ? 'Less Interests' : '+ More Interests (museums, shrines, etc.)'}</span>
              </button>
            </div>

            {/* Extended Categories drawer */}
            {showAllCategories && (
              <div className="p-2.5 bg-[#FAF5F0] rounded-xl border border-[#EAD7C8] flex flex-wrap gap-1.5 animate-fadeIn">
                {extendedCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-2 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#87365E] bg-[#87365E] text-white font-bold' 
                          : 'border-[#EAD7C8] bg-white text-[#403944] hover:bg-gray-50'
                      }`}
                    >
                      {cat.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Master Submit CTA */}
          <button
            onClick={fetchDayPlan}
            className="w-full py-3 rounded-xl bg-[#C66B4E] hover:bg-[#B3583C] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span>✨</span>
            <span>Create my day plan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================
            CENTER COLUMN (5 cols): Selected POIs, Interactive Map & 3 Metric Widgets
            ======================================================== */}
        <div className="xl:col-span-5 flex flex-col gap-3">
          {/* Selected Destinations Strip */}
          <div className="bg-white rounded-2xl border border-[#EAD7C8] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#F7EFE5] mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[#29252B]">Selected Destinations ({destinations.length})</span>
              </div>
              <button 
                onClick={() => onNavigateToTab?.('treasure_map')}
                className="text-xs font-semibold text-[#87365E] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {destinations.map((dest, dIdx) => (
                <div 
                  key={dest.id}
                  className="bg-[#FAF5F0] rounded-xl border border-[#EAD7C8] p-1.5 overflow-hidden flex flex-col group cursor-pointer hover:border-[#87365E] transition-all"
                >
                  <div className="h-16 rounded-lg overflow-hidden relative">
                    <img src={dest.image_url} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                      {dIdx + 1}
                    </span>
                  </div>
                  <div className="pt-1.5 text-center">
                    <p className="font-bold text-[11px] text-[#29252B] truncate">{dest.name}</p>
                    <p className="text-[10px] text-[#625966] truncate">{dest.tag}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Map with Routes and Mount Fuji Landscape */}
          <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-[#EAD7C8] shadow-sm bg-[#E8E0D5]">
            <img 
              src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&auto=format&fit=crop&q=80" 
              alt="Mount Fuji Lake Kawaguchi Interactive Route Map"
              className="w-full h-full object-cover filter saturate-[0.85] contrast-[1.05]"
            />

            {/* SVG Connecting Route Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path 
                d="M 280 340 L 410 240 L 320 160 L 220 180 L 160 140" 
                fill="none" 
                stroke="#87365E" 
                strokeWidth="4" 
                strokeDasharray="6,6"
              />
              <path 
                d="M 280 340 L 410 240" 
                fill="none" 
                stroke="#789477" 
                strokeWidth="2.5" 
              />
            </svg>

            {/* Numbered Pins */}
            <div className="absolute top-[82%] left-[48%] -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 py-1 rounded-full shadow-md text-xs font-bold border border-[#EAD7C8] flex items-center gap-1 z-10">
              <span className="w-2 h-2 rounded-full bg-[#87365E]" />
              <span>Kawaguchiko Sta. (Start/End)</span>
            </div>

            <div className="absolute top-[58%] left-[72%] -translate-x-1/2 -translate-y-1/2 bg-[#87365E] text-white px-2.5 py-1 rounded-full shadow-md text-xs font-bold flex items-center gap-1 z-10">
              <span>1. Chureito Pagoda</span>
            </div>

            <div className="absolute top-[38%] left-[54%] -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 rounded-full shadow-md text-xs font-bold border border-[#EAD7C8] flex items-center gap-1 z-10">
              <span>2. Lake Kawaguchi</span>
            </div>

            <div className="absolute top-[44%] left-[36%] -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 rounded-full shadow-md text-xs font-bold border border-[#EAD7C8] flex items-center gap-1 z-10">
              <span>3. Hidden Café</span>
            </div>

            <div className="absolute top-[32%] left-[24%] -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 rounded-full shadow-md text-xs font-bold border border-[#EAD7C8] flex items-center gap-1 z-10">
              <span>4. Oishi Park</span>
            </div>

            {/* Map Legend (from User Mockup) */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-[#EAD7C8] shadow-xs text-[10px] space-y-1 z-20">
              <div className="flex items-center gap-1.5 font-bold text-[#29252B]">
                <span className="w-3 h-1 bg-[#87365E] rounded-full inline-block" />
                <span>My Route (Day Plan)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#625966]">
                <span className="w-3 h-1 bg-[#789477] rounded-full inline-block" />
                <span>Bus / Train Routes</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#625966]">
                <span className="w-3 h-1 border-t border-dashed border-[#87365E] inline-block" />
                <span>Walking Route</span>
              </div>
            </div>
          </div>

          {/* Under Map 3 Metric Widgets (Matching User Mockup) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Widget 1: Crowd Overview */}
            <div className="bg-white p-3 rounded-xl border border-[#EAD7C8] shadow-2xs">
              <div className="flex items-center gap-1 text-[#625966] text-[10px] font-bold">
                <Users className="w-3.5 h-3.5 text-[#C66B4E]" />
                <span>Crowd Overview</span>
              </div>
              <p className="text-[10px] text-[#625966] mt-0.5">Today, around 13:00</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm font-bold text-[#D9822B]">{metrics?.crowd_overview?.level || 'Moderate'}</span>
              </div>
              <p className="text-[10px] text-[#C66B4E] font-medium mt-0.5">↑ Busier after 14:30</p>
              <p className="text-[9px] text-[#625966] mt-1 border-t border-[#F7EFE5] pt-1">
                Source: Google / Community · Updated 5 min ago
              </p>
            </div>

            {/* Widget 2: Road Traffic */}
            <div className="bg-white p-3 rounded-xl border border-[#EAD7C8] shadow-2xs">
              <div className="flex items-center gap-1 text-[#625966] text-[10px] font-bold">
                <Car className="w-3.5 h-3.5 text-[#789477]" />
                <span>Road Traffic</span>
              </div>
              <p className="text-[10px] text-[#625966] mt-0.5">Around Mt. Fuji</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm font-bold text-[#789477]">Light</span>
              </div>
              <p className="text-[10px] text-[#789477] font-medium mt-0.5">No major congestion</p>
              <p className="text-[9px] text-[#625966] mt-1 border-t border-[#F7EFE5] pt-1">
                Google Traffic · Updated 3 min ago
              </p>
            </div>

            {/* Widget 3: Weather */}
            <div className="bg-white p-3 rounded-xl border border-[#EAD7C8] shadow-2xs">
              <div className="flex items-center gap-1 text-[#625966] text-[10px] font-bold">
                <CloudSun className="w-3.5 h-3.5 text-[#B99BCB]" />
                <span>Weather</span>
              </div>
              <p className="text-[10px] text-[#625966] mt-0.5">Kawaguchiko</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm font-bold text-[#29252B]">12°C</span>
                <span className="text-xs text-[#625966]">Partly Cloudy</span>
              </div>
              <p className="text-[10px] text-[#625966] font-medium mt-0.5">8°C / 16°C · No rain expected</p>
              <p className="text-[9px] text-[#625966] mt-1 border-t border-[#F7EFE5] pt-1">
                Open-Meteo · Live Sensor
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN (3.5 cols): Full-Day Itinerary Timeline
            ======================================================== */}
        <div className="xl:col-span-4 h-full">
          <DayPlanTimeline 
            timeline={timeline}
            onFindQuieter={() => onNavigateToTab?.('crowd_traffic')}
            onStartJourney={() => onNavigateToTab?.('treasure_map')}
          />
        </div>
      </div>
    </div>
  );
};
