import React, { useState } from 'react';
import { 
  Bus, 
  Clock, 
  Footprints, 
  CheckCircle2, 
  AlertTriangle, 
  TreePine,
  Coffee
} from 'lucide-react';

interface JourneyCompanionPanelProps {
  onAction?: (action: string) => void;
  onActionComplete?: (action: string, result: any) => void;
}

export const JourneyCompanionPanel: React.FC<JourneyCompanionPanelProps> = ({
  onAction,
  onActionComplete
}) => {
  const [activeAlert, setActiveAlert] = useState<{
    type: 'info' | 'success' | 'warning';
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisited, setIsVisited] = useState(false);

  const handleAction = async (action: string) => {
    onAction?.(action);
    setIsProcessing(true);
    try {
      const resp = await fetch('/api/v1/journey/companion/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (resp.ok) {
        const data = await resp.json();
        onActionComplete?.(action, data);

        if (action === 'missed_bus') {
          setActiveAlert({
            type: 'warning',
            title: 'Route Replanned (+15 min)',
            message: data.message,
            details: `Next departure: ${data.next_departure?.departure_time} (${data.next_departure?.service_line}) from ${data.next_departure?.platform}.`
          });
        } else if (action === 'mark_visited') {
          setIsVisited(true);
          setActiveAlert({
            type: 'success',
            title: 'Discovery Recorded! 🌸',
            message: data.message,
            details: data.next_guidance
          });
        } else if (action === 'reached_station') {
          setActiveAlert({
            type: 'info',
            title: 'Station Check-in Confirmed',
            message: data.message,
            details: data.next_guidance
          });
        } else if (action === 'boarded_bus') {
          setActiveAlert({
            type: 'success',
            title: 'Onboard Confirmed',
            message: data.message,
            details: data.next_guidance
          });
        } else if (action === 'find_quieter') {
          setActiveAlert({
            type: 'info',
            title: 'Quieter Alternative Found',
            message: `${data.recommended_alternative?.name}: ${data.recommended_alternative?.reason}`,
            details: `Distance: ${data.recommended_alternative?.distance_from_station}`
          });
        } else if (action === 'nearest_toilet' || action === 'food_nearby') {
          setActiveAlert({
            type: 'info',
            title: action === 'nearest_toilet' ? 'Restrooms Nearby' : 'Dining Nearby',
            message: data.message,
            details: data.locations ? data.locations.map((l: any) => `${l.name} (${l.distance})`).join(', ') : ''
          });
        }
      }
    } catch (err) {
      console.error('Companion action error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EAD7C8] shadow-sm p-4 sm:p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#F7EFE5]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧭</span>
          <h3 className="font-bold text-[#29252B] text-sm sm:text-base">Journey Companion</h3>
        </div>
        <span className="text-[11px] font-bold bg-[#789477]/15 text-[#789477] px-2 py-0.5 rounded-full border border-[#789477]/30">
          Live Tracking Active
        </span>
      </div>

      {/* Dynamic Status / Alert Banner */}
      {activeAlert && (
        <div className={`p-3 rounded-xl border text-xs ${
          activeAlert.type === 'warning' 
            ? 'bg-amber-50 border-amber-200 text-amber-900' 
            : activeAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="font-bold flex items-center gap-1.5">
            {activeAlert.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
            {activeAlert.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{activeAlert.title}</span>
          </div>
          <p className="mt-1 leading-snug">{activeAlert.message}</p>
          {activeAlert.details && (
            <p className="mt-1 font-semibold text-[11px]">{activeAlert.details}</p>
          )}
        </div>
      )}

      {/* Next Stop Card */}
      <div className="bg-[#FAF5F0] border border-[#EAD7C8] rounded-xl p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#C66B4E] font-bold">
            <Bus className="w-3.5 h-3.5" />
            <span>Next Stop: Chureito Pagoda</span>
          </div>
          <span className="text-[10px] bg-white border border-[#EAD7C8] text-[#625966] font-semibold px-2 py-0.5 rounded">
            Stop 2 of 4
          </span>
        </div>
        <p className="text-xs text-[#625966] mt-1">A famous pagoda with a breathtaking view of Mount Fuji.</p>

        {/* Departure Details Box */}
        <div className="bg-white rounded-lg p-2.5 mt-2.5 border border-[#EAD7C8] text-xs space-y-1.5">
          <div className="flex items-center justify-between font-bold text-[#29252B]">
            <span className="text-[#87365E]">Fujikyu Bus F1 (To: Shimo-Yoshida)</span>
            <span>Fare: ¥470</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#625966]">
            <div>
              <span className="font-bold text-[#29252B]">13:40</span> Kawaguchiko Sta. (Bus Stop #1)
            </div>
            <div>➔</div>
            <div>
              <span className="font-bold text-[#29252B]">14:02</span> Shimo-Yoshida (Chureito)
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#625966] pt-1.5 border-t border-[#EAD7C8]/60">
            <span className="flex items-center gap-1">
              <Footprints className="w-3 h-3 text-[#789477]" />
              Walk 10 min (550 m, uphill)
            </span>
            <span className="text-[#C66B4E] font-bold">
              Crowd: Moderate (Google)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Tourist Action Buttons (from Mockup) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={() => handleAction('reached_station')}
          disabled={isProcessing}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#789477] hover:bg-[#688367] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>I reached the station</span>
        </button>

        <button
          onClick={() => handleAction('boarded_bus')}
          disabled={isProcessing}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#789477] hover:bg-[#688367] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          <Bus className="w-3.5 h-3.5" />
          <span>I boarded the bus</span>
        </button>

        <button
          onClick={() => handleAction('missed_bus')}
          disabled={isProcessing}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-[#C66B4E] text-[#C66B4E] hover:bg-[#C66B4E]/10 font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Missed my bus</span>
        </button>

        <button
          onClick={() => handleAction('find_quieter')}
          disabled={isProcessing}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-[#789477] text-[#789477] hover:bg-[#789477]/10 font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          <TreePine className="w-3.5 h-3.5" />
          <span>Find a quieter place</span>
        </button>
      </div>

      {/* Mark As Visited Master Button */}
      <button
        onClick={() => handleAction('mark_visited')}
        disabled={isProcessing || isVisited}
        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
          isVisited 
            ? 'bg-[#789477] text-white' 
            : 'bg-[#87365E] hover:bg-[#A83F70] text-white'
        }`}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>{isVisited ? 'Visited & Logged in Journal ✓' : 'Mark as visited'}</span>
      </button>

      {/* Micro-Help Utilities */}
      <div className="flex items-center justify-around pt-2 border-t border-[#F7EFE5] text-[11px] text-[#625966]">
        <button 
          onClick={() => handleAction('nearest_toilet')}
          className="hover:text-[#29252B] flex items-center gap-1 cursor-pointer"
        >
          <span>🚻 Nearest Toilet</span>
        </button>
        <span>·</span>
        <button 
          onClick={() => handleAction('food_nearby')}
          className="hover:text-[#29252B] flex items-center gap-1 cursor-pointer"
        >
          <Coffee className="w-3 h-3 text-[#C66B4E]" />
          <span>Food Nearby</span>
        </button>
      </div>
    </div>
  );
};
