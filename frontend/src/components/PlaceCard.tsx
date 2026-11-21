import React from 'react';
import { Place } from '../types';
import { ExternalLink, Eye, AlertTriangle, CheckCircle, Clock, Camera, Smile, Baby } from 'lucide-react';
import { useExperienceMode } from '../context/ExperienceModeContext';

interface PlaceCardProps {
  place: Place;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const { isTeenMode, isFamilyMode, isAdultMode } = useExperienceMode();
  const isAccessible = place.accessibility_status === 'VERIFIED_ACCESSIBLE';
  const isSteepStairs = place.accessibility_status === 'STEEP_STAIRS';

  // Mode-Specific Card Wrapper Styling
  const cardBorderClass = isFamilyMode
    ? 'border-2 border-[#C8E6C9] rounded-3xl hover:border-[#4CAF50] shadow-sm hover:shadow-md'
    : isTeenMode
    ? 'border-2 border-[#FFD0DD] rounded-2xl hover:border-[#FF5C8A] shadow-sm hover:shadow-lg'
    : 'border border-[#E5DDD2] rounded-xl hover:border-[#C66B4E] shadow-xs hover:shadow-md';

  return (
    <div className={`bg-white overflow-hidden transition-all flex flex-col justify-between ${cardBorderClass}`}>
      {place.image_url && (
        <div className={`relative w-full overflow-hidden bg-[#FAF6F0] ${isFamilyMode ? 'h-40' : isTeenMode ? 'h-44' : 'h-36'}`}>
          <img
            src={place.image_url}
            alt={place.name_en || place.name_ja}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80';
            }}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />

          {/* Mode-Specific Badge Overlay on Image */}
          {isTeenMode && (
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <Camera className="w-3 h-3 text-[#FF5C8A]" />
              <span>Photo Spot {place.fuji_view_rating}/5</span>
            </div>
          )}

          {isFamilyMode && (
            <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-2xl bg-[#4CAF50] text-white text-xs font-extrabold flex items-center gap-1 shadow-sm">
              <Smile className="w-3.5 h-3.5" />
              <span>{isAccessible ? '👶 Stroller Easy' : '👣 Scenic Trail'}</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header: Name and Rating */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-[#29232B] text-base leading-tight">
              {place.name_ja}
            </h3>
            {place.name_en && (
              <p className="text-xs text-[#625966] font-semibold mt-0.5">{place.name_en}</p>
            )}
          </div>

          {!isTeenMode && (
            <div className="flex items-center gap-1 bg-[#FAF3EC] text-[#A83F70] border border-[#E9A5B5] px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
              <Eye className="w-3.5 h-3.5 text-[#A83F70]" />
              <span>Fuji {place.fuji_view_rating}/5</span>
            </div>
          )}
        </div>

        {/* Teen Mode: Viral Photo Angles & Aesthetics */}
        {isTeenMode && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFEBF1] text-[#9A2B64] font-bold border border-[#FFD0DD]">
                ✨ Top Sunset Angle
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF6F0] text-[#625966] font-medium border border-[#E5DDD2]">
                {place.primary_category}
              </span>
            </div>
            <p className="text-xs text-[#403944] leading-relaxed">
              {place.fuji_view_rating === 5 
                ? 'Iconic postcard-perfect view of Mount Fuji. Best lighting during early morning or sunset golden hour.'
                : 'Great panoramic spot for authentic landscape photography and peaceful lakeside views.'}
            </p>
          </div>
        )}

        {/* Family Mode: Child & Stroller Highlights */}
        {isFamilyMode && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="px-3 py-1 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] font-bold border border-[#C8E6C9] flex items-center gap-1">
                <Baby className="w-3.5 h-3.5" />
                <span>{isAccessible ? 'Stroller Friendly (Paved)' : `Gentle Steps (${place.stair_step_count || 5})`}</span>
              </span>
              <span className="px-2.5 py-1 rounded-2xl bg-[#FFF9C4] text-[#F57F17] font-bold border border-[#FFF59D]">
                🚻 Restrooms On-site
              </span>
            </div>
            <p className="text-xs text-[#403944] leading-relaxed font-medium">
              Family-friendly visit with spacious open areas, easy walking terrain, and snack kiosks.
            </p>
          </div>
        )}

        {/* Adult Standard Explorer: Editorial Badges & Opening Hours */}
        {isAdultMode && (
          <div className="space-y-2.5">
            {/* Category & Status Badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-[#FAF6F0] text-[#403944] capitalize font-medium border border-[#E5DDD2]">
                {place.primary_category}
              </span>
              <span className={`px-2 py-0.5 rounded-md font-bold ${
                place.general_admission_type === 'FREE'
                  ? 'bg-[#EFF5EE] text-[#4F734E] border border-[#789477]/40'
                  : 'bg-[#FAF6F0] text-[#C66B4E] border border-[#C66B4E]/30'
              }`}>
                {place.general_admission_type === 'FREE'
                  ? 'Free Admission'
                  : `¥${place.general_admission_fee_jpy?.toLocaleString() ?? 'Paid'}`}
              </span>
              {place.indoor_alternative && (
                <span className="px-2 py-0.5 rounded-md bg-[#FAF3EC] text-[#A83F70] border border-[#E9A5B5] font-medium">
                  Indoor Shelter
                </span>
              )}
            </div>

            {/* Opening Hours */}
            <div className="flex items-start gap-1.5 text-xs text-[#625966]">
              <Clock className="w-3.5 h-3.5 text-[#789477] mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-[#29232B]">Hours: </span>
                <span className="text-[#403944]">{place.opening_hours_text || 'See official site'}</span>
                {place.opening_status === 'ALWAYS_OPEN' && (
                  <span className="ml-1 text-[#4F734E] font-bold">(24 Hours)</span>
                )}
              </div>
            </div>

            {/* Accessibility & Stairs */}
            <div className={`p-2.5 rounded-xl text-xs flex items-start gap-1.5 ${
              isAccessible
                ? 'bg-[#EFF5EE] text-[#4F734E] border border-[#789477]/30'
                : isSteepStairs
                ? 'bg-[#FAF3EC] text-[#C66B4E] border border-[#C66B4E]/30'
                : 'bg-[#FAF6F0] text-[#403944] border border-[#E5DDD2]'
            }`}>
              {isAccessible ? (
                <CheckCircle className="w-4 h-4 text-[#789477] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#C66B4E] shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-[#29232B]">
                  {isAccessible ? 'Barrier-Free Accessible' : isSteepStairs ? 'Steep Stairs Warning' : 'Partial Steps'}
                </span>
                {place.stair_step_count ? ` (${place.stair_step_count} stairs)` : ''}:
                <span className="block mt-0.5 text-[#403944]">
                  {place.accessibility_evidence || 'Exercise standard care.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Provenance */}
      <div className="px-4 py-2.5 bg-[#FAF6F0] border-t border-[#E5DDD2] flex items-center justify-between text-[11px] text-[#625966]">
        <span className="truncate max-w-[200px]" title={place.required_attribution}>
          {place.required_attribution}
        </span>
        <a
          href={place.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#87365E] hover:text-[#A83F70] font-bold shrink-0 ml-2"
        >
          <span>Official Site</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
