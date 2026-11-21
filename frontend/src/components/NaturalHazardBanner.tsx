import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, ChevronRight, Wind, Flame } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export interface HazardAlert {
  alert_id: string;
  alert_type: string;
  severity: string;
  title_en: string;
  title_ja: string;
  description_en: string;
  description_ja: string;
  issuer: string;
  effective_time: string;
  is_active: boolean;
}

export const NaturalHazardBanner: React.FC = () => {
  const { language } = useTranslation();
  const [alerts, setAlerts] = useState<HazardAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetch('/api/v1/live/hazards')
      .then((res) => {
        if (!res.ok) throw new Error(`Hazards HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          setAlerts(data.alerts || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || alerts.length === 0) return null;

  // Find primary alert: check for volcanic status or highest severity
  const volcanicAlert = alerts.find((a) => a.alert_type === 'VOLCANIC') || alerts[0];
  const isNormal = volcanicAlert.severity === 'NORMAL' || volcanicAlert.severity === 'INFO';
  const isWarning = volcanicAlert.severity === 'WARNING' || volcanicAlert.severity === 'EMERGENCY';

  const title = language === 'ja' ? volcanicAlert.title_ja : volcanicAlert.title_en;
  const description = language === 'ja' ? volcanicAlert.description_ja : volcanicAlert.description_en;

  const bgStyle = isWarning
    ? 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]'
    : isNormal
    ? 'bg-[#EFF5EE] border-[#C8E6C9] text-[#2E7D32]'
    : 'bg-[#FFF8E1] border-[#FFE082] text-[#F57F17]';

  const icon = isWarning ? (
    <AlertCircle className="w-4 h-4 text-[#D32F2F] shrink-0" />
  ) : isNormal ? (
    <ShieldCheck className="w-4 h-4 text-[#388E3C] shrink-0" />
  ) : (
    <AlertTriangle className="w-4 h-4 text-[#F57C00] shrink-0" />
  );

  return (
    <aside aria-label="Official JMA mountain safety alert" className={`w-full border rounded-2xl p-3.5 mb-4 shadow-xs transition-all ${bgStyle}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-white/70 backdrop-blur-xs shrink-0 shadow-xs">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-[#29232B]">
                {volcanicAlert.issuer} Official Safety Alert
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 border border-current text-[#403944]">
                {volcanicAlert.severity}
              </span>
            </div>
            <p className="text-xs font-bold text-[#29232B] truncate mt-0.5">
              {title}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-bold text-[#403944] hover:text-[#29232B] px-2.5 py-1 rounded-xl bg-white/80 border border-[#E5DDD2] hover:bg-white shrink-0 cursor-pointer transition-all"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-current/20 space-y-2 text-xs text-[#403944] animate-in fade-in duration-150">
          <p className="leading-relaxed font-medium">{description}</p>
          
          {alerts.length > 1 && (
            <div className="mt-2 space-y-1.5 pt-2 border-t border-current/10">
              <span className="text-[11px] font-extrabold uppercase text-[#29232B] block">
                Additional Regional Advisories ({alerts.length - 1}):
              </span>
              {alerts.slice(1).map((a) => (
                <div key={a.alert_id} className="flex items-start gap-2 bg-white/60 p-2 rounded-xl">
                  {a.alert_type === 'WEATHER_WARNING' ? (
                    <Wind className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
                  ) : (
                    <Flame className="w-3.5 h-3.5 text-[#C66B4E] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-[#29232B]">
                      {language === 'ja' ? a.title_ja : a.title_en}
                    </span>
                    <p className="text-[11px] text-[#625966] mt-0.5">
                      {language === 'ja' ? a.description_ja : a.description_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1 text-[10px] text-[#625966]">
            <span>Issuer: Japan Meteorological Agency (JMA) Open Hazard Feed</span>
            <span>Zero-Cost Public Disaster Prevention Data</span>
          </div>
        </div>
      )}
    </aside>
  );
};
