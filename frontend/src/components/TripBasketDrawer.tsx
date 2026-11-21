import React from 'react';
import { Place } from '../types';
import { 
  X, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Compass, 
  Eye, 
  Footprints, 
  MapPin,
  Layers
} from 'lucide-react';

interface TripBasketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  basket: Place[];
  onRemoveFromBasket: (placeId: string) => void;
  onClearBasket: () => void;
  onReorderBasket: (index: number, direction: 'up' | 'down') => void;
  onGenerateWithHana: (places: Place[]) => void;
  onViewIn3D: (places: Place[]) => void;
}

export const TripBasketDrawer: React.FC<TripBasketDrawerProps> = ({
  isOpen,
  onClose,
  basket,
  onRemoveFromBasket,
  onClearBasket,
  onReorderBasket,
  onGenerateWithHana,
  onViewIn3D
}) => {
  if (!isOpen) return null;

  // Aggregate metrics
  const avgFujiRating = basket.length > 0 
    ? (basket.reduce((acc, p) => acc + (p.fuji_view_rating || 0), 0) / basket.length).toFixed(1)
    : '0';

  const accessibleCount = basket.filter(p => p.accessibility_status === 'VERIFIED_ACCESSIBLE').length;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="basket-drawer-title"
    >
      <div 
        className="w-full max-w-md bg-white border-l border-[#EAE0D0] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-[#29252B]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EAE0D0] flex items-center justify-between bg-[#FAF6F0]">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-2xl bg-[#EFF5EE] text-[#4F734E] border border-[#789477]/30 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-[#789477]" />
            </span>
            <div>
              <h2 id="basket-drawer-title" className="text-base font-black text-[#29252B] flex items-center gap-2">
                Trip Selection Basket
                <span className="px-2 py-0.5 text-xs rounded-full bg-[#C66B4E] text-white font-bold">
                  {basket.length} {basket.length === 1 ? 'place' : 'places'}
                </span>
              </h2>
              <p className="text-xs text-[#5A525E]">Curate stops before generating your intelligent itinerary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8A808F] hover:text-[#29252B] hover:bg-white rounded-xl transition-colors cursor-pointer"
            aria-label="Close basket drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Summary Pills */}
        {basket.length > 0 && (
          <div className="px-5 py-3 bg-[#FAF6F0] border-b border-[#EAE0D0] flex items-center justify-between text-xs text-[#5A525E]">
            <div className="flex items-center gap-1.5 text-[#C64A6A] font-bold">
              <Eye className="w-3.5 h-3.5 text-[#E9A5B5]" />
              <span>Avg Fuji: {avgFujiRating}/5</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#4F734E] font-bold">
              <Footprints className="w-3.5 h-3.5 text-[#789477]" />
              <span>{accessibleCount}/{basket.length} Step-Free</span>
            </div>
            <button
              onClick={onClearBasket}
              className="text-[#8A808F] hover:text-rose-600 flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
              title="Remove all places from basket"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Basket List Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#F7EFE5]/40">
          {basket.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8A808F]">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#EAE0D0] flex items-center justify-center mb-4 text-[#789477] shadow-xs">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-[#29252B] text-sm">Your Basket is Empty</h3>
              <p className="text-xs text-[#5A525E] mt-1 max-w-[240px]">
                Browse places in Discover or Explore, click "+ Add to Trip", then Hana will connect them into a smooth itinerary.
              </p>
            </div>
          ) : (
            basket.map((place, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === basket.length - 1;

              return (
                <div 
                  key={place.place_id}
                  className="bg-white border border-[#EAE0D0] hover:border-[#E9A5B5] rounded-2xl p-3.5 flex items-start justify-between gap-3 shadow-2xs transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FAF6F0] text-[#C66B4E] border border-[#EAE0D0] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#29252B] leading-tight">
                        {place.name_en || place.name_ja}
                      </h4>
                      <p className="text-[11px] text-[#5A525E] font-serif">{place.name_ja}</p>
                      
                      <div className="flex items-center gap-2 mt-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded-lg bg-[#FAF6F0] text-[#5A525E] capitalize border border-[#EAE0D0] font-semibold">
                          {place.primary_category}
                        </span>
                        <span className="text-[#C64A6A] font-bold flex items-center gap-0.5">
                          ★ {place.fuji_view_rating}/5
                        </span>
                        {place.general_admission_type === 'FREE' ? (
                          <span className="text-[#4F734E] font-bold">Free</span>
                        ) : (
                          <span className="text-[#29252B] font-semibold">¥{place.general_admission_fee_jpy || 1000}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Move Up/Down & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onReorderBasket(idx, 'up')}
                      disabled={isFirst}
                      className="p-1 rounded-lg text-[#8A808F] hover:text-[#29252B] hover:bg-[#FAF6F0] disabled:opacity-20 transition-opacity cursor-pointer"
                      aria-label={`Move ${place.name_en} up`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onReorderBasket(idx, 'down')}
                      disabled={isLast}
                      className="p-1 rounded-lg text-[#8A808F] hover:text-[#29252B] hover:bg-[#FAF6F0] disabled:opacity-20 transition-opacity cursor-pointer"
                      aria-label={`Move ${place.name_en} down`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveFromBasket(place.place_id)}
                      className="p-1 rounded-lg text-[#8A808F] hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                      aria-label={`Remove ${place.name_en} from basket`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer CTAs */}
        {basket.length > 0 && (
          <div className="p-5 border-t border-[#EAE0D0] bg-[#FAF6F0] space-y-2.5">
            <button
              onClick={() => onGenerateWithHana(basket)}
              className="w-full py-3 px-4 rounded-2xl bg-[#C66B4E] hover:bg-[#B2583D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#FDF2F4]" />
              <span>Generate Smart Itinerary with Hana AI</span>
            </button>

            <button
              onClick={() => onViewIn3D(basket)}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#EFF5EE] hover:bg-[#E3EFE1] text-[#4F734E] font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-[#789477]/30 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#789477]" />
              <span>Preview Waypoints in 3D Digital Twin</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
