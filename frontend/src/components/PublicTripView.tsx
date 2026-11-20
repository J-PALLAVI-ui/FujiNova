import React, { useEffect, useState } from 'react';
import { ItineraryPlan } from '../types';
import { apiUrl } from '../config';
import { FujiNovaLogo } from './brand/FujiNovaLogo';
import { 
  Clock, 
  FileDown, 
  Share2, 
  Check, 
  Compass, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface PublicTripViewProps {
  shareToken: string;
  onOpenInApp: (itinerary: ItineraryPlan) => void;
}

export const PublicTripView: React.FC<PublicTripViewProps> = ({
  shareToken,
  onOpenInApp
}) => {
  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchTrip = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl(`/api/v1/itinerary/share/${shareToken}`));
        if (!res.ok) {
          if (res.status === 410) {
            throw new Error('This shared travel link has expired or been revoked.');
          }
          throw new Error('Itinerary not found.');
        }
        const data = await res.json();
        setItinerary(data.itinerary);
      } catch (err: any) {
        setError(err.message || 'Could not load itinerary.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [shareToken]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    const downloadUrl = apiUrl(`/api/v1/itinerary/export-pdf?token=${shareToken}`);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `fujinova-trip-${shareToken}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-300">Loading Mount Fuji Itinerary...</p>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold">Unable to Load Itinerary</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="mt-6 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-colors"
        >
          Return to FujiNova Home
        </button>
      </div>
    );
  }

  const totalStops = itinerary.days?.reduce((sum, d) => sum + (d.stops?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <FujiNovaLogo variant="full-horizontal" size="sm" />
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied' : 'Share'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full space-y-8">
        {/* Hero Card */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-3 py-0.5 rounded-full border border-pink-500/30">
              Shared Mount Fuji Journey
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {itinerary.total_days || 1} Day Exploration • {totalStops} Stops
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {itinerary.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Personalized travel itinerary through Mount Fuji and Yamanashi Prefecture with authentic verified locations, view ratings, and transit timings.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onOpenInApp(itinerary)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-sky-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:opacity-95 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Open in FujiNova 3D Digital Twin</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors border border-slate-700"
            >
              <FileDown className="w-4 h-4 text-sky-400" />
              <span>Download Official PDF</span>
            </button>
          </div>
        </div>

        {/* Day-by-Day Timeline */}
        <div className="space-y-6">
          {itinerary.days?.map((day) => (
            <div key={day.day_number} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                    {day.day_number}
                  </span>
                  <h2 className="text-base font-bold text-white">
                    {day.title || `Day ${day.day_number}: Highlights`}
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  {day.stops?.length || 0} destinations
                </span>
              </div>

              {/* Stop Cards */}
              <div className="space-y-4">
                {day.stops?.map((stop, sIdx) => (
                  <div
                    key={stop.stop_id || sIdx}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {sIdx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">
                            {stop.name_en || stop.name_ja}
                          </h3>
                          <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                            ★ {stop.fuji_view_rating}/5
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{stop.name_ja}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {stop.estimated_arrival || '09:00'} ({stop.duration_minutes || 60}m)
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">
                            {stop.admission_info || 'Free Admission'}
                          </span>
                          <span>•</span>
                          <span className="capitalize text-slate-300">
                            {stop.accessibility_status?.replace('VERIFIED_ACCESSIBLE', 'Barrier-Free').replace('_', ' ') || 'Accessible'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => onOpenInApp(itinerary)}
                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                      >
                        <span>Focus in 3D</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>FujiNova 7.0 • Official Mount Fuji & Yamanashi Tourism Intelligence</p>
      </footer>
    </div>
  );
};
