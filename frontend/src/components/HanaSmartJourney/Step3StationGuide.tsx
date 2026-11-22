import React, { useState } from 'react';

interface DepartureRow {
  departure_id: string;
  time: string;
  destination: string;
  platform: string;
  status: string;
  adult_fare_jpy: number;
  child_fare_jpy: number;
  duration_min: number;
  stops_count: number;
  line_name: string;
  frequency: string;
  verified: boolean;
}

interface Step3Props {
  stationName?: string;
  stationCode?: string;
  stationNameJa?: string;
  stationImage?: string;
  onProceedToJourneyPlan: () => void;
  onBack?: () => void;
}

export const Step3StationGuide: React.FC<Step3Props> = ({
  stationName = 'Kawaguchiko Station',
  stationCode = 'FJ18',
  stationNameJa = '河口湖駅',
  stationImage = 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
  onProceedToJourneyPlan,
  onBack
}) => {
  const [transportMode, setTransportMode] = useState<'train' | 'bus'>('train');
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showFacilitiesModal, setShowFacilitiesModal] = useState(false);

  const trainDepartures: DepartureRow[] = [
    {
      departure_id: 'dep_1',
      time: '14:28',
      destination: 'Fujisan Station',
      platform: '1',
      status: 'On Time',
      adult_fare_jpy: 210,
      child_fare_jpy: 110,
      duration_min: 3,
      stops_count: 1,
      line_name: 'Fujikyu Line',
      frequency: '~30 min',
      verified: true
    },
    {
      departure_id: 'dep_2',
      time: '14:58',
      destination: 'Otsuki',
      platform: '2',
      status: 'On Time',
      adult_fare_jpy: 1170,
      child_fare_jpy: 590,
      duration_min: 48,
      stops_count: 17,
      line_name: 'Fujikyu Line',
      frequency: '~30 min',
      verified: true
    },
    {
      departure_id: 'dep_3',
      time: '15:28',
      destination: 'Fujisan Station',
      platform: '1',
      status: 'On Time',
      adult_fare_jpy: 210,
      child_fare_jpy: 110,
      duration_min: 3,
      stops_count: 1,
      line_name: 'Fujikyu Line',
      frequency: '~30 min',
      verified: true
    }
  ];

  const busDepartures: DepartureRow[] = [
    {
      departure_id: 'bus_1',
      time: '14:35',
      destination: 'Oishi Park (Red Line)',
      platform: 'Stop 1',
      status: 'On Time',
      adult_fare_jpy: 490,
      child_fare_jpy: 250,
      duration_min: 26,
      stops_count: 12,
      line_name: 'Red Line Sightseeing Omnibus',
      frequency: 'Every 15 min',
      verified: true
    },
    {
      departure_id: 'bus_2',
      time: '14:50',
      destination: 'Saiko Iyashi-no-Sato (Green Line)',
      platform: 'Stop 2',
      status: 'On Time',
      adult_fare_jpy: 720,
      child_fare_jpy: 360,
      duration_min: 35,
      stops_count: 18,
      line_name: 'Green Line Saiko Omnibus',
      frequency: 'Every 30 min',
      verified: true
    },
    {
      departure_id: 'bus_3',
      time: '15:30',
      destination: 'Mt. Fuji 5th Station (Yoshida)',
      platform: 'Stop 7',
      status: 'On Time',
      adult_fare_jpy: 1570,
      child_fare_jpy: 790,
      duration_min: 50,
      stops_count: 6,
      line_name: 'Subaru Line Shuttle',
      frequency: 'Hourly',
      verified: true
    }
  ];

  const activeList = transportMode === 'train' ? trainDepartures : busDepartures;
  const currentService = activeList[selectedServiceIndex] || activeList[0];

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
        <span className="font-bold text-xs tracking-tight text-[#29252B]">Hana Station Guide</span>
        <div className="flex items-center gap-2 text-xs text-[#7A6C76]">
          <span className="cursor-pointer hover:text-[#C66B4E]">🤍</span>
          <span className="cursor-pointer hover:text-[#C66B4E]">↗</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Station Photo Banner */}
        <div className="relative rounded-xl overflow-hidden shadow-xs border border-[#E7D6CA] h-28 bg-[#FFF4EE] flex flex-col justify-end p-2.5">
          <img
            src={stationImage}
            alt={stationName}
            className="absolute inset-0 w-full h-full object-cover brightness-[0.92]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm leading-tight drop-shadow-xs">{stationName}</h2>
              <span className="bg-[#C66B4E] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-xs">
                {stationCode}
              </span>
            </div>
            <p className="text-[10px] text-white/90 drop-shadow-xs flex items-center gap-1">
              <span>{stationNameJa}</span>
              <span>·</span>
              <span>Fujikyu Railway | Minamitsuru, Yamanashi</span>
            </p>
          </div>
        </div>

        {/* Segmented Control: Train vs Bus */}
        <div className="grid grid-cols-2 p-1 bg-[#F0E3D8] rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setTransportMode('train');
              setSelectedServiceIndex(0);
            }}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${transportMode === 'train' ? 'bg-white text-[#C66B4E] shadow-2xs' : 'text-[#7A6C76] hover:text-[#29252B]'}`}
          >
            <span>🚆</span>
            <span>Train</span>
          </button>
          <button
            onClick={() => {
              setTransportMode('bus');
              setSelectedServiceIndex(0);
            }}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${transportMode === 'bus' ? 'bg-white text-[#C66B4E] shadow-2xs' : 'text-[#7A6C76] hover:text-[#29252B]'}`}
          >
            <span>🚌</span>
            <span>Bus</span>
          </button>
        </div>

        {/* Next Departures Card */}
        <div className="bg-white rounded-xl p-3 border border-[#EBDCD0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#29252B]">
              <span>🚆</span>
              <span>Next Departures ({transportMode === 'train' ? 'Fujikyu Railway' : 'Sightseeing Bus'})</span>
            </div>
          </div>
          <p className="text-[9px] text-[#7A6C76] flex items-center gap-1">
            <span>Illustrative Timetable (Example Data)</span>
            <span className="opacity-70">ℹ️</span>
          </p>

          {/* Timetable List Table */}
          <div className="border border-[#F0E3D8] rounded-lg overflow-hidden text-[11px]">
            <div className="grid grid-cols-12 bg-[#FAF2EB] px-2 py-1.5 font-bold text-[#7A6C76] text-[10px] border-b border-[#F0E3D8]">
              <span className="col-span-3">Departure</span>
              <span className="col-span-4">Destination</span>
              <span className="col-span-2 text-center">Platform</span>
              <span className="col-span-3 text-right">Status</span>
            </div>

            {activeList.map((dep, idx) => (
              <div
                key={dep.departure_id}
                onClick={() => setSelectedServiceIndex(idx)}
                className={`grid grid-cols-12 px-2 py-2 items-center cursor-pointer border-b border-[#F5EDE6] last:border-none transition-colors ${selectedServiceIndex === idx ? 'bg-[#FFF0F4] font-semibold' : 'hover:bg-[#FAF5F0]'}`}
              >
                <span className="col-span-3 font-bold text-[#29252B]">{dep.time}</span>
                <span className="col-span-4 truncate text-[#403944]">{dep.destination}</span>
                <span className="col-span-2 text-center text-[#789477] font-bold">{dep.platform || '—'}</span>
                <span className="col-span-3 text-right">
                  <span className="bg-[#EBF4EB] text-[#3D663C] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {dep.status}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Operational Reality Notice */}
          <div className="mt-1 px-2 py-1 bg-[#FAF2EB] rounded-md text-[9px] text-[#7A6C76] flex flex-col sm:flex-row sm:items-center justify-between gap-1 border border-[#EBDCD0]">
            <span className="font-medium text-[#A83F70]">Live vehicle tracking: Unavailable (Operator feed required)</span>
            <span className="text-[8px] bg-white px-1.5 py-0.5 rounded text-[#29252B] font-medium border border-[#E8D9CD]">
              Static GTFS-JP Timetable
            </span>
          </div>
        </div>

        {/* Selected Service Details Card */}
        <div className="bg-white rounded-xl p-3 border border-[#EBDCD0] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#7A6C76] font-medium">Selected Service Details</p>
              <h3 className="font-bold text-xs text-[#29252B]">
                To: {currentService.destination}
              </h3>
            </div>
            <div className="w-10 h-7 rounded-md overflow-hidden border border-[#EAD7C8]">
              <img
                src="https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=160&auto=format&fit=crop&q=80"
                alt="Train"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-[#FCF8F5] p-2 rounded-lg text-[10px] border border-[#F0E3D8]">
            <div className="space-y-1">
              {currentService.platform && currentService.verified ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[#7A6C76]">Platform:</span>
                  <span className="font-bold text-[#29252B]">{currentService.platform}</span>
                  <span className="text-[8px] bg-[#EBF4EB] text-[#3D663C] font-bold px-1 rounded-xs">✓ Verified (Operator Info)</span>
                </div>
              ) : (
                <div className="text-[8.5px] text-[#A83F70] bg-[#FFF0F4] p-1 rounded-md border border-[#FAD6DF] leading-tight">
                  Platform/boarding information unavailable - please confirm on the operator departure board/signage
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[#7A6C76]">Fare:</span>
                <span className="font-bold text-[#C66B4E]">¥{currentService.adult_fare_jpy} (Adult)</span>
                <span className="text-[#7A6C76]">/ ¥{currentService.child_fare_jpy} (Child)</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[#7A6C76]">Duration:</span>
                <span className="font-semibold text-[#29252B]">{currentService.duration_min} min ({currentService.stops_count} stop)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#7A6C76]">Line:</span>
                <span className="font-semibold text-[#29252B]">{currentService.line_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#7A6C76]">Frequency:</span>
                <span className="font-semibold text-[#29252B]">{currentService.frequency}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={() => setShowPlatformModal(true)}
              className="py-1.5 px-2 bg-white border border-[#EAD7C8] hover:border-[#C66B4E] rounded-lg text-[10px] font-bold text-[#29252B] flex items-center justify-center gap-1 shadow-2xs transition-colors"
            >
              <span>🚶</span>
              <span>How to Reach Platform {currentService.platform}</span>
            </button>
            <button
              onClick={() => setShowFacilitiesModal(true)}
              className="py-1.5 px-2 bg-white border border-[#EAD7C8] hover:border-[#C66B4E] rounded-lg text-[10px] font-bold text-[#29252B] flex items-center justify-center gap-1 shadow-2xs transition-colors"
            >
              <span>🗺️</span>
              <span>Station Map & Facilities</span>
            </button>
          </div>

          {/* Primary CTA: View Detailed Route */}
          <button
            onClick={onProceedToJourneyPlan}
            className="w-full py-2 bg-[#C66B4E] hover:bg-[#B3583C] text-white rounded-lg text-xs font-bold text-center shadow-xs transition-colors"
          >
            Follow Detailed Journey Route →
          </button>
        </div>
      </div>

      {/* Platform Guidance Modal */}
      {showPlatformModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex flex-col justify-end z-30 p-3">
          <div className="bg-[#FFF9F5] rounded-xl p-3 border border-[#EBDCD0] shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-2">
              <span className="font-bold text-xs text-[#C66B4E]">🚶 Reaching Platform {currentService.platform}</span>
              <button
                onClick={() => setShowPlatformModal(false)}
                className="w-5 h-5 rounded-full bg-gray-200 text-xs flex items-center justify-center font-bold text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-[11px] text-[#403944] space-y-1.5">
              <p className="font-semibold text-[#29252B]">
                Kawaguchiko Station (FJ18) Platform {currentService.platform}
              </p>
              <ul className="list-disc list-inside space-y-1 text-[10px] text-[#554A53]">
                <li>Pass through the central IC Card ticket gates using Suica/Pasmo or QR ticket.</li>
                <li>Platform {currentService.platform} is level-access along the covered central corridor.</li>
                <li>Full step-free accessibility; no stairs or elevator required.</li>
                <li>Follow the green tactile paving for priority boarding.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Station Facilities Modal */}
      {showFacilitiesModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex flex-col justify-end z-30 p-3">
          <div className="bg-[#FFF9F5] rounded-xl p-3 border border-[#EBDCD0] shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-2">
              <span className="font-bold text-xs text-[#C66B4E]">🗺️ Station Facilities & Amenities</span>
              <button
                onClick={() => setShowFacilitiesModal(false)}
                className="w-5 h-5 rounded-full bg-gray-200 text-xs flex items-center justify-center font-bold text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-white p-2 rounded border border-[#EAD7C8]">
                <p className="font-bold text-[#29252B]">🛅 Coin Lockers</p>
                <p className="text-[#7A6C76]">150+ lockers (small to XL luggage) next to ticket gates.</p>
              </div>
              <div className="bg-white p-2 rounded border border-[#EAD7C8]">
                <p className="font-bold text-[#29252B]">♿ Accessibility</p>
                <p className="text-[#7A6C76]">Step-free level platforms & accessible restrooms.</p>
              </div>
              <div className="bg-white p-2 rounded border border-[#EAD7C8]">
                <p className="font-bold text-[#29252B]">🏧 24h ATM & Cash</p>
                <p className="text-[#7A6C76]">International cards accepted at 7-Bank ATM in concourse.</p>
              </div>
              <div className="bg-white p-2 rounded border border-[#EAD7C8]">
                <p className="font-bold text-[#29252B]">ℹ️ Tourist Counter</p>
                <p className="text-[#7A6C76]">English, Chinese, and Japanese staff available 9am–5pm.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Indicator Footer */}
      <div className="bg-[#FAF0E6] border-t border-[#E8D7CA] px-3 py-2 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C66B4E]">
          <span className="w-4 h-4 rounded-full bg-[#C66B4E] text-white text-[10px] flex items-center justify-center font-bold">3</span>
          <span>Get Station & Transport Info</span>
        </div>
        <p className="text-[10px] text-[#7A6C76]">Check next trains/buses, platform, fare and guidance</p>
      </div>
    </div>
  );
};
