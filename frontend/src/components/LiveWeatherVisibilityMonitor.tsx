import React, { useEffect, useState } from 'react';
import { CloudSun, Sun, CloudRain, Snowflake, Wind, Droplets, Mountain, Eye, RefreshCw, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export interface WeatherSnapshot {
  station_id: string;
  station_name: string;
  elevation_m: number;
  latitude: number;
  longitude: number;
  temperature_c: number;
  relative_humidity_pct: number;
  wind_speed_kmh: number;
  cloud_cover_pct: number;
  visibility_km: number;
  wmo_weather_code: number;
  wmo_description: string;
  fuji_visibility_score: number;
  captured_at: string;
}

export const LiveWeatherVisibilityMonitor: React.FC = () => {
  const { t } = useTranslation();
  const [snapshots, setSnapshots] = useState<WeatherSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    fetch('/api/v1/live/weather')
      .then((res) => {
        if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSnapshots(data.snapshots || []);
        setError(null);
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch weather');
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/v1/live/sync', { method: 'POST' });
    } catch (_) {}
    fetchWeather(true);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white border border-[#E5DDD2] rounded-3xl flex items-center justify-center gap-3 text-[#625966]">
        <RefreshCw className="w-5 h-5 animate-spin text-[#C66B4E]" />
        <span className="text-sm font-semibold">Loading live elevation weather and visibility data...</span>
      </div>
    );
  }

  if (error && snapshots.length === 0) {
    return null;
  }

  // Calculate overall or lakeside visibility score
  const lakeStation = snapshots.find((s) => s.station_id === 'kawaguchiko_lake') || snapshots[0];
  const visibilityScore = lakeStation ? Math.round(lakeStation.fuji_visibility_score) : 75;

  const getVisibilityBadge = (score: number) => {
    if (score >= 70) {
      return {
        label: 'Exceptional (Clear View)',
        bg: 'bg-[#EFF5EE] text-[#2E7D32] border-[#C8E6C9]',
        bar: 'bg-[#789477]'
      };
    } else if (score >= 40) {
      return {
        label: 'Moderate (Partially Clouded)',
        bg: 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]',
        bar: 'bg-[#C66B4E]'
      };
    }
    return {
      label: 'Low / Obscured (Cloud Cover)',
      bg: 'bg-[#FAF3EC] text-[#A83F70] border-[#E9A5B5]',
      bar: 'bg-[#A83F70]'
    };
  };

  const badge = getVisibilityBadge(visibilityScore);

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return <Sun className="w-5 h-5 text-[#F59E0B]" />;
    if (code === 2 || code === 3) return <CloudSun className="w-5 h-5 text-[#0284C7]" />;
    if (code >= 71 && code <= 77) return <Snowflake className="w-5 h-5 text-[#38BDF8]" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-5 h-5 text-[#6366F1]" />;
    return <CloudSun className="w-5 h-5 text-[#789477]" />;
  };

  return (
    <div className="bg-white border-2 border-[#E5DDD2] rounded-3xl p-5 mb-6 shadow-sm">
      {/* Header with Title and Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5DDD2]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#EFF5EE] text-[#789477]">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#29232B] flex items-center gap-2">
              <span>{t('live_weather', 'Live Weather & Visibility')}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF3EC] text-[#A83F70] border border-[#E9A5B5]">
                Stratified by Elevation
              </span>
            </h2>
            <p className="text-xs text-[#625966]">
              Real-time atmospheric telemetry from Mount Fuji Summit to Lake Kawaguchiko Lakeside
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#625966] font-medium hidden sm:inline">
            Open-Meteo High-Res API
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#FAF3EC] border border-[#E5DDD2] text-[#403944] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Refresh live telemetry now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C66B4E]' : 'text-[#789477]'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Visibility Score Meter */}
      <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E5DDD2] mb-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#C66B4E]" />
            <span className="text-xs font-black uppercase text-[#29232B] tracking-wider">
              {t('visibility_prob', 'Fuji Visibility Probability')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
              {badge.label}
            </span>
            <span className="text-base font-black text-[#29232B]">{visibilityScore}%</span>
          </div>
        </div>
        {/* Progress Bar Gauge */}
        <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out ${badge.bar}`}
            style={{ width: `${visibilityScore}%` }}
          />
        </div>
      </div>

      {/* 3 Elevation Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {snapshots.slice(0, 3).map((s) => {
          const isSummit = s.station_id === 'fuji_summit';
          const isLake = s.station_id === 'kawaguchiko_lake';
          return (
            <div
              key={s.station_id}
              className={`p-4 rounded-2xl border transition-all ${
                isSummit
                  ? 'bg-[#FAF3EC] border-[#E9A5B5]/60 hover:border-[#A83F70]'
                  : isLake
                  ? 'bg-[#EFF5EE] border-[#789477]/40 hover:border-[#789477]'
                  : 'bg-[#FAF6F0] border-[#E5DDD2] hover:border-[#B99BCB]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-extrabold text-xs text-[#29232B] leading-tight">
                    {s.station_name}
                  </h3>
                  <span className="text-[10px] text-[#625966] font-semibold">
                    Elev. {s.elevation_m.toLocaleString()} m
                  </span>
                </div>
                <div className="p-1.5 rounded-xl bg-white shadow-xs">
                  {getWeatherIcon(s.wmo_weather_code)}
                </div>
              </div>

              {/* Temperature & Condition */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-2xl font-black ${s.temperature_c <= 0 ? 'text-[#0284C7]' : 'text-[#29232B]'}`}>
                  {s.temperature_c > 0 ? `+${s.temperature_c.toFixed(1)}` : s.temperature_c.toFixed(1)}°C
                </span>
                <span className="text-xs font-semibold text-[#403944] truncate" title={s.wmo_description}>
                  {s.wmo_description}
                </span>
              </div>

              {/* Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5DDD2]/70 text-[11px] text-[#625966]">
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-[#789477]" />
                  <span>{Math.round(s.wind_speed_kmh)} km/h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>{Math.round(s.relative_humidity_pct)}% hum</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Provenance */}
      <div className="mt-4 pt-3 border-t border-[#E5DDD2] flex flex-wrap items-center justify-between text-[11px] text-[#625966]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#789477]" />
          <span>Source: Open-Meteo High-Resolution (Free Non-Commercial Model)</span>
        </div>
        <span className="font-semibold text-[#4F734E]">
          Zero Paid APIs Required (₹0 Cost Guarantee)
        </span>
      </div>
    </div>
  );
};
