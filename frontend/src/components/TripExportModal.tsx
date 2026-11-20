import React, { useState, useEffect } from 'react';
import { ItineraryPlan } from '../types';
import { apiUrl } from '../config';
import { 
  X, 
  QrCode, 
  FileDown, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck
} from 'lucide-react';

interface TripExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: ItineraryPlan | null;
}

export const TripExportModal: React.FC<TripExportModalProps> = ({
  isOpen,
  onClose,
  itinerary
}) => {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [_loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPrivate] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // When modal opens, save/sync itinerary to backend to generate share token and QR
  useEffect(() => {
    if (!isOpen || !itinerary) return;

    const saveTrip = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl('/api/v1/itinerary/save'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: itinerary.title || 'Mount Fuji Travel Journey',
            itinerary: itinerary,
            is_private: isPrivate
          })
        });

        if (!res.ok) {
          throw new Error(`Failed to generate share link (${res.status})`);
        }

        const data = await res.json();
        setShareToken(data.share_token);
        // Build frontend web share URL
        const origin = window.location.origin;
        setShareUrl(`${origin}/trip/${data.share_token}`);
      } catch (err: any) {
        console.error('Trip save error:', err);
        setError(err.message || 'Could not save itinerary to server.');
      } finally {
        setLoading(false);
      }
    };

    saveTrip();
  }, [isOpen, itinerary, isPrivate]);

  if (!isOpen || !itinerary) return null;

  const totalStops = itinerary.days?.reduce((sum, d) => sum + (d.stops?.length || 0), 0) || 0;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = async () => {
    if (!shareToken) return;
    setIsDownloadingPdf(true);
    try {
      const downloadUrl = apiUrl(`/api/v1/itinerary/export-pdf?token=${shareToken}`);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `fujinova-itinerary-${shareToken}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </span>
            <div>
              <h2 id="export-modal-title" className="text-base font-bold text-white">
                Share & Export Trip
              </h2>
              <p className="text-xs text-slate-400">
                {itinerary.title} • {totalStops} {totalStops === 1 ? 'stop' : 'stops'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* QR Code Card */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-32 h-32 bg-white rounded-xl p-2 shrink-0 shadow-md flex items-center justify-center">
              {shareToken ? (
                <img
                  src={apiUrl(`/api/v1/itinerary/qr/${shareToken}`)}
                  alt="Trip QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="animate-pulse flex items-center justify-center w-full h-full text-slate-300">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                Mobile Synchronized
              </span>
              <h3 className="font-bold text-white text-sm mt-1.5">
                Scan to Open on Mobile
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Scan with any smartphone camera to open this full interactive itinerary and 3D terrain route without installing an app.
              </p>
            </div>
          </div>

          {/* Web Share Link Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Public Shareable Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl || 'Generating secure link...'}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-hidden"
              />
              <button
                onClick={handleCopyLink}
                disabled={!shareUrl}
                className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Actions: Download PDF */}
          <div className="pt-2">
            <button
              onClick={handleDownloadPdf}
              disabled={!shareToken || isDownloadingPdf}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>
                {isDownloadingPdf ? 'Generating PDF Document...' : 'Download Official FujiNova PDF (Unicode Japanese)'}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Includes day-by-day stops, barrier-free notes, emergency contacts & embedded QR code.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Provable Itinerary</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
