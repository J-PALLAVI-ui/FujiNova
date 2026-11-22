import React from 'react';

interface SmartJourneyBannerProps {
  onLanguageClick?: () => void;
}

export const SmartJourneyBanner: React.FC<SmartJourneyBannerProps> = ({ onLanguageClick }) => {
  return (
    <header className="w-full bg-[#FFF9F5] border-b border-[#EAD7C8] px-4 py-3 shadow-sm select-none">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Hana Profile */}
        <div className="flex items-center gap-4">
          {/* Mt Fuji Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full bg-[#C66B4E] flex items-center justify-center text-white font-bold shadow-sm relative overflow-hidden border border-[#E89BAE]">
              <span className="text-xl">🌸</span>
              <span className="absolute bottom-0 text-[9px] tracking-tighter font-extrabold uppercase bg-[#29252B]/40 px-1 w-full text-center">Fuji</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl text-[#29252B] tracking-tight">FujiNova 11.0</span>
              </div>
              <p className="text-[11px] text-[#7A6E78] font-medium leading-none">Mt. Fuji Regional Travel Platform</p>
            </div>
          </div>

          <div className="h-8 w-px bg-[#EAD7C8] hidden sm:block" />

          {/* Hana Assistant Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#E9A5B5] shadow-xs bg-[#FFF1F4]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
                alt="Hana AI Assistant"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-[#C66B4E] font-serif">Hana Smart Journey</span>
                <span className="text-sm">🌸</span>
              </div>
              <p className="text-[11px] text-[#7A6E78]">Your Personal Crowd-Aware Travel Assistant for the Mount Fuji Region</p>
            </div>
          </div>
        </div>

        {/* Right: Pill Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF0F3] border border-[#F5D1DA] text-[#8C3A4E]">
            <span>👥</span>
            <span>Live Crowd <span className="opacity-70 text-[9px]">(Where Available)</span></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3F7F3] border border-[#D5E5D5] text-[#3D663C]">
            <span>🚆</span>
            <span>Train & Bus Navigation</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF4EE] border border-[#FADCCB] text-[#9E4C2C]">
            <span>🗺️</span>
            <span>Route & Map Planning</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F7F2FA] border border-[#E3D6ED] text-[#633C7C]">
            <span>🍃</span>
            <span>Quieter Alternatives</span>
          </div>

          <button
            onClick={onLanguageClick}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFEAF2] border border-[#DCD3E3] text-[#4F3F56] hover:bg-[#E5DDE9] transition-colors"
          >
            <span>🌐</span>
            <span>All Languages <span className="opacity-70 text-[9px]">(196 Countries)</span></span>
          </button>
        </div>
      </div>
    </header>
  );
};
