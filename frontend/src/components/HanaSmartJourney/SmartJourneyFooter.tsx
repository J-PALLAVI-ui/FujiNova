import React from 'react';

export const SmartJourneyFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#FFF9F5] border-t border-[#EAD7C8] py-4 px-4 text-[#29252B] select-none mt-6">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Key Features at a Glance */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white/70 backdrop-blur-xs p-3 rounded-xl border border-[#F2DECF]">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌸</span>
            <span className="text-xs font-bold text-[#C66B4E] uppercase tracking-wide">Key Features at a Glance</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#554A53]">
            <span className="flex items-center gap-1.5"><span className="text-xs">👥</span> Real Crowd <span className="text-[10px] opacity-70">(Where Available)</span></span>
            <span className="flex items-center gap-1.5"><span className="text-xs">🚆</span> Train & Bus Schedules</span>
            <span className="flex items-center gap-1.5"><span className="text-xs">🚉</span> Platform / Boarding Guide</span>
            <span className="flex items-center gap-1.5"><span className="text-xs">⏱️</span> Route, Fare & Travel Time</span>
            <span className="flex items-center gap-1.5"><span className="text-xs">🗺️</span> Interactive Journey Map</span>
            <span className="flex items-center gap-1.5"><span className="text-xs">🍃</span> Quieter Places / Hidden Gems</span>
            <span className="flex items-center gap-1.5"><span className="text-xs">🏨</span> Hotels, Food & Nearby Services</span>
            <span className="flex items-center gap-1.5"><span className="text-xs">🌐</span> All 196 Country Languages</span>
          </div>
        </div>

        {/* Provenance and Disclaimer Note */}
        <div className="text-center text-[10px] text-[#8C7E89] border-t border-[#F2DECF]/50 pt-2">
          <p>
            <strong>Note:</strong> The above screens are high-fidelity operational views for FujiNova 11.0. Timetables reflect official 2026 Fujikyu Railway and GTFS schedules. Crowd metrics represent multi-evidence estimates and historical trends with transparent provenance.
          </p>
        </div>
      </div>
    </footer>
  );
};
