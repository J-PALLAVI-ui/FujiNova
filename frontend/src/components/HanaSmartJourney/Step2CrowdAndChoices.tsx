import React, { useState } from 'react';

interface CrowdAlternative {
  id: string;
  name_en: string;
  name_ja: string;
  crowd_level: string;
  score: number;
  reason: string;
}

interface Step2Props {
  destinationName?: string;
  destinationLocation?: string;
  destinationImage?: string;
  crowdLevel?: string;
  crowdScore?: number;
  confidencePct?: number;
  observedTime?: string;
  lastUpdateText?: string;
  onSelectChoice: (choiceId: string, alternative?: CrowdAlternative) => void;
  onProceedToTransport: () => void;
  onBack?: () => void;
}

export const Step2CrowdAndChoices: React.FC<Step2Props> = ({
  destinationName = 'Chureito Pagoda',
  destinationLocation = 'Arakurayama Sengen Park · Fujiyoshida, Yamanashi',
  destinationImage = 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=80',
  crowdLevel = 'High',
  crowdScore = 78,
  confidencePct = 78,
  observedTime = 'Today, 2:10 PM (JST)',
  lastUpdateText = '5 minutes ago',
  onSelectChoice,
  onProceedToTransport,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'crowd' | 'access' | 'nearby' | 'photos'>('crowd');
  const [activeAlternativeModal, setActiveAlternativeModal] = useState<string | null>(null);

  const sampleAlternatives: Record<string, CrowdAlternative[]> = {
    quieter_places: [
      {
        id: 'arakura_peace_trail',
        name_en: 'Arakurayama Peace Pagoda Forest Trail',
        name_ja: '新倉山平和観音遊歩道',
        crowd_level: 'Very Low',
        score: 20,
        reason: 'Quiet shaded forest path directly above main pagoda with peaceful unobstructed Fuji views.'
      },
      {
        id: 'saiko_iyashinosato',
        name_en: 'Lake Saiko Iyashi-no-Sato Nenba',
        name_ja: '西湖いやしの里根場',
        crowd_level: 'Low',
        score: 28,
        reason: 'Thatched-roof artisan village along quiet Lake Saiko with open craft workshops.'
      }
    ],
    famous_alternatives: [
      {
        id: 'oishi_park',
        name_en: 'Oishi Park (Kawaguchiko North Shore)',
        name_ja: '大石公園',
        crowd_level: 'Moderate',
        score: 52,
        reason: 'Iconic floral terrace overlooking Lake Kawaguchiko with open walkways and cafe.'
      },
      {
        id: 'kitaguchi_sengen',
        name_en: 'Kitaguchi Hongu Fuji Sengen Shrine',
        name_ja: '北口本宮冨士浅間神社',
        crowd_level: 'Moderate',
        score: 45,
        reason: 'Millennium-old sacred cedar sanctuary with towering stone lanterns.'
      }
    ],
    hidden_gems: [
      {
        id: 'narusawa_ice_cave',
        name_en: 'Narusawa Ice Cave',
        name_ja: '鳴沢氷穴',
        crowd_level: 'Low',
        score: 30,
        reason: 'Subterranean volcanic lava tube naturally encased in year-round ice stalactites.'
      },
      {
        id: 'kaneyamaen_gardens',
        name_en: 'Hotel Kaneyamaen Stroll Garden',
        name_ja: '鐘山苑 日本庭園',
        crowd_level: 'Very Low',
        score: 18,
        reason: '20,000-tsubo authentic Japanese garden featuring a traditional tea pavilion.'
      }
    ]
  };

  const handleChoiceClick = (choiceId: string) => {
    if (choiceId === 'keep_destination') {
      onSelectChoice('keep_destination');
      onProceedToTransport();
    } else {
      setActiveAlternativeModal(choiceId);
    }
  };

  const handlePickAlternative = (alt: CrowdAlternative) => {
    setActiveAlternativeModal(null);
    onSelectChoice('alternative_selected', alt);
    onProceedToTransport();
  };

  // Semi-circle SVG angle calculation for gauge
  // Angle from -180 deg (low) to 0 deg (high)
  const angle = -180 + (crowdScore / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const needleX = 100 + 70 * Math.cos(radians);
  const needleY = 100 + 70 * Math.sin(radians);

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
        <span className="font-bold text-xs tracking-tight text-[#29252B]">Destination Details</span>
        <div className="flex items-center gap-2 text-xs text-[#7A6C76]">
          <span className="cursor-pointer hover:text-[#C66B4E]">🤍</span>
          <span className="cursor-pointer hover:text-[#C66B4E]">↗</span>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Destination Photo Banner */}
        <div className="relative rounded-xl overflow-hidden shadow-xs border border-[#E7D6CA] h-28 bg-[#FFF4EE] flex flex-col justify-end p-2.5">
          <img
            src={destinationImage}
            alt={destinationName}
            className="absolute inset-0 w-full h-full object-cover brightness-[0.92]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative z-10 text-white">
            <h2 className="font-bold text-sm leading-tight drop-shadow-xs">{destinationName}</h2>
            <p className="text-[10px] text-white/90 drop-shadow-xs flex items-center gap-1">
              <span>📍</span>
              <span>{destinationLocation}</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-[#EBDCD0] text-[11px] font-medium text-[#7A6C76]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-1 px-1.5 ${activeTab === 'overview' ? 'text-[#C66B4E] border-b-2 border-[#C66B4E] font-bold' : 'hover:text-[#29252B]'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('crowd')}
            className={`pb-1 px-1.5 ${activeTab === 'crowd' ? 'text-[#C66B4E] border-b-2 border-[#C66B4E] font-bold' : 'hover:text-[#29252B]'}`}
          >
            Crowd
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`pb-1 px-1.5 ${activeTab === 'access' ? 'text-[#C66B4E] border-b-2 border-[#C66B4E] font-bold' : 'hover:text-[#29252B]'}`}
          >
            Access
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`pb-1 px-1.5 ${activeTab === 'nearby' ? 'text-[#C66B4E] border-b-2 border-[#C66B4E] font-bold' : 'hover:text-[#29252B]'}`}
          >
            Nearby
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`pb-1 px-1.5 ${activeTab === 'photos' ? 'text-[#C66B4E] border-b-2 border-[#C66B4E] font-bold' : 'hover:text-[#29252B]'}`}
          >
            Photos
          </button>
        </div>

        {/* Crowd Information Card */}
        <div className="bg-white rounded-xl p-3 border border-[#EBDCD0] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#29252B]">
              <span>👥</span>
              <span>Crowd Information</span>
            </div>
            <span className="text-[9px] bg-[#FFF0E8] text-[#C66B4E] px-2 py-0.5 rounded-full font-medium border border-[#FADCCB]">
              Illustrative Example (Not Live)
            </span>
          </div>

          {/* Semi-Circular Radial Gauge */}
          <div className="flex flex-col items-center justify-center pt-1 pb-1">
            <div className="relative w-44 h-24 flex items-end justify-center overflow-hidden">
              <svg viewBox="0 0 200 110" className="w-full h-full">
                {/* Background Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#F3E9E2"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                {/* Active Gradient Arc (Green to Amber to Vermilion) */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#crowdGradient)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="crowdGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#789477" />
                    <stop offset="50%" stopColor="#E9A5B5" />
                    <stop offset="100%" stopColor="#C66B4E" />
                  </linearGradient>
                </defs>

                {/* Gauge Needle */}
                <circle cx="100" cy="100" r="7" fill="#29252B" />
                <line
                  x1="100"
                  y1="100"
                  x2={needleX}
                  y2={needleY}
                  stroke="#29252B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx={needleX} cy={needleY} r="3" fill="#C66B4E" />
              </svg>

              {/* Gauge Text Overlay */}
              <div className="absolute bottom-0 text-center flex flex-col items-center">
                <span className="text-[10px] text-[#7A6C76] font-medium">Current Crowd Level</span>
                <span className="text-base font-extrabold text-[#C66B4E] leading-none">{crowdLevel}</span>
              </div>
            </div>

            <span className="mt-1 text-[9px] bg-[#FAF2EB] text-[#7A6C76] px-2 py-0.5 rounded-full font-medium">
              Live Status: <span className="text-[#C66B4E] font-bold">Estimated</span>
            </span>
          </div>

          {/* Metadata Table */}
          <div className="bg-[#FCF8F5] rounded-lg p-2 text-[10px] space-y-1 border border-[#F0E3D8]">
            <div className="flex justify-between text-[#7A6C76]">
              <span>Source</span>
              <span className="font-semibold text-[#29252B]">CrowdSense (Multi-Source)</span>
            </div>
            <div className="flex justify-between text-[#7A6C76]">
              <span>Observed</span>
              <span className="font-semibold text-[#29252B]">{observedTime}</span>
            </div>
            <div className="flex justify-between text-[#7A6C76]">
              <span>Confidence</span>
              <span className="font-semibold text-[#789477]">High ({confidencePct}%)</span>
            </div>
            <div className="flex justify-between text-[#7A6C76]">
              <span>Data Type</span>
              <span className="font-semibold text-[#29252B]">Estimated (based on busyness, trends & sensors)</span>
            </div>
            <div className="flex justify-between text-[#7A6C76]">
              <span>Last Update</span>
              <span className="font-semibold text-[#29252B]">{lastUpdateText}</span>
            </div>
          </div>
        </div>

        {/* Hana Assistant Prompt Card */}
        <div className="bg-[#FFF0F4] border border-[#FAD6DF] rounded-xl p-3 shadow-2xs space-y-2.5">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E9A5B5] shrink-0 bg-white">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
                alt="Hana"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-[11px] leading-tight text-[#403944]">
              <p className="font-semibold text-[#A83F70]">
                {destinationName} appears to be busy right now.
              </p>
              <p className="mt-0.5 text-[#554A53]">Would you like to explore another option?</p>
            </div>
          </div>

          {/* 4 Interactive Choices */}
          <div className="space-y-1.5 pt-1">
            {/* Choice 1: Quieter places */}
            <button
              onClick={() => handleChoiceClick('quieter_places')}
              className="w-full p-2 rounded-lg bg-white border border-[#EAD7C8] hover:border-[#789477] text-left flex items-center justify-between shadow-2xs group transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base text-[#789477]">🍃</span>
                <div>
                  <p className="font-bold text-[11px] text-[#29252B] leading-tight">Yes, show me quieter places</p>
                  <p className="text-[9px] text-[#7A6C76] leading-tight">Similar views with lower crowd levels</p>
                </div>
              </div>
              <span className="text-xs text-[#7A6C76] group-hover:translate-x-0.5 transition-transform">›</span>
            </button>

            {/* Choice 2: Famous alternative */}
            <button
              onClick={() => handleChoiceClick('famous_alternatives')}
              className="w-full p-2 rounded-lg bg-white border border-[#EAD7C8] hover:border-[#C66B4E] text-left flex items-center justify-between shadow-2xs group transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base text-[#C66B4E]">🗻</span>
                <div>
                  <p className="font-bold text-[11px] text-[#29252B] leading-tight">Show me another famous attraction</p>
                  <p className="text-[9px] text-[#7A6C76] leading-tight">A popular place with fewer crowds</p>
                </div>
              </div>
              <span className="text-xs text-[#7A6C76] group-hover:translate-x-0.5 transition-transform">›</span>
            </button>

            {/* Choice 3: Hidden gems */}
            <button
              onClick={() => handleChoiceClick('hidden_gems')}
              className="w-full p-2 rounded-lg bg-white border border-[#EAD7C8] hover:border-[#B99BCB] text-left flex items-center justify-between shadow-2xs group transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base text-[#B99BCB]">✨</span>
                <div>
                  <p className="font-bold text-[11px] text-[#29252B] leading-tight">Show hidden gems</p>
                  <p className="text-[9px] text-[#7A6C76] leading-tight">Less-visited spots that match my interests</p>
                </div>
              </div>
              <span className="text-xs text-[#7A6C76] group-hover:translate-x-0.5 transition-transform">›</span>
            </button>

            {/* Choice 4: Keep original destination */}
            <button
              onClick={() => handleChoiceClick('keep_destination')}
              className="w-full p-2 rounded-lg bg-[#F8F3ED] border border-[#DFCFC2] hover:border-[#29252B] text-left flex items-center justify-between shadow-2xs group transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base text-[#29252B]">✅</span>
                <div>
                  <p className="font-bold text-[11px] text-[#29252B] leading-tight">I still want to visit {destinationName.split(' ')[0]}</p>
                  <p className="text-[9px] text-[#7A6C76] leading-tight">Keep this destination and show the route</p>
                </div>
              </div>
              <span className="text-xs text-[#7A6C76] group-hover:translate-x-0.5 transition-transform">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alternative Recommendations Modal / Flyout */}
      {activeAlternativeModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex flex-col justify-end z-30 p-3">
          <div className="bg-[#FFF9F5] rounded-xl p-3 border border-[#EBDCD0] shadow-lg space-y-2.5 max-h-[80%] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-2">
              <span className="font-bold text-xs text-[#C66B4E]">
                {activeAlternativeModal === 'quieter_places' && '🍃 Quieter Alternative Places'}
                {activeAlternativeModal === 'famous_alternatives' && '🗻 Famous Highlights with Calmer Crowds'}
                {activeAlternativeModal === 'hidden_gems' && '✨ Peaceful Hidden Gems'}
              </span>
              <button
                onClick={() => setActiveAlternativeModal(null)}
                className="w-5 h-5 rounded-full bg-gray-200 text-xs flex items-center justify-center font-bold text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {(sampleAlternatives[activeAlternativeModal] || []).map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => handlePickAlternative(alt)}
                  className="bg-white p-2.5 rounded-lg border border-[#EAD7C8] hover:border-[#C66B4E] cursor-pointer shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-[#29252B]">{alt.name_en}</p>
                    <span className="text-[9px] bg-[#EBF4EB] text-[#3D663C] px-1.5 py-0.5 rounded-full font-bold">
                      {alt.crowd_level} ({alt.score}%)
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7A6C76] italic">{alt.name_ja}</p>
                  <p className="text-[10px] text-[#403944]">{alt.reason}</p>
                  <div className="text-right">
                    <span className="text-[9px] text-[#C66B4E] font-bold">Select & View Route →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step Indicator Footer */}
      <div className="bg-[#FAF0E6] border-t border-[#E8D7CA] px-3 py-2 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C66B4E]">
          <span className="w-4 h-4 rounded-full bg-[#C66B4E] text-white text-[10px] flex items-center justify-center font-bold">2</span>
          <span>Check Crowd & Choose</span>
        </div>
        <p className="text-[10px] text-[#7A6C76]">See crowd details and pick your preferred option</p>
      </div>
    </div>
  );
};
