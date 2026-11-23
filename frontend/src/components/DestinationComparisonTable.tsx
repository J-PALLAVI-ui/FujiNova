import React, { useState } from 'react';
import { 
  Users, 
  Car, 
  CloudSun, 
  CheckCircle2, 
  Star,
  ChevronRight,
  List,
  Table as TableIcon
} from 'lucide-react';

export interface ComparisonItem {
  id: string;
  name: string;
  subtitle: string;
  rating: number;
  reviews_count: number;
  tags: string[];
  live_crowd: string;
  crowd_level?: string;
  road_traffic: string;
  traffic_level?: string;
  weather: string;
  data_source: string;
  last_updated: string;
  availability: string;
  is_live: boolean;
  photo_url: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_COMPARISON_ITEMS: ComparisonItem[] = [
  {
    id: "chureito",
    name: "Chureito Pagoda",
    subtitle: "Arakura Sengen Park, Fujiyoshida",
    rating: 4.6,
    reviews_count: 28417,
    tags: ["Viewpoint", "Photo Spot"],
    live_crowd: "Busier than usual",
    crowd_level: "High",
    road_traffic: "Moderate (Route 137)",
    traffic_level: "Moderate",
    weather: "14°C Partly cloudy",
    data_source: "Google Maps (Place details)",
    last_updated: "1:03 PM (JST) (2 min ago)",
    availability: "Verified (Live busyness available)",
    is_live: true,
    photo_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80",
    latitude: 35.5013,
    longitude: 138.8016
  },
  {
    id: "oishi",
    name: "Oishi Park",
    subtitle: "Lake Kawaguchi, Fujikawaguchiko",
    rating: 4.5,
    reviews_count: 11902,
    tags: ["Nature", "Lake View"],
    live_crowd: "Live crowd information unavailable for this destination.",
    crowd_level: "Unavailable",
    road_traffic: "Light (Route 21)",
    traffic_level: "Light",
    weather: "14°C Partly cloudy",
    data_source: "Google Maps (Traffic & Weather)",
    last_updated: "1:03 PM (JST) (2 min ago)",
    availability: "Partial (Traffic & weather only)",
    is_live: false,
    photo_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80",
    latitude: 35.5235,
    longitude: 138.7461
  },
  {
    id: "lake_kawaguchi",
    name: "Lake Kawaguchi",
    subtitle: "Scenic Lake Shoreline",
    rating: 4.5,
    reviews_count: 15420,
    tags: ["Lakeside", "Relaxing"],
    live_crowd: "Currently Calm",
    crowd_level: "Low",
    road_traffic: "Light",
    traffic_level: "Light",
    weather: "14°C Partly cloudy",
    data_source: "Sensors & Models",
    last_updated: "1:00 PM (JST)",
    availability: "Estimated",
    is_live: true,
    photo_url: "https://images.unsplash.com/photo-1578637387939-43c525550085?w=600&auto=format&fit=crop&q=80",
    latitude: 35.5171,
    longitude: 138.7518
  },
  {
    id: "cafe_mignon",
    name: "Hidden Café — Café Mizu (みずカフェ)",
    subtitle: "Local Café (Hidden Gem)",
    rating: 4.7,
    reviews_count: 320,
    tags: ["Café", "Hidden Gem"],
    live_crowd: "Usually Quiet",
    crowd_level: "Low",
    road_traffic: "Light",
    traffic_level: "Light",
    weather: "14°C Partly cloudy",
    data_source: "Community Reports",
    last_updated: "12:50 PM (JST)",
    availability: "Verified",
    is_live: true,
    photo_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
    latitude: 35.5085,
    longitude: 138.7621
  }
];

interface DestinationComparisonTableProps {
  items?: ComparisonItem[];
  onSelectRoute?: (item: ComparisonItem) => void;
  onFindQuieter?: () => void;
  onAddToItinerary?: (item: ComparisonItem) => void;
}

export const DestinationComparisonTable: React.FC<DestinationComparisonTableProps> = ({
  items = DEFAULT_COMPARISON_ITEMS,
  onSelectRoute,
  onFindQuieter,
  onAddToItinerary
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  return (
    <div className="bg-white rounded-2xl border border-[#EAD7C8] shadow-sm p-4 sm:p-5 flex flex-col h-full">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F7EFE5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <h2 className="text-base font-bold text-[#29252B]">Destination Comparison</h2>
          </div>
          <p className="text-xs text-[#625966]">Real-time crowd, traffic, weather and transport insights</p>
        </div>

        <div className="flex items-center gap-1 bg-[#F7EFE5] p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#87365E] text-white shadow-xs'
                : 'text-[#625966] hover:text-[#29252B]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[#87365E] text-white shadow-xs'
                : 'text-[#625966] hover:text-[#29252B]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Comparison Items Container */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 max-h-[640px]">
        {viewMode === 'list' ? (
          items.map((item) => (
            <div 
              key={item.id} 
              className="bg-[#FAF5F0] hover:bg-[#F7EFE5] border border-[#EAD7C8] rounded-xl p-3 sm:p-4 transition-all"
            >
              <div className="flex flex-col md:flex-row gap-3">
                {/* Photo & Thumbnail */}
                <div className="w-full md:w-36 h-28 shrink-0 rounded-lg overflow-hidden relative border border-[#EAD7C8]">
                  <img 
                    src={item.photo_url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                {/* Content info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-[#29252B] text-sm sm:text-base">{item.name}</h3>
                        {item.is_live && (
                          <span className="text-[10px] bg-[#789477]/15 text-[#789477] font-bold px-1.5 py-0.5 rounded-full border border-[#789477]/30">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#625966] mt-0.5">{item.subtitle} · {item.reviews_count.toLocaleString()} reviews</p>
                      
                      {/* Tags */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {item.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[10px] bg-white text-[#625966] px-2 py-0.5 rounded-md border border-[#EAD7C8]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectRoute?.(item)}
                      className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#87365E] hover:text-[#A83F70] bg-white hover:bg-[#F7EFE5] px-2.5 py-1 rounded-lg border border-[#EAD7C8] transition-colors cursor-pointer"
                    >
                      <span>Show Route</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 4 Data Grid Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#EAD7C8]/70 text-[11px]">
                    {/* Live Crowd */}
                    <div className="bg-white p-2 rounded-lg border border-[#EAD7C8]">
                      <div className="flex items-center gap-1 text-[#625966] text-[10px] font-medium">
                        <Users className="w-3 h-3 text-[#C66B4E]" />
                        <span>Live Crowd</span>
                      </div>
                      <p className={`font-bold mt-0.5 ${
                        item.live_crowd.includes('unavailable') 
                          ? 'text-[#625966] italic text-[10px]' 
                          : item.live_crowd.includes('Busier') 
                            ? 'text-[#C66B4E]' 
                            : 'text-[#789477]'
                      }`}>
                        {item.live_crowd}
                      </p>
                    </div>

                    {/* Road Traffic */}
                    <div className="bg-white p-2 rounded-lg border border-[#EAD7C8]">
                      <div className="flex items-center gap-1 text-[#625966] text-[10px] font-medium">
                        <Car className="w-3 h-3 text-[#789477]" />
                        <span>Road Traffic</span>
                      </div>
                      <p className="font-bold text-[#29252B] mt-0.5">
                        {item.road_traffic}
                      </p>
                    </div>

                    {/* Weather */}
                    <div className="bg-white p-2 rounded-lg border border-[#EAD7C8]">
                      <div className="flex items-center gap-1 text-[#625966] text-[10px] font-medium">
                        <CloudSun className="w-3 h-3 text-[#B99BCB]" />
                        <span>Weather</span>
                      </div>
                      <p className="font-bold text-[#29252B] mt-0.5">
                        {item.weather}
                      </p>
                    </div>

                    {/* Data Source & Availability */}
                    <div className="bg-white p-2 rounded-lg border border-[#EAD7C8]">
                      <div className="flex items-center gap-1 text-[#625966] text-[10px] font-medium">
                        <CheckCircle2 className="w-3 h-3 text-[#789477]" />
                        <span>Availability</span>
                      </div>
                      <p className="font-bold text-[#29252B] text-[10px] mt-0.5 truncate">
                        {item.availability}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Table View */
          <div className="overflow-x-auto border border-[#EAD7C8] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7EFE5] text-[#29252B] border-b border-[#EAD7C8] font-bold">
                  <th className="p-2.5">Destination</th>
                  <th className="p-2.5">Crowd Status</th>
                  <th className="p-2.5">Traffic</th>
                  <th className="p-2.5">Weather</th>
                  <th className="p-2.5">Source</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAD7C8]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF5F0] transition-colors">
                    <td className="p-2.5 font-bold text-[#29252B] flex items-center gap-2">
                      <img src={item.photo_url} alt="" className="w-7 h-7 rounded object-cover" />
                      <div>
                        <div>{item.name}</div>
                        <div className="text-[10px] font-normal text-[#625966]">{item.subtitle}</div>
                      </div>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.live_crowd.includes('unavailable')
                          ? 'bg-gray-100 text-[#625966]'
                          : item.live_crowd.includes('Busier')
                            ? 'bg-[#C66B4E]/15 text-[#C66B4E]'
                            : 'bg-[#789477]/15 text-[#789477]'
                      }`}>
                        {item.live_crowd}
                      </span>
                    </td>
                    <td className="p-2.5 text-[#29252B] font-medium">{item.road_traffic}</td>
                    <td className="p-2.5 text-[#29252B] font-medium">{item.weather}</td>
                    <td className="p-2.5 text-[#625966] text-[10px]">{item.data_source}</td>
                    <td className="p-2.5 text-right">
                      <button 
                        onClick={() => onSelectRoute?.(item)}
                        className="text-[#87365E] hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        Route
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Master Actions Bar */}
      <div className="pt-3 border-t border-[#F7EFE5] flex flex-wrap gap-2 justify-between items-center text-xs">
        <div className="flex gap-2">
          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAD7C8] hover:bg-[#F7EFE5] text-[#29252B] font-semibold cursor-pointer"
          >
            <span>⚖️</span>
            <span>Compare Destinations</span>
          </button>
          <button
            onClick={onFindQuieter}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#789477]/15 text-[#789477] border border-[#789477]/30 hover:bg-[#789477]/25 font-bold cursor-pointer"
          >
            <span>🍃</span>
            <span>Find Quieter Alternatives</span>
          </button>
        </div>

        <button
          onClick={() => onAddToItinerary?.(items[0])}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#87365E] hover:bg-[#A83F70] text-white font-bold shadow-xs cursor-pointer"
        >
          <span>📅</span>
          <span>Add to Itinerary</span>
        </button>
      </div>
    </div>
  );
};
