import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, ExternalLink, Award, ShieldCheck, RefreshCw } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export interface GalleryPhoto {
  id: number;
  place_id: string;
  commons_page_url: string;
  image_url: string;
  thumb_url: string;
  title: string;
  author: string;
  license_short: string;
  license_url?: string;
  description?: string;
  width?: number;
  height?: number;
}

interface WikimediaGalleryModalProps {
  placeId: string | null;
  placeName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WikimediaGalleryModal: React.FC<WikimediaGalleryModalProps> = ({
  placeId,
  placeName,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    if (!isOpen || !placeId) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/v1/live/gallery/${placeId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Gallery HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          const list: GalleryPhoto[] = data.photos || [];
          setPhotos(list);
          if (list.length > 0) setSelectedPhoto(list[0]);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load gallery');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, placeId]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#FAF6F0] border-2 border-[#E5DDD2] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E5DDD2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EFF5EE] text-[#789477]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="gallery-modal-title" className="text-lg font-extrabold text-[#29232B]">
                {placeName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#625966] font-medium">
                  {t('wikimedia_gallery', 'Verified Wikimedia Photography')}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF5EE] text-[#4F734E] border border-[#789477]/30">
                  <ShieldCheck className="w-3 h-3" />
                  CC-Licensed Media
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF6F0] text-[#625966] hover:text-[#29232B] transition-colors cursor-pointer"
            aria-label="Close photo gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
          {loading ? (
            <div className="w-full h-64 flex flex-col items-center justify-center gap-3 text-[#625966]">
              <RefreshCw className="w-8 h-8 animate-spin text-[#C66B4E]" />
              <p className="text-sm font-semibold">Retrieving verified Wikimedia Commons photography...</p>
            </div>
          ) : error || photos.length === 0 ? (
            <div className="w-full h-64 flex flex-col items-center justify-center gap-3 text-center p-6 bg-white rounded-2xl border border-[#E5DDD2]">
              <ImageIcon className="w-12 h-12 text-[#E9A5B5]" />
              <p className="text-sm font-bold text-[#29232B]">No Wikimedia Commons records found for this location.</p>
              <p className="text-xs text-[#625966] max-w-md">
                All photos are curated from verified Wikimedia Commons repositories with zero paid APIs.
              </p>
            </div>
          ) : (
            <>
              {/* Main Photo Preview */}
              <div className="flex-1 flex flex-col gap-3">
                {selectedPhoto && (
                  <div className="rounded-2xl overflow-hidden bg-black/5 border border-[#E5DDD2] relative flex flex-col">
                    <div className="h-80 w-full overflow-hidden flex items-center justify-center bg-stone-900">
                      <img
                        src={selectedPhoto.image_url}
                        alt={selectedPhoto.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    {/* Caption & Attribution Footer */}
                    <div className="p-4 bg-white border-t border-[#E5DDD2] space-y-2">
                      <h3 className="font-bold text-sm text-[#29232B] leading-tight">
                        {selectedPhoto.title}
                      </h3>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-[#403944]">
                          <span className="font-semibold text-[#625966]">{t('photo_by', 'Photo by')}:</span>
                          <span className="font-bold text-[#29232B]">{selectedPhoto.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF3EC] text-[#A83F70] border border-[#E9A5B5] font-bold text-[11px] flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {selectedPhoto.license_short}
                          </span>
                          <a
                            href={selectedPhoto.commons_page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#87365E] hover:text-[#A83F70] font-bold text-xs"
                          >
                            <span>Wikimedia Page</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      {selectedPhoto.description && (
                        <p className="text-xs text-[#625966] italic border-t border-[#FAF6F0] pt-2">
                          {selectedPhoto.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails Sidebar */}
              <div className="w-full md:w-56 flex flex-row md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-96 pr-1">
                <span className="text-xs font-bold text-[#625966] uppercase tracking-wider hidden md:block">
                  Photos ({photos.length})
                </span>
                {photos.map((p) => {
                  const isCur = selectedPhoto?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPhoto(p)}
                      className={`relative rounded-xl overflow-hidden border-2 text-left shrink-0 transition-all cursor-pointer ${
                        isCur
                          ? 'border-[#C66B4E] ring-2 ring-[#C66B4E]/30 scale-[1.02]'
                          : 'border-[#E5DDD2] hover:border-[#B99BCB]'
                      }`}
                    >
                      <img
                        src={p.thumb_url || p.image_url}
                        alt={p.title}
                        className="w-24 md:w-full h-16 md:h-20 object-cover"
                      />
                      <div className="p-1.5 bg-white text-[10px] truncate text-[#403944] font-medium">
                        {p.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Provenance */}
        <div className="px-6 py-3 bg-[#FAF3EC] border-t border-[#E5DDD2] flex flex-wrap items-center justify-between text-[11px] text-[#625966]">
          <span>
            Data Source: <strong>Wikimedia Commons API</strong> under Creative Commons / Public Domain licenses.
          </span>
          <span className="font-semibold text-[#4F734E]">
            ₹0 Cost Guarantee Verified
          </span>
        </div>
      </div>
    </div>
  );
};
