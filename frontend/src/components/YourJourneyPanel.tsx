import React, { useState } from 'react';
import { ItineraryPlan, ItineraryStop } from '../types';
import { useExperienceMode } from '../context/ExperienceModeContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Navigation, 
  Star, 
  DollarSign, 
  Footprints, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  Bus, 
  ShieldCheck, 
  ChevronDown,
  ChevronUp,
  Share2,
  Compass,
  Play,
  CheckCircle2,
  Trophy,
  Award,
  Smile
} from 'lucide-react';

interface YourJourneyPanelProps {
  itinerary: ItineraryPlan | null;
  onAskHana: (prompt: string) => void;
  onRemoveStop?: (dayNumber: number, stopIndex: number) => void;
  onReorderStop?: (dayNumber: number, stopIndex: number, direction: 'up' | 'down') => void;
  onOpenExport?: () => void;
  onViewIn3D?: () => void;
}

export const YourJourneyPanel: React.FC<YourJourneyPanelProps> = ({
  itinerary,
  onAskHana,
  onRemoveStop,
  onReorderStop,
  onOpenExport,
  onViewIn3D
}) => {
  const { isTeenMode, isFamilyMode } = useExperienceMode();
  const [travelModeActive, setTravelModeActive] = useState<boolean>(false);
  const [visitedStopIds, setVisitedStopIds] = useState<string[]>([]);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState<number>(0);

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white border border-[#EAE0D0] rounded-3xl overflow-y-auto p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
            isFamilyMode ? 'bg-[#E8F5E9] text-[#2E7D32]' : isTeenMode ? 'bg-[#FFEBF1] text-[#FF5C8A]' : 'bg-[#EFF5EE] text-[#4F734E]'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#29252B]">
              {isFamilyMode ? 'Family Adventure Journal' : isTeenMode ? 'Trendsetter Trip Board' : 'Your Journey'}
            </h2>
            <p className="text-xs text-[#625966]">
              {isFamilyMode ? 'Kid-friendly stops & stroller easy routing' : isTeenMode ? 'Aesthetic photo spots & viral views' : 'Adaptive Itinerary & RAPTOR Transit Schedule'}
            </p>
          </div>
        </div>

        <div className="my-auto py-8 text-center max-w-sm mx-auto">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs ${
            isFamilyMode ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]' : isTeenMode ? 'bg-[#FFEBF1] text-[#FF5C8A] border border-[#FFD0DD]' : 'bg-[#EFF5EE] text-[#789477] border border-[#789477]/30'
          }`}>
            {isFamilyMode ? <Smile className="w-8 h-8" /> : isTeenMode ? <Sparkles className="w-8 h-8" /> : <Navigation className="w-8 h-8" />}
          </div>
          <h3 className="text-sm font-bold text-[#29252B] mb-1">
            {isFamilyMode ? 'No Family Adventures Started' : isTeenMode ? 'No Aesthetic Itinerary Yet' : 'No Active Itinerary Yet'}
          </h3>
          <p className="text-xs text-[#403944] leading-relaxed mb-6">
            {isFamilyMode 
              ? 'Ask Guide Hana to generate a playful family trip with duck boats, gentle trails, and ice cream treats!'
              : isTeenMode
              ? 'Ask Guide Hana to curate a viral photo tour with golden hour angles and retro cafes!'
              : 'Ask Guide Hana to generate a personalized itinerary tailored to your group, mobility needs, and pace.'}
          </p>

          <div className="space-y-2 text-left">
            <span className="text-[11px] font-bold text-[#625966] uppercase tracking-wider block mb-1">
              {isFamilyMode ? '🎈 Family Adventure Starters' : isTeenMode ? '✨ Pop Itinerary Starters' : 'Quick Itinerary Starters'}
            </span>
            <button
              onClick={() => onAskHana(isFamilyMode ? 'Plan a 1-day family tour with lake duck boats and lavender ice cream.' : isTeenMode ? 'Plan a 1-day viral photo tour of Mount Fuji and Chureito Pagoda.' : 'Can you recommend a 1-day itinerary around Lake Kawaguchiko with classic Mount Fuji views?')}
              className="w-full text-left p-3 rounded-2xl border border-[#E5DDD2] bg-[#FAF6F0] hover:bg-[#FAF3EC] text-xs text-[#29252B] font-semibold transition-all group flex items-center justify-between shadow-2xs"
            >
              <span>{isFamilyMode ? '1-Day Lake Duck Boats & Ice Cream Adventure' : isTeenMode ? '1-Day Viral Sunset & Golden Hour Spots' : '1-Day Classic Fuji & Kawaguchiko Highlights'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#625966] group-hover:text-[#C66B4E] group-hover:translate-x-0.5 transition-all" />
            </button>
            <button
              onClick={() => onAskHana(isFamilyMode ? 'Plan a 2-day relaxed family trip with flat stroller paths.' : isTeenMode ? 'Plan a 2-day photography trip with aesthetic cafes and Torii gates.' : 'Help me plan a 2-day photography trip around the Fuji Five Lakes with quiet viewpoints.')}
              className="w-full text-left p-3 rounded-2xl border border-[#E5DDD2] bg-[#FAF6F0] hover:bg-[#FAF3EC] text-xs text-[#29252B] font-semibold transition-all group flex items-center justify-between shadow-2xs"
            >
              <span>{isFamilyMode ? '2-Day Stroller-Easy Family Tour' : isTeenMode ? '2-Day Aesthetic Fuji Cafes & Torii Gates' : '2-Day Photography & Tranquil Lakes Tour'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#625966] group-hover:text-[#C66B4E] group-hover:translate-x-0.5 transition-all" />
            </button>
            <button
              onClick={() => onAskHana('Please plan a family-friendly 3-day itinerary with easy walking and step-free access.')}
              className="w-full text-left p-3 rounded-2xl border border-[#E5DDD2] bg-[#FAF6F0] hover:bg-[#FAF3EC] text-xs text-[#29252B] font-semibold transition-all group flex items-center justify-between shadow-2xs"
            >
              <span>3-Day Family & Barrier-Free Experience</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#625966] group-hover:text-[#C66B4E] group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate high-level summary
  const allStops = itinerary.days.flatMap(d => d.stops);
  const totalStops = allStops.length;
  const isTripComplete = totalStops > 0 && visitedStopIds.length === totalStops;
  const currentStop = allStops[currentWaypointIndex];

  const toggleStopVisited = (stopId: string) => {
    if (visitedStopIds.includes(stopId)) {
      setVisitedStopIds(visitedStopIds.filter(id => id !== stopId));
    } else {
      setVisitedStopIds([...visitedStopIds, stopId]);
      if (currentWaypointIndex < allStops.length - 1) {
        setCurrentWaypointIndex(currentWaypointIndex + 1);
      }
    }
  };

  return (
    <div className={`h-full flex flex-col bg-white border overflow-hidden shadow-sm ${
      isFamilyMode ? 'border-2 border-[#C8E6C9] rounded-3xl' : isTeenMode ? 'border-2 border-[#FFD0DD] rounded-2xl' : 'border border-[#E5DDD2] rounded-3xl'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${isFamilyMode ? 'bg-[#F1F8E9] border-[#C8E6C9]' : isTeenMode ? 'bg-[#FFF0F4] border-[#FFD0DD]' : 'bg-[#FAF6F0] border-[#E5DDD2]'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-black text-xs shadow-xs ${
              isFamilyMode ? 'bg-[#4CAF50]' : isTeenMode ? 'bg-[#FF5C8A]' : 'bg-[#C66B4E]'
            }`}>
              {itinerary.total_days}D
            </span>
            <div>
              <h2 className="text-sm font-black text-[#29252B] leading-tight">{itinerary.title}</h2>
              <p className="text-[11px] text-[#625966] font-medium">
                {totalStops} destinations • {itinerary.pace} pace • {itinerary.budget_tier} budget
              </p>
            </div>
          </div>

          {/* Export & 3D Action Buttons */}
          <div className="flex items-center gap-1.5">
            {onViewIn3D && (
              <button
                onClick={onViewIn3D}
                className="p-2 rounded-xl border border-[#789477]/40 bg-[#EFF5EE] hover:bg-[#E3EFE1] text-[#4F734E] font-bold text-xs transition-colors cursor-pointer shadow-xs"
                title="View Connected Route in 3D Digital Twin"
              >
                <Compass className="w-4 h-4" />
              </button>
            )}
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="px-3 py-2 rounded-xl bg-[#C66B4E] hover:bg-[#B2583D] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Share & Export PDF / QR Code"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Travel Mode Toggle Bar */}
        <div className="pt-2 flex items-center justify-between border-t border-[#E5DDD2] mt-2">
          <button
            onClick={() => setTravelModeActive(!travelModeActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              travelModeActive
                ? 'bg-[#789477] text-white shadow-xs'
                : 'bg-white border border-[#E5DDD2] hover:bg-[#FAF6F0] text-[#29252B]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${travelModeActive ? 'fill-white' : ''}`} />
            <span>{travelModeActive ? 'Active Travel Mode On' : 'Start Travel Mode'}</span>
          </button>

          <span className="text-[11px] font-bold text-[#625966]">
            Visited: {visitedStopIds.length}/{totalStops}
          </span>
        </div>

        {/* Quick Edit Adapt Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          <button
            onClick={() => onAskHana('Please make this itinerary cheaper with more free viewpoints and low-cost options.')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E5DDD2] text-[10px] font-bold text-[#403944] hover:bg-[#EFF5EE] shadow-2xs transition-colors cursor-pointer"
          >
            <DollarSign className="w-3 h-3 text-[#4F734E]" />
            <span>Cheaper</span>
          </button>
          <button
            onClick={() => onAskHana('Please reduce walking and avoid steep stairs for this itinerary.')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E5DDD2] text-[10px] font-bold text-[#403944] hover:bg-[#EFF5EE] shadow-2xs transition-colors cursor-pointer"
          >
            <Footprints className="w-3 h-3 text-[#789477]" />
            <span>Less Walking</span>
          </button>
          <button
            onClick={() => onAskHana('Can you recommend a quieter alternative for crowded stops in this plan?')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E5DDD2] text-[10px] font-bold text-[#403944] hover:bg-[#FAF3EC] shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-[#C66B4E]" />
            <span>Less Crowded</span>
          </button>
        </div>
      </div>

      {/* Active Travel Mode HUD */}
      {travelModeActive && !isTripComplete && currentStop && (
        <div className="p-4 bg-[#EFF5EE] border-b border-[#789477]/40 animate-in fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F734E] bg-white px-2 py-0.5 rounded-full border border-[#789477]/30">
              Current Stop • #{currentWaypointIndex + 1}
            </span>
            <span className="text-xs font-bold text-[#4F734E]">
              ETA: {currentStop.estimated_arrival}
            </span>
          </div>

          <h3 className="font-bold text-[#29252B] text-sm">
            {currentStop.name_en} ({currentStop.name_ja})
          </h3>
          <p className="text-xs text-[#5A525E] mt-0.5">
            {currentStop.admission_info} • {currentStop.duration_minutes} min duration
          </p>

          <button
            onClick={() => toggleStopVisited(currentStop.stop_id)}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-[#789477] hover:bg-[#5F7C5E] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark as Visited & Advance</span>
          </button>
        </div>
      )}

      {/* Trip Completion Celebratory Card */}
      {isTripComplete && (
        <div className="p-5 bg-gradient-to-br from-[#FAF6F0] to-[#FDF2F4] border-b border-[#EAE0D0] text-center animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-[#C66B4E] text-white flex items-center justify-center mx-auto mb-2 shadow-md">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="font-black text-[#29252B] text-base">Mount Fuji Journey Completed!</h3>
          <p className="text-xs text-[#5A525E] mt-1 max-w-xs mx-auto">
            Congratulations! You visited all {totalStops} destinations across Mount Fuji and Yamanashi.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full bg-[#EFF5EE] text-[#4F734E] border border-[#789477]/40 text-xs font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>Yamanashi Master Explorer</span>
            </span>
          </div>
        </div>
      )}

      {/* Days & Stops Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {itinerary.days.map((day) => (
          <div key={day.day_number} className="space-y-3">
            <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs py-1 z-10 border-b border-[#E5DDD2]">
              <span className="text-xs font-bold text-[#29252B] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#29252B] text-white text-[10px] flex items-center justify-center font-bold">
                  {day.day_number}
                </span>
                <span>Day {day.day_number}: {day.title}</span>
              </span>
              <span className="text-[11px] text-[#625966] font-bold">
                {day.stops.length} stops
              </span>
            </div>

            <div className="space-y-3 pl-2 border-l-2 border-[#E5DDD2] ml-2.5">
              {day.stops.map((stop: ItineraryStop, idx: number) => {
                const isVisited = visitedStopIds.includes(stop.stop_id);

                return (
                  <div key={stop.stop_id} className={`relative group transition-opacity ${isVisited ? 'opacity-70' : ''}`}>
                    {/* Timeline bullet */}
                    <button
                      onClick={() => toggleStopVisited(stop.stop_id)}
                      className={`absolute -left-[17px] top-4 w-3.5 h-3.5 rounded-full flex items-center justify-center ring-4 ring-white cursor-pointer transition-colors ${
                        isVisited ? 'bg-[#789477]' : 'bg-[#C66B4E] hover:bg-[#B2583D]'
                      }`}
                      title={isVisited ? 'Mark as unvisited' : 'Mark as visited'}
                    >
                      {isVisited && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </button>

                    {/* Stop Card */}
                    <div className={`bg-white rounded-2xl border p-3 shadow-2xs hover:shadow-xs transition-all ${
                      isVisited ? 'border-[#789477]/40 bg-[#EFF5EE]/30' : 'border-[#E5DDD2] hover:border-[#E9A5B5]'
                    }`}>
                      <div className="flex gap-3">
                        {stop.image_url ? (
                          <img
                            src={stop.image_url}
                            alt={stop.name_en}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#FAF6F0]"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-[#EFF5EE] text-[#4F734E] flex items-center justify-center shrink-0">
                            <MapPin className="w-6 h-6" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className={`text-xs font-bold truncate ${isVisited ? 'line-through text-[#625966]' : 'text-[#29252B]'}`}>
                                {stop.name_en}
                              </h4>
                              <span className="text-[10px] text-[#625966] block truncate font-serif">
                                {stop.name_ja}
                              </span>
                            </div>

                            {/* Reorder & Remove Actions */}
                            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              {onReorderStop && idx > 0 && (
                                <button
                                  onClick={() => onReorderStop(day.day_number, idx, 'up')}
                                  className="p-1 text-[#625966] hover:text-[#29252B] rounded hover:bg-[#FAF6F0]"
                                  title="Move stop up"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                              )}
                              {onReorderStop && idx < day.stops.length - 1 && (
                                <button
                                  onClick={() => onReorderStop(day.day_number, idx, 'down')}
                                  className="p-1 text-[#625966] hover:text-[#29252B] rounded hover:bg-[#FAF6F0]"
                                  title="Move stop down"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              )}
                              {onRemoveStop && (
                                <button
                                  onClick={() => onRemoveStop(day.day_number, idx)}
                                  className="p-1 text-[#625966] hover:text-rose-600 rounded hover:bg-rose-50"
                                  title="Remove stop"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Timing and Fuji Rating */}
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#403944]">
                            <span className="flex items-center gap-1 font-bold text-[#4F734E] bg-[#EFF5EE] px-1.5 py-0.5 rounded-lg border border-[#789477]/30">
                              <Clock className="w-3 h-3" />
                              <span>{stop.estimated_arrival}</span>
                            </span>
                            <span className="flex items-center gap-0.5 text-[#A83F70] font-bold bg-[#FAF3EC] px-1.5 py-0.5 rounded-lg border border-[#E9A5B5]">
                              <Star className="w-3 h-3 fill-[#A83F70]" />
                              <span>{stop.fuji_view_rating}/5</span>
                            </span>
                            <span className="text-[10px] text-[#625966] font-semibold truncate">
                              {stop.admission_info}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Step-Free Accessibility Notice */}
                      {stop.accessibility_status === 'VERIFIED_ACCESSIBLE' && (
                        <div className="mt-2 pt-2 border-t border-[#E5DDD2] flex items-center gap-1 text-[10px] text-[#4F734E] font-bold">
                          <ShieldCheck className="w-3 h-3 text-[#789477] shrink-0" />
                          <span className="truncate">Verified Barrier-Free & Step-Free Accessible</span>
                        </div>
                      )}
                    </div>

                    {/* RAPTOR Transit Connection to Next Stop */}
                    {stop.transit_to_next && (
                      <div className="my-2 p-2 rounded-xl bg-[#FAF6F0] border border-[#E5DDD2] text-[11px] text-[#29252B] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: stop.transit_to_next.route_color || '#C66B4E' }}
                          />
                          <span className="font-bold text-[#29252B] flex items-center gap-1">
                            <Bus className="w-3 h-3 text-[#789477]" />
                            <span>{stop.transit_to_next.route_name}</span>
                          </span>
                          <span className="text-[#625966]">•</span>
                          <span className="text-[#403944] font-semibold">{stop.transit_to_next.duration_minutes} min</span>
                        </div>
                        <div className="font-bold text-[#C66B4E] text-[10px]">
                          ¥{stop.transit_to_next.fare_jpy || 0}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
