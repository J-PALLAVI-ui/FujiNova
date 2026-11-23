import React from 'react';
import { 
  Bus, 
  Train, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Edit2, 
  Users 
} from 'lucide-react';

export interface TimelineItem {
  time: string;
  type: 'start' | 'transit' | 'destination' | 'freetime' | 'end';
  destination_index?: number;
  title: string;
  subtitle?: string;
  description?: string;
  details?: string;
  icon?: string;
  fare_jpy?: number;
  duration_min?: number;
  crowd_status?: string;
  crowd_level?: string;
  crowd_color?: string;
  image_url?: string;
  badge?: string;
}

export const DEFAULT_TIMELINE_ITEMS: TimelineItem[] = [
  {
    time: "08:30",
    type: "start",
    title: "Start at Kawaguchiko Station",
    description: "Plan briefing & depart"
  },
  {
    time: "08:40",
    type: "transit",
    title: "Bus to Chureito Pagoda",
    description: "Fujikyu Bus (Kawaguchiko → Shimo-Yoshida)",
    details: "≈ 15 min • ¥310"
  },
  {
    time: "08:55 - 10:30",
    type: "destination",
    destination_index: 1,
    title: "Chureito Pagoda",
    subtitle: "Iconic pagoda with Mt. Fuji view",
    crowd_status: "Moderate (Google)",
    crowd_color: "#D9822B",
    image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&auto=format&fit=crop&q=80"
  },
  {
    time: "10:40",
    type: "transit",
    title: "Bus to Lake Kawaguchi",
    description: "Fujikyu Retro Bus",
    details: "≈ 20 min • ¥400"
  },
  {
    time: "11:00 - 12:00",
    type: "destination",
    destination_index: 2,
    title: "Lake Kawaguchi",
    subtitle: "Lakeside walk & photo spots",
    crowd_status: "Moderate",
    crowd_color: "#789477",
    image_url: "https://images.unsplash.com/photo-1578637387939-43c525550085?w=400&auto=format&fit=crop&q=80"
  },
  {
    time: "12:10 - 13:15",
    type: "destination",
    destination_index: 3,
    title: "Lunch at Café Mignon (Hidden Gem)",
    subtitle: "A cozy local café with Mt. Fuji views",
    crowd_status: "Quiet",
    crowd_color: "#789477",
    image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80"
  },
  {
    time: "13:30 - 15:00",
    type: "destination",
    destination_index: 4,
    title: "Oishi Park",
    subtitle: "Flower park with panoramic Mt. Fuji",
    crowd_status: "Moderate",
    crowd_color: "#D9822B",
    image_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&auto=format&fit=crop&q=80"
  },
  {
    time: "15:10 - 17:00",
    type: "freetime",
    title: "Free time / Local shopping",
    description: "Kawaguchiko Lakeside area"
  },
  {
    time: "17:30",
    type: "end",
    title: "Return to Kawaguchiko Station",
    description: "Journey completed"
  }
];

interface DayPlanTimelineProps {
  timeline?: TimelineItem[];
  travelDate?: string;
  timeWindow?: string;
  transportBadge?: string;
  onEditPlan?: () => void;
  onFindQuieter?: () => void;
  onStartJourney?: () => void;
}

