import React, { useState } from 'react';

interface JourneyStepItem {
  step_number: number;
  title: string;
  mode: 'train' | 'walk' | 'bus' | 'arrival';
  duration_min: number;
  distance_m: number;
  line_name: string;
  instruction: string;
  details: string;
  badge: string;
  photo_url?: string;
}

interface Step4Props {
  originName?: string;
  destinationName?: string;
  totalTimeMin?: number;
  distanceKm?: number;
  fareJpy?: number;
  transfersCount?: number;
  onBack?: () => void;
  onSaveTrip?: () => void;
}

export const Step4DetailedJourney: React.FC<Step4Props> = ({
  originName = 'Kawaguchiko Station',
  destinationName = 'Chureito Pagoda',
  totalTimeMin = 18,
  distanceKm = 4.2,
  fareJpy = 210,
  transfersCount = 0,
  onBack,
  onSaveTrip
}) => {
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite' | 'elevation'>('standard');
  const [zoomLevel, setZoomLevel] = useState(1);

  const steps: JourneyStepItem[] = [
    {
      step_number: 1,
      title: 'Depart from Kawaguchiko Station',
      mode: 'train',
      duration_min: 3,
      distance_m: 2900,
      line_name: 'Fujikyu Railway Line',
      instruction: 'Take the Fujikyu Railway to Fujisan Station.',
      details: 'Depart: 14:28 | Platform: 1 | Fare: ¥210',
      badge: '3 min'
    },
    {
      step_number: 2,
      title: 'Arrive at Fujisan Station',
      mode: 'walk',
      duration_min: 12,
      distance_m: 900,
      line_name: 'Walking Route',
      instruction: 'Exit the station and follow signs to Chureito Pagoda.',
      details: 'Walk northeast along the scenic pedestrian sidewalk towards Arakura Sengen Park.',
      badge: '12 min (900 m)'
    },
    {
      step_number: 3,
      title: 'Arrive at Chureito Pagoda (Arakurayama Sengen Park)',
      mode: 'arrival',
      duration_min: 0,
      distance_m: 0,
      line_name: 'Destination',
      instruction: 'Enjoy the iconic view of Mt. Fuji and the pagoda!',
      details: 'Climb the 398 stone steps or take the gently sloped cherry blossom ramp to the deck.',
      badge: 'Arrival Point',
      photo_url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=300&auto=format&fit=crop&q=80'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#FCF8F5] text-[#29252B] rounded-2xl shadow-md border border-[#E8D9CD] overflow-hidden select-none max-w-sm w-full mx-auto relative">
      {/* Top Header */}
      <div className="bg-[#FFF4EC] px-4 py-2.5 flex items-center justify-between border-b border-[#EBDCD0]">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs text-[#29252B] shadow-2xs hover:bg-[#FAF0E6]"
        >
          ‹
        </button>
        <span className="font-bold text-xs tracking-tight text-[#29252B]">Your Journey Plan</span>
        <div className="flex items-center gap-2 text-xs text-[#7A6C76]">
          <span className="cursor-pointer hover:text-[#C66B4E]" onClick={onSaveTrip} title="Save to My Travel">
            🤍
          </span>
          <span className="cursor-pointer hover:text-[#C66B4E]">↗</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Interactive Route Map Container */}
        <div className="relative rounded-xl overflow-hidden shadow-xs border border-[#E7D6CA] h-52 bg-[#EFE6DC]">
          {/* Map Graphic Canvas / SVG with Real Landmarks */}
          <svg
            viewBox="0 0 320 210"
            className="w-full h-full object-cover select-none"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s' }}
          >
            {/* Background Map Contours */}
            <rect width="320" height="210" fill="#E8DEC8" />

            {/* Lake Kawaguchiko Body */}
            <path
              d="M 10 30 Q 60 15, 110 35 T 140 70 Q 110 90, 70 80 T 10 70 Z"
              fill="#A2C8D9"
              stroke="#7BA7BD"
              strokeWidth="1.5"
            />
            <text x="35" y="55" fontSize="8" fill="#2C5266" fontWeight="bold">Lake Kawaguchiko</text>

            {/* Mount Fuji Symbol & Label */}
            <g transform="translate(230, 120)">
              {/* Volcano base and snowcap */}
              <polygon points="0,45 40,0 80,45" fill="#7C8B99" stroke="#5D6C7A" strokeWidth="1" />
              <polygon points="25,17 40,0 55,17 48,22 40,19 32,22" fill="#FFFFFF" />
              <text x="40" y="56" fontSize="8" fill="#29252B" textAnchor="middle" fontWeight="extrabold">Mt. Fuji</text>
              <text x="40" y="65" fontSize="6.5" fill="#554A53" textAnchor="middle">(3,776 m)</text>
            </g>

            {/* Connected Journey Path (Train Line: Vermilion solid; Walk Line: Dotted Green) */}
            {/* Kawaguchiko Station -> Fujisan Station */}
            <path
              d="M 50 140 Q 95 125, 140 115"
              fill="none"
              stroke="#C66B4E"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Fujisan Station -> Chureito Pagoda */}
            <path
              d="M 140 115 Q 190 90, 240 60"
              fill="none"
              stroke="#789477"
              strokeWidth="3"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />

            {/* Kawaguchiko Station Node */}
            <g transform="translate(50, 140)">
              <circle r="9" fill="#C66B4E" stroke="#FFFFFF" strokeWidth="2" />
              <text x="0" y="3" fontSize="8" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">🚆</text>
              <rect x="-40" y="12" width="80" height="15" rx="3" fill="#FFFFFF" stroke="#C66B4E" strokeWidth="0.8" />
              <text x="0" y="22" fontSize="7" fill="#29252B" textAnchor="middle" fontWeight="bold">Kawaguchiko Station</text>
            </g>

            {/* Fujisan Station Transfer Node */}
            <g transform="translate(140, 115)">
              <circle r="7" fill="#29252B" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x="0" y="-10" fontSize="7" fill="#29252B" textAnchor="middle" fontWeight="bold">Fujisan Stn</text>
              <text x="0" y="-3" fontSize="5.5" fill="#7A6C76" textAnchor="middle">(Walk 12m)</text>
            </g>

            {/* Chureito Pagoda Node */}
            <g transform="translate(240, 60)">
              <circle r="10" fill="#E9A5B5" stroke="#FFFFFF" strokeWidth="2" />
              <text x="0" y="3" fontSize="9" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">🌸</text>
              <rect x="-35" y="-22" width="70" height="15" rx="3" fill="#FFFFFF" stroke="#C66B4E" strokeWidth="0.8" />
              <text x="0" y="-12" fontSize="7" fill="#C66B4E" textAnchor="middle" fontWeight="bold">Chureito Pagoda</text>
            </g>
          </svg>

          {/* Floating Map Tools */}
          <div className="absolute right-2 top-2 flex flex-col gap-1 z-10">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.6))}
              className="w-6 h-6 rounded-md bg-white/90 text-xs font-bold text-[#29252B] shadow-2xs flex items-center justify-center hover:bg-white"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
              className="w-6 h-6 rounded-md bg-white/90 text-xs font-bold text-[#29252B] shadow-2xs flex items-center justify-center hover:bg-white"
            >
              −
            </button>
            <button
              onClick={() => setMapLayer(mapLayer === 'standard' ? 'satellite' : 'standard')}
              className="w-6 h-6 rounded-md bg-white/90 text-[10px] text-[#29252B] shadow-2xs flex items-center justify-center hover:bg-white"
              title="Toggle Layer"
            >
              🗺️
            </button>
          </div>
        </div>

        {/* Journey Summary Bar */}
        <div className="bg-white rounded-xl p-3 border border-[#EBDCD0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-[#29252B] leading-tight">
              {originName} → {destinationName}
            </h3>
            <span className="text-[9px] bg-[#FAF2EB] text-[#7A6C76] px-2 py-0.5 rounded-full font-medium border border-[#EAD7C8]">
              Illustrative Route (Example Data)
            </span>
          </div>

          {/* 4 Stat Badges */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
            <div className="bg-[#FAF2EB] p-1.5 rounded-lg border border-[#F0E3D8]">
              <span className="text-xs">⏱️</span>
              <p className="font-extrabold text-[11px] text-[#29252B] leading-tight mt-0.5">{totalTimeMin} min</p>
              <p className="text-[8px] text-[#7A6C76] leading-none">Total Time</p>
            </div>

            <div className="bg-[#FAF2EB] p-1.5 rounded-lg border border-[#F0E3D8]">
              <span className="text-xs">📏</span>
              <p className="font-extrabold text-[11px] text-[#29252B] leading-tight mt-0.5">~{distanceKm} km</p>
              <p className="text-[8px] text-[#7A6C76] leading-none">Distance</p>
            </div>

            <div className="bg-[#FAF2EB] p-1.5 rounded-lg border border-[#F0E3D8]">
              <span className="text-xs">💴</span>
              <p className="font-extrabold text-[11px] text-[#C66B4E] leading-tight mt-0.5">¥{fareJpy}</p>
              <p className="text-[8px] text-[#7A6C76] leading-none">Fare (Train)</p>
            </div>

            <div className="bg-[#FAF2EB] p-1.5 rounded-lg border border-[#F0E3D8]">
              <span className="text-xs">🚉</span>
              <p className="font-extrabold text-[11px] text-[#789477] leading-tight mt-0.5">
                {transfersCount === 0 ? '1 Stop' : `${transfersCount} Transfer`}
              </p>
              <p className="text-[8px] text-[#7A6C76] leading-none">(No Transfer)</p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Journey Card */}
        <div className="bg-white rounded-xl p-3 border border-[#EBDCD0] shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-xs text-[#29252B]">
            <span className="text-sm">🌸</span>
            <span>Step-by-Step Journey</span>
          </div>

          <div className="space-y-3 relative before:absolute before:top-3 before:bottom-3 before:left-3 before:w-0.5 before:bg-[#EAD7C8] pl-1">
            {steps.map((st) => (
              <div key={st.step_number} className="relative flex items-start gap-2.5">
                {/* Mode Node Icon */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 z-10 border-2 border-white shadow-2xs ${
                    st.mode === 'train'
                      ? 'bg-[#C66B4E] text-white'
                      : st.mode === 'walk'
                      ? 'bg-[#789477] text-white'
                      : 'bg-[#E9A5B5] text-[#29252B]'
                  }`}
                >
                  {st.mode === 'train' && '🚆'}
                  {st.mode === 'walk' && '🚶'}
                  {st.mode === 'arrival' && '📍'}
                </div>

                {/* Content */}
                <div className="flex-1 bg-[#FCF8F5] p-2 rounded-lg border border-[#F0E3D8] text-[11px]">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#29252B] leading-tight">{st.title}</p>
                    <span className="text-[9px] bg-white px-1.5 py-0.2 rounded-full border border-[#EAD7C8] font-bold text-[#7A6C76]">
                      {st.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#403944] mt-0.5">{st.instruction}</p>
                  <p className="text-[9px] text-[#7A6C76] mt-0.5">{st.details}</p>

                  {st.photo_url && (
                    <div className="mt-1.5 rounded-md overflow-hidden border border-[#EBDCD0] h-16 w-full">
                      <img src={st.photo_url} alt={st.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Indicator Footer */}
      <div className="bg-[#FAF0E6] border-t border-[#E8D7CA] px-3 py-2 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C66B4E]">
          <span className="w-4 h-4 rounded-full bg-[#C66B4E] text-white text-[10px] flex items-center justify-center font-bold">4</span>
          <span>Follow Your Detailed Journey</span>
        </div>
        <p className="text-[10px] text-[#7A6C76]">View the route on map with step-by-step directions</p>
      </div>
    </div>
  );
};
