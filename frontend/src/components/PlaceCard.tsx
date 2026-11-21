import React from 'react';
import { Place } from '../types';
import { ExternalLink, Eye, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface PlaceCardProps {
  place: Place;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const isAccessible = place.accessibility_status === 'VERIFIED_ACCESSIBLE';
  const isSteepStairs = place.accessibility_status === 'STEEP_STAIRS';

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-[#EAE0D0] overflow-hidden hover:shadow-md hover:border-[#E9A5B5] transition-all flex flex-col justify-between">
      {place.image_url && (
        <div className="relative h-36 w-full overflow-hidden bg-[#FAF6F0]">
          <img
            src={place.image_url}
            alt={place.name_en || place.name_ja}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80';
            }}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        {/* Header: Name and Fuji Rating */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-[#29252B] text-base leading-tight">
              {place.name_ja}
            </h3>
            {place.name_en && (
              <p className="text-xs text-[#5A525E] font-medium">{place.name_en}</p>
            )}
          </div>
          <div className="flex items-center gap-1 bg-[#FDF2F4] text-[#C64A6A] border border-[#E9A5B5] px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
            <Eye className="w-3.5 h-3.5 text-[#E9A5B5]" />
            <span>Fuji {place.fuji_view_rating}/5</span>
          </div>
        </div>

        {/* Category & Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-[#FAF6F0] text-[#5A525E] capitalize font-medium border border-[#EAE0D0]">
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
            <span className="px-2 py-0.5 rounded-md bg-[#F4EFF7] text-[#7F5B95] border border-[#B99BCB]/40 font-medium">
              Indoor Option
            </span>
          )}
        </div>

        {/* Opening Hours */}
        <div className="mt-3 flex items-start gap-1.5 text-xs text-[#5A525E]">
          <Clock className="w-3.5 h-3.5 text-[#789477] mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-[#29252B]">Hours: </span>
            <span>{place.opening_hours_text || 'See official site'}</span>
            {place.opening_status === 'ALWAYS_OPEN' && (
              <span className="ml-1 text-[#4F734E] font-bold">(24 Hours)</span>
            )}
          </div>
        </div>

        {/* Optional Activities / Caveat Note */}
        {place.optional_activities_fee_desc && (
          <p className="mt-2 text-xs bg-[#FAF6F0] p-2 rounded-xl border border-[#EAE0D0] text-[#5A525E] italic">
            Note: {place.optional_activities_fee_desc}
          </p>
        )}

        {/* Accessibility & Stairs */}
        <div className={`mt-3 p-2.5 rounded-xl text-xs flex items-start gap-1.5 ${
          isAccessible
            ? 'bg-[#EFF5EE] text-[#4F734E] border border-[#789477]/30'
            : isSteepStairs
            ? 'bg-[#FDF8F6] text-[#C66B4E] border border-[#C66B4E]/30'
            : 'bg-[#FAF6F0] text-[#5A525E] border border-[#EAE0D0]'
        }`}>
          {isAccessible ? (
            <CheckCircle className="w-4 h-4 text-[#789477] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#C66B4E] shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold">
              {isAccessible ? 'Barrier-Free Accessible' : isSteepStairs ? 'Steep Stairs Warning' : 'Partial Steps'}
            </span>
            {place.stair_step_count ? ` (${place.stair_step_count} stairs)` : ''}:
            <span className="block mt-0.5 text-[#5A525E]">
              {place.accessibility_evidence || 'Exercise standard care.'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Provenance */}
      <div className="px-4 py-2.5 bg-[#FAF6F0] border-t border-[#EAE0D0] flex items-center justify-between text-[11px] text-[#8A808F]">
        <span className="truncate max-w-[200px]" title={place.required_attribution}>
          {place.required_attribution}
        </span>
        <a
          href={place.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#C66B4E] hover:text-[#B2583D] font-bold shrink-0 ml-2"
        >
          <span>Official Site</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
