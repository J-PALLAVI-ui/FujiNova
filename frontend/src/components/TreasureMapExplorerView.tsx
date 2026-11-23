import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Star, 
  Share2, 
  Heart, 
  Bus
} from 'lucide-react';
import { JourneyCompanionPanel } from './JourneyCompanionPanel';

interface DiscoveryPin {
  id: string;
  name: string;
  tag: string;
  category: string;
  latitude: number;
  longitude: number;
  discovered: boolean;
  icon: string;
  image_url: string;
  hint: string;
}

export const TreasureMapExplorerView: React.FC = () => {
  const [discoveries, setDiscoveries] = useState<DiscoveryPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<DiscoveryPin | null>(null);
  const [progress, setProgress] = useState({ discovered: 3, total: 7, percentage: 43 });
  const [activeLayers, setActiveLayers] = useState({
    traffic: true,
    transit: true,
    walking: true,
    destinations: true
  });

  useEffect(() => {
    const fetchTreasureData = async () => {
      try {
        const resp = await fetch('/api/v1/journey/treasure-map');
        if (resp.ok) {
          const data = await resp.json();
          setDiscoveries(data.discoveries || []);
          if (data.progress) {
            setProgress(data.progress);
          }
          if (data.discoveries && data.discoveries.length > 0) {
            setSelectedPin(data.discoveries[0]);
          }
        }
      } catch (err) {
        console.error('Treasure map fetch error:', err);
      }
    };
    fetchTreasureData();
  }, []);

  const toggleLayer = (key: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* View Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#EAD7C8]/60">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧭</span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#29252B]">Treasure Map Explorer</h2>
            <p className="text-xs text-[#625966]">Interactive landmark hunt, hidden local discoveries & live journey companion</p>
          </div>
        </div>
      </div>

      {/* 1. Hana Guidance Banner (from User Mockup) */}
      <div className="bg-white rounded-2xl border border-[#EAD7C8] p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-[#E9A5B5] shadow-xs">
          <img 
            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80" 
            alt="Hana" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs sm:text-sm text-[#29252B]">Hana</span>
            <span className="text-xs">🌸</span>
          </div>
          <p className="text-xs sm:text-sm text-[#403944] font-medium leading-snug">
            You're on your Mount Fuji journey! Next, let's go to Chureito Pagoda. I'll guide you step by step!
          </p>
        </div>
      </div>

      {/* 2. Main Exploration Stage (Map + Companion) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Map View */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Treasure Hunt Progress Bar */}
          <div className="bg-white rounded-xl border border-[#EAD7C8] p-3 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <div>
                <h4 className="text-xs font-bold text-[#29252B]">Treasure Hunt Progress</h4>
                <p className="text-[11px] text-[#625966]">{progress.discovered} / {progress.total} Discoveries Completed</p>
              </div>
            </div>
            
            {/* Badges preview */}
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-[#E9A5B5]/25 text-[#A83F70] flex items-center justify-center text-xs font-bold" title="Viewpoint Pioneer">📷</span>
              <span className="w-7 h-7 rounded-full bg-[#789477]/25 text-[#789477] flex items-center justify-center text-xs font-bold" title="Matcha Connoisseur">🍵</span>
              <span className="w-7 h-7 rounded-full bg-[#B99BCB]/25 text-[#87365E] flex items-center justify-center text-xs font-bold" title="Shrine Pilgrim">⛩️</span>
              <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold" title="Hidden Gem Hunter">🔒</span>
            </div>
          </div>

          {/* Interactive Map Canvas Container */}
          <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-[#EAD7C8] shadow-sm bg-[#E8E0D5]">
            {/* Mount Fuji Scenic Landscape Background */}
            <img 
              src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&auto=format&fit=crop&q=80" 
              alt="Mount Fuji Lake Kawaguchi Map"
              className="w-full h-full object-cover filter saturate-[0.85] contrast-[1.05]"
            />

            {/* Map Overlay & Route Lines SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Route line connecting stops */}
              <path 
                d="M 280 430 Q 380 320 460 270 T 360 170 T 260 210" 
                fill="none" 
                stroke="#87365E" 
                strokeWidth="4" 
                strokeDasharray="6,6"
              />
              <path 
                d="M 280 430 L 460 270" 
                fill="none" 
                stroke="#789477" 
                strokeWidth="2.5" 
                strokeOpacity="0.8"
              />
            </svg>

            {/* Map Pins */}
            {discoveries.map((pin, pIdx) => {
              const isSelected = selectedPin?.id === pin.id;
              // Coordinates projected to percentage on canvas
              const positions: Record<string, { top: string; left: string }> = {
                kawaguchiko_station: { top: '78%', left: '32%' },
                chureito_pagoda: { top: '56%', left: '68%' },
                arakurayama_viewpoint: { top: '48%', left: '72%' },
                lake_kawaguchi: { top: '35%', left: '42%' },
                oishi_park: { top: '24%', left: '26%' },
                cafe_mignon: { top: '44%', left: '52%' },
                momiji_tunnel: { top: '18%', left: '36%' }
              };
              const pos = positions[pin.id] || { top: `${30 + pIdx * 8}%`, left: `${40 + pIdx * 6}%` };

              return (
                <div 
                  key={pin.id}
                  style={{ top: pos.top, left: pos.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                  onClick={() => setSelectedPin(pin)}
                >
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-md transition-all ${
                    isSelected 
                      ? 'bg-[#87365E] text-white scale-110 ring-4 ring-[#E9A5B5]' 
                      : pin.discovered 
                        ? 'bg-white text-[#29252B] hover:scale-105' 
                        : 'bg-[#FAF5F0] text-[#625966] opacity-90'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-[#789477] inline-block" />
                    <span>{pin.name.split(' (')[0]}</span>
                    {pin.tag && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                        pin.tag.includes('Next') 
                          ? 'bg-[#C66B4E] text-white' 
                          : 'bg-[#F7EFE5] text-[#87365E]'
                      }`}>
                        {pin.tag}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Map Layer Controls (Top Right) */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-[#EAD7C8] shadow-sm text-xs space-y-1 z-20">
              <div className="font-bold text-[#29252B] text-[11px] pb-1 border-b border-[#F7EFE5] flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#789477]" />
                <span>Layers</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#403944]">
                <input 
                  type="checkbox" 
                  checked={activeLayers.traffic} 
                  onChange={() => toggleLayer('traffic')}
                  className="rounded text-[#87365E]" 
                />
                <span>Traffic (Live)</span>
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

            {/* Bottom Legend Pill */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-[#EAD7C8] shadow-xs text-[10px] flex items-center gap-3 z-20 text-[#625966]">
              <div className="flex items-center gap-1">
                <span className="w-3 h-1 bg-[#87365E] rounded-full inline-block" />
                <span>Day Plan Route</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-1 bg-[#789477] rounded-full inline-block" />
                <span>Transit Line</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Destination Card & Live Journey Companion */}
        <div className="lg:col-span-4 space-y-4">
          {/* Destination Details Preview (Screen 2 from user mockup) */}
          {selectedPin && (
            <div className="bg-white rounded-2xl border border-[#EAD7C8] shadow-sm p-4 text-xs space-y-2.5">
              <div className="relative h-36 rounded-xl overflow-hidden border border-[#EAD7C8]">
                <img 
                  src={selectedPin.image_url} 
                  alt={selectedPin.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#29252B]">{selectedPin.name}</h3>
                  <span className="text-[10px] bg-[#C66B4E]/15 text-[#C66B4E] font-bold px-2 py-0.5 rounded">
                    {selectedPin.tag}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#625966] mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-[#29252B]">4.7</span>
                  <span>(18,429 reviews)</span>
                </div>
              </div>

              <p className="text-[#625966] leading-relaxed">
                {selectedPin.hint}
              </p>

              {/* Transit Access */}
              <div className="bg-[#F7EFE5]/50 p-2.5 rounded-xl border border-[#EAD7C8] space-y-1">
                <div className="font-bold text-[#29252B] flex items-center gap-1 text-[11px]">
                  <Bus className="w-3 h-3 text-[#87365E]" />
                  <span>How to get here (from Kawaguchiko):</span>
                </div>
                <p className="text-[11px] text-[#625966]">Fujikyu Bus F1 (13:40 ➔ 14:02, 22 min) + Walk 10 min (550 m, uphill)</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => alert(`Saved ${selectedPin.name} to journal!`)}
                  className="flex-1 py-2 rounded-xl bg-[#87365E] hover:bg-[#A83F70] text-white font-bold transition-colors text-center cursor-pointer"
                >
                  Save Discovery
                </button>
              </div>
            </div>
          )}

          {/* Live Journey Companion Controller */}
          <JourneyCompanionPanel />
        </div>
      </div>
    </div>
  );
};
