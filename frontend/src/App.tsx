import React, { useState, useEffect } from 'react';
import { ChatDrawer } from './components/ChatDrawer';
import { PlacesGrid } from './components/PlacesGrid';
import { TravellerProfile } from './types';
import { MessageSquare, Mountain } from 'lucide-react';

export const App: React.FC = () => {
  const [sessionId] = useState<string>(() => `fn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const [profile, setProfile] = useState<TravellerProfile>({});
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [health, setHealth] = useState<{ status: string; primary_model: string } | null>(null);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error('Health check failed', err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-black text-slate-900 tracking-tight text-lg">
              <span className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <Mountain className="w-5 h-5" />
              </span>
              <span>FujiNova</span>
            </div>
            <span className="hidden sm:inline-block text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Stage 1 Prototype
            </span>
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
        {/* Main Place Explorer */}
        <main className={`flex-1 overflow-y-auto transition-all duration-200 ${isChatOpen ? 'lg:mr-[420px]' : ''}`}>
          <PlacesGrid />
        </main>

        {/* Hana Chat Drawer */}
        {isChatOpen && (
          <aside className="fixed right-0 top-14 bottom-0 w-full sm:w-[420px] shadow-xl z-20 transition-transform">
            <ChatDrawer
              sessionId={sessionId}
              onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
            />
          </aside>
        )}
      </div>
    </div>
  );
};
