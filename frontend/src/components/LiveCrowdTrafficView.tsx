import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Bus, 
  RefreshCw 
} from 'lucide-react';
import { DestinationComparisonTable, ComparisonItem } from './DestinationComparisonTable';
import { HanaDecisionAssistant } from './HanaDecisionAssistant';

export const LiveCrowdTrafficView: React.FC = () => {
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('Kawaguchiko Station, Fujikawaguchiko');
  const [travelDate, setTravelDate] = useState('Mon, Nov 23, 2026');
  const [tripTime, setTripTime] = useState('08:00 - 18:00');
  const [transportMode, setTransportMode] = useState('Public Transport');
  const [selectedHanaOption, setSelectedHanaOption] = useState<string>('visit_anyway');
  const [isUpdating, setIsUpdating] = useState(false);

  const [activeLayers, setActiveLayers] = useState({
    traffic: true,
    transit: true,
    walking: true,
    biking: false,
    destinations: true
  });

  const fetchComparison = async () => {
    setIsUpdating(true);
    try {
      const resp = await fetch('/api/v1/journey/crowd/comparison');
      if (resp.ok) {
        const data = await resp.json();
        setComparisonItems(data);
      }
    } catch (err) {
      console.error('Error fetching destination comparison:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* 1. Master Header Title & Operational Mode Strip */}
      <div className="bg-white rounded-2xl border border-[#EAD7C8] p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <h1 className="text-lg sm:text-xl font-bold text-[#29252B]">
              FujiNova — Live Crowd, Traffic & Transport Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#625966] mt-0.5 font-medium">
            Plan smarter around Mount Fuji with real-time crowd, traffic, weather and public transport.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#789477]/15 border border-[#789477]/30 text-[#789477] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#789477] animate-pulse inline-block" />
            <span>Live Data Mode</span>
          </div>
          <span className="text-[#625966] hidden sm:inline">Updated: Nov 23, 2026, 1:05 PM (JST)</span>
        </div>
      </div>

      {/* 2. Parameters & Filter Bar (from User Mockup) */}
      <div className="bg-white rounded-2xl border border-[#EAD7C8] p-3 sm:p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs items-center">
        {/* Location */}
        <div>
          <label className="block text-[10px] font-bold text-[#625966] uppercase mb-1">My Location</label>
          <div className="flex items-center gap-2 bg-[#F7EFE5]/50 border border-[#EAD7C8] rounded-xl px-2.5 py-2">
            <MapPin className="w-3.5 h-3.5 text-[#87365E] shrink-0" />
            <input 
              type="text" 
              value={selectedLocation} 
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent font-medium text-[#29252B] w-full outline-none" 
            />
          </div>
        </div>

        {/* Travel Date */}
        <div>
          <label className="block text-[10px] font-bold text-[#625966] uppercase mb-1">Travel Date</label>
          <div className="flex items-center gap-2 bg-[#F7EFE5]/50 border border-[#EAD7C8] rounded-xl px-2.5 py-2">
            <Calendar className="w-3.5 h-3.5 text-[#C66B4E] shrink-0" />
            <input 
              type="text" 
              value={travelDate} 
              onChange={(e) => setTravelDate(e.target.value)}
              className="bg-transparent font-medium text-[#29252B] w-full outline-none" 
            />
          </div>
        </div>

        {/* Trip Time */}
        <div>
          <label className="block text-[10px] font-bold text-[#625966] uppercase mb-1">Trip Time</label>
          <div className="flex items-center gap-2 bg-[#F7EFE5]/50 border border-[#EAD7C8] rounded-xl px-2.5 py-2">
            <Clock className="w-3.5 h-3.5 text-[#789477] shrink-0" />
            <input 
              type="text" 
              value={tripTime} 
              onChange={(e) => setTripTime(e.target.value)}
              className="bg-transparent font-medium text-[#29252B] w-full outline-none" 
            />
          </div>
        </div>

        {/* Transport Preference */}
        <div>
          <label className="block text-[10px] font-bold text-[#625966] uppercase mb-1">Transport Preference</label>
          <div className="flex items-center gap-2 bg-[#F7EFE5]/50 border border-[#EAD7C8] rounded-xl px-2.5 py-2">
            <Bus className="w-3.5 h-3.5 text-[#87365E] shrink-0" />
            <select 
              value={transportMode} 
              onChange={(e) => setTransportMode(e.target.value)}
              className="bg-transparent font-medium text-[#29252B] w-full outline-none cursor-pointer"
            >
              <option value="Public Transport">Public Transport</option>
              <option value="Bus + Walk">Bus + Walk</option>
              <option value="Driving / Rental Car">Driving / Rental Car</option>
            </select>
          </div>
        </div>

        {/* Update Plan Button */}
        <div className="flex items-end">
          <button
            onClick={fetchComparison}
            disabled={isUpdating}
            className="w-full h-[38px] rounded-xl bg-[#87365E] hover:bg-[#A83F70] text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Updating...' : 'Update Plan'}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Stage: Left Map & Hana Assistant + Right Destination Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 6 Columns: Interactive Map with Traffic Overlay & Hana Decision Box */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Map Container */}
          <div className="relative w-full h-[400px] sm:h-[440px] rounded-2xl overflow-hidden border border-[#EAD7C8] shadow-sm bg-[#EAD7C8]">
            {/* Real Map Landscape */}
            <img 
              src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&auto=format&fit=crop&q=80" 
              alt="Live Traffic & Route Map"
              className="w-full h-full object-cover filter saturate-[0.9]"
            />

            {/* SVG Corridors for Route 137 and Route 21 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Route 137 Traffic Line (Moderate - Amber) */}
              <path 
                d="M 230 380 Q 300 290 380 230" 
                fill="none" 
                stroke="#D9822B" 
                strokeWidth="5" 
                strokeLinecap="round"
              />
              {/* Route 21 Lakeside (Light - Green) */}
              <path 
                d="M 200 190 Q 280 140 370 170" 
                fill="none" 
                stroke="#2E7D32" 
                strokeWidth="4" 
                strokeLinecap="round"
              />
            </svg>

            {/* Pins on Map */}
            <div className="absolute top-[80%] left-[35%] -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 py-1 rounded-full shadow-md text-xs font-bold border border-[#EAD7C8] flex items-center gap-1.5 z-10">
              <span className="w-2 h-2 rounded-full bg-[#87365E]" />
              <span>Kawaguchiko Station</span>
            </div>

            <div className="absolute top-[52%] left-[72%] -translate-x-1/2 -translate-y-1/2 bg-[#87365E] text-white px-2.5 py-1 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5 z-10">
              <span>Chureito Pagoda</span>
            </div>

            <div className="absolute top-[32%] left-[40%] -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 py-1 rounded-full shadow-md text-xs font-bold border border-[#EAD7C8] flex items-center gap-1.5 z-10">
              <span>Lake Kawaguchi</span>
            </div>

            <div className="absolute top-[22%] left-[24%] -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 py-1 rounded-full shadow-md text-xs font-bold border border-[#EAD7C8] flex items-center gap-1.5 z-10">
              <span>Oishi Park</span>
            </div>

            {/* Top Right Layers Switcher */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-[#EAD7C8] shadow-sm text-xs space-y-1 z-20">
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#29252B]">
                <input 
                  type="checkbox" 
                  checked={activeLayers.traffic} 
                  onChange={() => toggleLayer('traffic')}
                  className="rounded text-[#87365E]" 
                />
                <span>Traffic (Live)</span>
                <span className="text-[9px] text-[#789477] font-normal">[Fast — Slow]</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#403944]">
                <input 
                  type="checkbox" 
                  checked={activeLayers.transit} 
                  onChange={() => toggleLayer('transit')}
                  className="rounded text-[#87365E]" 
                />
                <span>Transit Routes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#403944]">
                <input 
                  type="checkbox" 
                  checked={activeLayers.walking} 
                  onChange={() => toggleLayer('walking')}
                  className="rounded text-[#87365E]" 
                />
                <span>Walking Route</span>
              </label>
            </div>
          </div>

          {/* Hana Quieter-Place Decision Assistant Card */}
          <HanaDecisionAssistant 
            destinationName="Chureito Pagoda"
            selectedOption={selectedHanaOption}
            onSelectOption={(id) => setSelectedHanaOption(id)}
          />
        </div>

        {/* Right 6 Columns: Destination Comparison Table & Cards */}
        <div className="lg:col-span-6 flex flex-col">
          <DestinationComparisonTable 
            items={comparisonItems}
            onFindQuieter={() => setSelectedHanaOption('quieter_place')}
          />
        </div>
      </div>
    </div>
  );
};