export const DayPlanTimeline: React.FC<DayPlanTimelineProps> = ({
  timeline = DEFAULT_TIMELINE_ITEMS,
  travelDate = "Mon, Nov 23, 2026",
  timeWindow = "08:30 – 17:30 (≈ 9 hours)",
  transportBadge = "Bus + Walk",
  onEditPlan,
  onFindQuieter,
  onStartJourney
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#EAD7C8] shadow-sm p-4 sm:p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F7EFE5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <h2 className="text-base font-bold text-[#29252B]">Your Day Plan</h2>
          </div>
          <p className="text-xs text-[#625966] font-medium">{travelDate}</p>
        </div>
        <button
          onClick={onEditPlan}
          className="flex items-center gap-1 text-xs font-semibold text-[#87365E] hover:text-[#A83F70] px-2.5 py-1 rounded-lg border border-[#EAD7C8] hover:bg-[#F7EFE5] transition-colors cursor-pointer"
        >
          <Edit2 className="w-3 h-3" />
          <span>Edit</span>
        </button>
      </div>

      {/* Overview badges */}
      <div className="flex items-center justify-between py-2.5 px-3 my-3 bg-[#F7EFE5]/60 rounded-xl text-xs font-medium text-[#29252B]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#C66B4E]" />
          <span>{timeWindow}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-[#EAD7C8] text-[#789477] font-semibold">
          <Bus className="w-3.5 h-3.5" />
          <span>{transportBadge}</span>
        </div>
      </div>

      {/* Chronological Timeline Items */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[620px]">
        {timeline.map((item, idx) => {
          const isDestination = item.type === 'destination';
          const isTransit = item.type === 'transit';
          const isStart = item.type === 'start';
          const isEnd = item.type === 'end';

          return (
            <div key={idx} className="relative flex gap-3 text-xs">
              {/* Timeline Connector Line */}
              {idx < timeline.length - 1 && (
                <div className="absolute left-[38px] top-7 bottom-0 w-0.5 bg-[#EAD7C8]" />
              )}

              {/* Time display */}
              <div className="w-14 shrink-0 font-semibold text-[#625966] text-[11px] pt-1">
                {item.time.split(' - ')[0]}
              </div>

              {/* Node Icon */}
              <div className="shrink-0 z-10">
                {isStart && (
                  <div className="w-7 h-7 rounded-full bg-[#789477] text-white flex items-center justify-center shadow-xs">
                    <Train className="w-3.5 h-3.5" />
                  </div>
                )}
                {isTransit && (
                  <div className="w-7 h-7 rounded-full bg-[#EAD7C8] text-[#C66B4E] flex items-center justify-center">
                    <Bus className="w-3.5 h-3.5" />
                  </div>
                )}
                {isDestination && (
                  <div className="w-7 h-7 rounded-full bg-[#C66B4E] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {item.destination_index || idx}
                  </div>
                )}
                {item.type === 'freetime' && (
                  <div className="w-7 h-7 rounded-full bg-[#B99BCB] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                {isEnd && (
                  <div className="w-7 h-7 rounded-full bg-[#29252B] text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="flex-1 pb-3">
                {isDestination ? (
                  <div className="bg-[#FAF5F0] border border-[#EAD7C8] rounded-xl p-2.5 flex gap-2.5 items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#29252B] truncate">{item.title}</span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-[#625966] truncate">{item.subtitle}</p>
                      )}
                      {item.crowd_status && (
                        <div className="mt-1 flex items-center gap-1 text-[10px]">
                          <Users className="w-3 h-3 text-[#D9822B]" />
                          <span className="text-[#625966]">Crowd:</span>
                          <span 
                            className="font-bold"
                            style={{ color: item.crowd_color || '#D9822B' }}
                          >
                            {item.crowd_status}
                          </span>
                        </div>
                      )}
                    </div>
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-14 h-14 object-cover rounded-lg shrink-0 border border-[#EAD7C8]"
                        loading="lazy"
                      />
                    )}
                  </div>
                ) : isTransit ? (
                  <div className="bg-[#F7EFE5]/40 rounded-lg p-2 border border-dashed border-[#EAD7C8]">
                    <div className="font-semibold text-[#29252B] flex items-center gap-1.5">
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[11px] text-[#625966]">{item.description}</p>
                    {item.details && (
                      <p className="text-[10px] text-[#C66B4E] font-medium mt-0.5">{item.details}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-[#29252B]">{item.title}</h3>
                    <p className="text-[11px] text-[#625966]">{item.description}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 mt-2 border-t border-[#F7EFE5] flex flex-col sm:flex-row gap-2">
        <button
          onClick={onFindQuieter}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#EAD7C8] hover:bg-[#F7EFE5] text-[#29252B] text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>🔍</span>
          <span>Find quieter alternatives</span>
        </button>

        <button
          onClick={onStartJourney}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#87365E] hover:bg-[#A83F70] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <span>▶</span>
          <span>Start journey (Live Guidance)</span>
        </button>
      </div>
    </div>
  );
};
