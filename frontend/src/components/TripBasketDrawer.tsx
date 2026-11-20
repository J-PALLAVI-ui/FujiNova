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
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="basket-drawer-title"
    >
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 id="basket-drawer-title" className="text-base font-bold text-white flex items-center gap-2">
                Trip Selection Basket
                <span className="px-2 py-0.5 text-xs rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {basket.length} {basket.length === 1 ? 'place' : 'places'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Curate stops before generating your intelligent itinerary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close basket drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Summary Pills */}
        {basket.length > 0 && (
          <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-sky-400">
              <Eye className="w-3.5 h-3.5" />
              <span>Avg Fuji: {avgFujiRating}/5</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Footprints className="w-3.5 h-3.5" />
              <span>{accessibleCount}/{basket.length} Step-Free</span>
            </div>
            <button
              onClick={onClearBasket}
              className="text-slate-400 hover:text-rose-400 flex items-center gap-1 text-[11px] transition-colors"
              title="Remove all places from basket"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Basket List Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {basket.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-4 text-slate-500">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">Your Basket is Empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
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
                  className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-start justify-between gap-3 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {place.name_en || place.name_ja}
                      </h4>
                      <p className="text-[11px] text-slate-400">{place.name_ja}</p>
                      
                      <div className="flex items-center gap-2 mt-2 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                          {place.primary_category}
                        </span>
                        <span className="text-amber-400 flex items-center gap-0.5">
                          ★ {place.fuji_view_rating}/5
                        </span>
                        {place.general_admission_type === 'FREE' ? (
                          <span className="text-emerald-400">Free</span>
                        ) : (
                          <span className="text-slate-300">¥{place.general_admission_fee_jpy || 1000}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Move Up/Down & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onReorderBasket(idx, 'up')}
                      disabled={isFirst}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition-opacity"
                      aria-label={`Move ${place.name_en} up`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onReorderBasket(idx, 'down')}
                      disabled={isLast}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition-opacity"
                      aria-label={`Move ${place.name_en} down`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveFromBasket(place.place_id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
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
          <div className="p-5 border-t border-slate-800 bg-slate-900/90 space-y-2.5">
            <button
              onClick={() => onGenerateWithHana(basket)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:opacity-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Smart Itinerary with Hana AI</span>
            </button>

            <button
              onClick={() => onViewIn3D(basket)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Preview Waypoints in 3D Digital Twin</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
