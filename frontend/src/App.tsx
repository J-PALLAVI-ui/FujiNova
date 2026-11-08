import React, { useState, useEffect } from 'react';
import { ChatDrawer } from './components/ChatDrawer';
import { PlacesGrid } from './components/PlacesGrid';
import { CrowdDashboard } from './components/CrowdDashboard';
import { TravellerProfile } from './types';
import { apiUrl } from './config';
import { MessageSquare, Mountain, Compass, Map } from 'lucide-react';

export const App: React.FC = () => {
  const [sessionId] = useState<string>(() => `fn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const [profile, setProfile] = useState<TravellerProfile>({});
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'crowdsense' | 'places'>('crowdsense');
  const [externalPrompt, setExternalPrompt] = useState<string | undefined>(undefined);
  const [health, setHealth] = useState<{ status: string; primary_model: string } | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        let res = await fetch(apiUrl('/health'));
        if (!res.ok) {
          res = await fetch(apiUrl('/api/v1/health'));
        }
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        } else {
          setHealth({ status: 'offline', primary_model: 'unavailable' });
        }
      } catch (err) {
        try {
          const res2 = await fetch(apiUrl('/api/v1/health'));
          if (res2.ok) {
            const data2 = await res2.json();
            setHealth(data2);
            return;
          }
        } catch (_) {}
        console.error('Health check failed', err);
        setHealth({ status: 'offline', primary_model: 'unavailable' });
      }
    };
    checkHealth();
  }, []);

  const handleAskHana = (prompt: string) => {
    setIsChatOpen(true);
    setExternalPrompt(prompt);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-black text-slate-900 tracking-tight text-lg">
              <span className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <Mountain className="w-5 h-5" />
              </span>
              <span>FujiNova</span>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('crowdsense')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'crowdsense'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-sky-600" />
                <span>CrowdSense Engine</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  Stage 3
                </span>
              </button>

              <button
                onClick={() => setActiveTab('places')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'places'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Map className="w-3.5 h-3.5 text-slate-500" />
                <span>Places Catalogue</span>
              </button>
            </nav>
          </div>

          {/* Active Profile Constraints Pills */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            {profile.party_composition && (
              <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium capitalize">
                Party: {profile.party_composition}
              </span>
            )}
            {profile.mobility_needs && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium capitalize">
                Mobility: {profile.mobility_needs}
              </span>
            )}
            {profile.interests && profile.interests.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium capitalize">
                Interests: {profile.interests.join(', ')}
              </span>
            )}
          </div>

          {/* Status & Chat Toggle */}
          <div className="flex items-center gap-3">
            {health && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-[11px]">{health.primary_model}</span>
              </div>
            )}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isChatOpen
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-sky-600 text-white hover:bg-sky-700 shadow-xs'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isChatOpen ? 'Hide Hana Chat' : 'Chat with Hana'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Workspace View */}
        <main className={`flex-1 overflow-y-auto transition-all duration-200 ${isChatOpen ? 'lg:mr-[420px]' : ''}`}>
          {activeTab === 'crowdsense' ? (
            <CrowdDashboard onAskHana={handleAskHana} />
          ) : (
            <PlacesGrid />
          )}
        </main>

        {/* Hana Chat Drawer */}
        {isChatOpen && (
          <aside className="fixed right-0 top-14 bottom-0 w-full sm:w-[420px] shadow-xl z-20 transition-transform">
            <ChatDrawer
              sessionId={sessionId}
              onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
              externalPrompt={externalPrompt}
            />
          </aside>
        )}
      </div>
    </div>
  );
};
