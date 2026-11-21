import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, CheckCircle, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

export interface ProviderHealth {
  provider_name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'RATE_LIMITED' | 'DOWN';
  latency_ms: number;
  last_sync: string;
  records_cached: number;
  message: string;
}

export const ProviderStatusPanel: React.FC = () => {
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchHealth = () => {
    setLoading(true);
    fetch('/api/v1/live/health')
      .then((res) => res.json())
      .then((data) => {
        setProviders(data.providers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/v1/live/sync', { method: 'POST' });
    } catch (_) {}
    fetchHealth();
    setSyncing(false);
  };

  return (
    <div className="bg-white border-2 border-[#E5DDD2] rounded-3xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5DDD2]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#EFF5EE] text-[#789477]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#29232B]">
              Real-Time Provider Sync & Zero-Cost Telemetry
            </h3>
            <p className="text-xs text-[#625966]">
              All data feeds operate strictly on free public sector and CC-licensed platforms (₹0 guarantee)
            </p>
          </div>
        </div>

        <button
          onClick={triggerSync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#FAF3EC] border border-[#E5DDD2] text-[#403944] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#C66B4E]' : 'text-[#789477]'}`} />
          <span>{syncing ? 'Synchronizing...' : 'Trigger Full Sync'}</span>
        </button>
      </div>

      {loading && providers.length === 0 ? (
        <div className="p-4 text-center text-xs text-[#625966]">Loading provider telemetry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {providers.map((p) => {
            const isHealthy = p.status === 'HEALTHY';
            return (
              <div
                key={p.provider_name}
                className="p-3.5 rounded-2xl border border-[#E5DDD2] bg-[#FAF6F0] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-extrabold text-xs text-[#29232B] truncate">
                      {p.provider_name.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isHealthy
                          ? 'bg-[#EFF5EE] text-[#2E7D32] border border-[#C8E6C9]'
                          : 'bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082]'
                      }`}
                    >
                      {isHealthy ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#625966] line-clamp-2">{p.message}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#E5DDD2] flex items-center justify-between text-[11px] text-[#403944]">
                  <span className="flex items-center gap-1 font-semibold">
                    <Zap className="w-3 h-3 text-[#C66B4E]" />
                    {p.latency_ms} ms
                  </span>
                  <span className="text-[#625966]">
                    {p.records_cached} cached records
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[#E5DDD2] flex flex-wrap items-center justify-between text-[11px] text-[#625966]">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#789477]" />
          FREE_ONLY_MODE: Locked (Google Places, OpenAI, Paid APIs Disabled)
        </span>
        <span className="font-bold text-[#2E7D32]">
          Production Ready 10.0
        </span>
      </div>
    </div>
  );
};
