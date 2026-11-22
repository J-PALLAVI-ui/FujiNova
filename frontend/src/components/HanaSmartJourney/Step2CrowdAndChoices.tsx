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
  
  // First-party opt-in crowd report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLevel, setReportLevel] = useState<'Quiet' | 'Normal' | 'Busy' | 'Very Busy'>('Normal');
  const [reportConsent, setReportConsent] = useState(true);
  const [reportsCount, setReportsCount] = useState(1); // default demo state: 1 report (below threshold of 3)
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState(crowdLevel);
  const [currentScore, setCurrentScore] = useState(crowdScore);

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

  const handleSubmitReport = async () => {
    if (!reportConsent) return;
    try {
      await fetch('/api/v1/crowd/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: destinationName.toLowerCase().replace(/\s+/g, '_'),
          crowd_level: reportLevel,
          device_id: 'browser_user_session',
          consent: reportConsent,
          coarse_area: 'Fuji Five Lakes'
        })
      });
    } catch {
      // Offline fallback
    }

    const nextCount = reportsCount + 1;
    setReportsCount(nextCount);
    if (nextCount >= 3) {
      setCurrentLevel(reportLevel === 'Very Busy' ? 'High' : reportLevel);
      setCurrentScore(reportLevel === 'Quiet' ? 25 : reportLevel === 'Normal' ? 50 : reportLevel === 'Busy' ? 75 : 90);
    }
    setReportSuccessMsg('Report submitted! Thank you for contributing to crowd awareness.');
    setTimeout(() => {
      setShowReportModal(false);
      setReportSuccessMsg(null);
    }, 1600);
  };

  // Semi-circle SVG angle calculation for gauge
  // Angle from -180 deg (low) to 0 deg (high)
  const angle = -180 + (currentScore / 100) * 180;
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
            {reportsCount >= 3 ? (
              <span className="text-[9px] bg-[#EBF4EB] text-[#3D663C] px-2 py-0.5 rounded-full font-bold border border-[#D5E5D5]">
                Live Community Verified ({reportsCount} reports)
              </span>
            ) : (
              <span className="text-[9px] bg-[#FFF0E8] text-[#C66B4E] px-2 py-0.5 rounded-full font-medium border border-[#FADCCB]">
                Crowd Data: Unavailable (Reports: {reportsCount}/3)
              </span>
            )}
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
                <span className="text-base font-extrabold text-[#C66B4E] leading-none">
                  {currentLevel}
                </span>
                {reportsCount < 3 && (
                  <span className="text-[7.5px] text-[#A83F70] font-bold">
                    (Live Unavailable &lt; 3)
                  </span>
                )}
              </div>
            </div>

            <span className="mt-1 text-[9px] bg-[#FAF2EB] text-[#7A6C76] px-2 py-0.5 rounded-full font-medium">
              Live Status: <span className="text-[#C66B4E] font-bold">{reportsCount >= 3 ? 'Live Community Verified' : 'Unavailable (Showing Historical Model)'}</span>
            </span>
          </div>

          {/* Metadata Table */}
          <div className="bg-[#FCF8F5] rounded-lg p-2 text-[10px] space-y-1 border border-[#F0E3D8]">
            <div className="flex justify-between text-[#7A6C76]">
              <span>Source</span>
              <span className="font-semibold text-[#29252B]">
                {reportsCount >= 3 ? 'FujiNova First-Party Opt-in Community' : 'CrowdSense (Multi-Source)'}
              </span>
            </div>
            <div className="flex justify-between text-[#7A6C76]">
              <span>Observed</span>
              <span className="font-semibold text-[#29252B]">{observedTime}</span>
            </div>
            <div className="flex justify-between text-[#7A6C76]">
              <span>Confidence</span>
              <span className="font-semibold text-[#789477]">
                {reportsCount >= 3 ? `High (${confidencePct}%)` : `High (${confidencePct}%)`}
              </span>
            </div>
            <div className="flex justify-between text-[#7A6C76]">
              <span>Data Type</span>
              <span className="font-semibold text-[#29252B]">
                {reportsCount >= 3 ? 'Live Community Reports' : 'Estimated (based on busyness, trends & sensors)'}
              </span>
            </div>
            <div className="flex justify-between text-[#7A6C76]">
              <span>Live Reports</span>
              <span className="font-semibold text-[#C66B4E]">
                {reportsCount} fresh reports (last 60m) · Min 3 required
              </span>
            </div>
            <div className="flex justify-between text-[#7A6C76]">
              <span>Last Update</span>
              <span className="font-semibold text-[#29252B]">{lastUpdateText}</span>
            </div>
          </div>

          {/* First-Party Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full py-1.5 px-2 bg-[#FFF0F4] hover:bg-[#FFE4EC] text-[#A83F70] border border-[#FAD6DF] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <span>🌸</span>
            <span>Report Current Crowd Level</span>
          </button>
        </div>

        {/* Dedicated Typical Crowd Pattern (Historical Estimate) Card */}
        <div className="bg-white rounded-xl p-3 border border-[#EBDCD0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#29252B]">
              <span>📊</span>
              <span>Typical Crowd Pattern</span>
            </div>
            <span className="text-[8.5px] bg-[#FAF2EB] text-[#7A6C76] px-1.5 py-0.5 rounded font-medium border border-[#EBDCD0]">
              Historical Estimate (Not Live)
            </span>
          </div>

          <p className="text-[9.5px] text-[#554A53] leading-relaxed">
            Historical baseline calibrated against peak visiting hours and clear weather days around Mount Fuji:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[#FCF8F5] p-2 rounded-lg border border-[#F0E3D8]">
              <span className="text-[#C66B4E] font-bold block">🔥 Peak Hours</span>
              <span className="font-semibold text-[#29252B]">10:00 - 14:30 JST</span>
              <p className="text-[9px] text-[#7A6C76] mt-0.5">Heavy tour bus volume</p>
            </div>
            <div className="bg-[#FCF8F5] p-2 rounded-lg border border-[#F0E3D8]">
              <span className="text-[#789477] font-bold block">🍃 Quieter Hours</span>
              <span className="font-semibold text-[#29252B]">Before 09:00 / After 16:00</span>
              <p className="text-[9px] text-[#7A6C76] mt-0.5">Tranquil photography & strolls</p>
            </div>
          </div>

          {/* Hourly Trend Bars */}
          <div className="pt-1">
            <span className="text-[9px] text-[#7A6C76] font-medium block mb-1">Typical Daily Busyness Curve:</span>
            <div className="flex items-end justify-between gap-1 h-12 bg-[#FAF2EB] p-2 rounded-lg border border-[#EBDCD0]">
              {[
                { time: '08:00', pct: 30, level: 'Low' },
                { time: '10:00', pct: 70, level: 'High' },
                { time: '12:00', pct: 95, level: 'Peak' },
                { time: '14:00', pct: 80, level: 'High' },
                { time: '16:00', pct: 45, level: 'Mod' },
                { time: '18:00', pct: 20, level: 'Quiet' },
              ].map((b) => (
                <div key={b.time} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    style={{ height: `${b.pct * 0.28}px` }}
                    className={`w-full rounded-xs transition-all ${
                      b.pct >= 75 ? 'bg-[#C66B4E]' : b.pct >= 45 ? 'bg-[#E9A5B5]' : 'bg-[#789477]'
                    }`}
                  />
                  <span className="text-[7.5px] text-[#7A6C76] font-medium">{b.time}</span>
                </div>
              ))}
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

      {/* First-Party Opt-In Crowd Report Modal */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex flex-col justify-end z-40 p-3">
          <div className="bg-[#FFF9F5] rounded-xl p-3 border border-[#EBDCD0] shadow-lg space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-2">
              <span className="font-bold text-xs text-[#A83F70] flex items-center gap-1.5">
                <span>🌸</span>
                <span>Report Current Crowd at {destinationName}</span>
              </span>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-5 h-5 rounded-full bg-gray-200 text-xs flex items-center justify-center font-bold text-gray-700 hover:bg-gray-300"
              >
                ✕
              </button>
            </div>

            <p className="text-[10px] text-[#554A53]">
              Help fellow travelers by sharing how busy this location feels right now. All submissions are privacy-preserving.
            </p>

            {/* 4 Choices */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { level: 'Quiet' as const, label: '🍃 Quiet', desc: 'Few people, spacious' },
                { level: 'Normal' as const, label: '🌤️ Normal', desc: 'Average flow, relaxed' },
                { level: 'Busy' as const, label: '👥 Busy', desc: 'Noticeable queues' },
                { level: 'Very Busy' as const, label: '🔥 Very Busy', desc: 'High crowding / waits' },
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setReportLevel(item.level)}
                  className={`p-2 rounded-lg border text-left text-[10px] transition-colors ${
                    reportLevel === item.level
                      ? 'bg-[#FFF0F4] border-[#A83F70] font-bold text-[#A83F70]'
                      : 'bg-white border-[#EAD7C8] hover:border-[#C66B4E] text-[#29252B]'
                  }`}
                >
                  <p className="font-bold leading-tight">{item.label}</p>
                  <p className="text-[8.5px] text-[#7A6C76] leading-tight mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reportConsent}
                onChange={(e) => setReportConsent(e.target.checked)}
                className="mt-0.5 rounded text-[#A83F70] focus:ring-[#A83F70]"
              />
              <span className="text-[9px] text-[#7A6C76] leading-tight">
                I consent to anonymous, coarse regional crowd reporting under FujiNova's $0-spend privacy policy. No personal identifiers or precise GPS traces are stored.
              </span>
            </label>

            {reportSuccessMsg && (
              <div className="p-1.5 bg-[#EBF4EB] text-[#3D663C] text-[10px] font-bold rounded text-center border border-[#D5E5D5]">
                {reportSuccessMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-1.5 bg-[#F5ECE5] text-[#29252B] rounded-lg text-[10px] font-bold hover:bg-[#EBDCD0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reportConsent}
                onClick={handleSubmitReport}
                className="flex-1 py-1.5 bg-[#A83F70] text-white rounded-lg text-[10px] font-bold hover:bg-[#923360] disabled:opacity-50 transition-colors"
              >
                Submit Observation
              </button>
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
