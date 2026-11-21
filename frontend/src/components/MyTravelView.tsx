import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Printer, 
  QrCode, 
  MapPin, 
  Trash2, 
  MessageSquare, 
  BookOpen, 
  Sparkles,
  Plus,
  Wifi,
  WifiOff,
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { ExpenseRecord, BudgetSummary } from '../types';
import { apiUrl } from '../config';

interface MyTravelViewProps {
  onAskHana: (prompt: string) => void;
  onOpenTrip?: (itineraryJson: any) => void;
}

const ESSENTIAL_PHRASES = [
  { ja: '富士山はどこから見えますか？', romaji: 'Fujisan wa doko kara miemasu ka?', en: 'Where can I see Mount Fuji from?' },
  { ja: '河口湖駅行きのバスはどれですか？', romaji: 'Kawaguchiko-eki yuki no basu wa dore desu ka?', en: 'Which bus goes to Kawaguchiko Station?' },
  { ja: '写真を撮ってもいいですか？', romaji: 'Shashin o totte mo ii desu ka?', en: 'May I take a photo here?' },
  { ja: 'おすすめのほうとう屋はありますか？', romaji: 'Osusume no houtou-ya wa arimasu ka?', en: 'Is there a recommended Hoto noodle place?' },
  { ja: '英語のメニューはありますか？', romaji: 'Eigo no menyuu wa arimasu ka?', en: 'Do you have an English menu?' },
  { ja: '忍野八海で降ります。', romaji: 'Oshino Hakkai de orimasu.', en: 'I would like to get off at Oshino Hakkai.' },
  { ja: '車椅子用のスロープはありますか？', romaji: 'Kurumaisu you no suroopu wa arimasu ka?', en: 'Is there a wheelchair ramp?' },
  { ja: 'ありがとうございます', romaji: 'Arigatou gozaimasu', en: 'Thank you very much (polite)' }
];

export const MyTravelView: React.FC<MyTravelViewProps> = ({ onAskHana, onOpenTrip: _onOpenTrip }) => {
  const [activeTab, setActiveTab] = useState<'budget' | 'expenses' | 'saved_trips' | 'wishlist' | 'offline'>('budget');
  const [targetDailyBudget, setTargetDailyBudget] = useState<number>(10000);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // New expense form
  const [newCat, setNewCat] = useState<string>('meals');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');

  const [wishlist, setWishlist] = useState<string[]>([
    'kawaguchiko_oishi_park',
    'arakurayama_chureito',
    'oshino_hakkai',
    'saiko_iyashi_no_sato'
  ]);

  // Online/Offline tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch expenses and budget summary
  const fetchExpenses = async () => {
    try {
      const [resExp, resSummary, resTrips] = await Promise.all([
        fetch(apiUrl('/api/v1/expenses')),
        fetch(apiUrl(`/api/v1/expenses/summary?target_daily_budget_jpy=${targetDailyBudget}`)),
        fetch(apiUrl('/api/v1/itinerary/saved?limit=10'))
      ]);
      if (resExp.ok) setExpenses(await resExp.json());
      if (resSummary.ok) setBudgetSummary(await resSummary.json());
      if (resTrips.ok) {
        const data = await resTrips.json();
        setSavedTrips(data.trips || []);
      }
    } catch (_) {
      // Offline fallback: load from localStorage
      const cached = localStorage.getItem('fujinova_cached_expenses');
      if (cached) {
        try { setExpenses(JSON.parse(cached)); } catch (_) {}
      }
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [targetDailyBudget]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(newAmount, 10);
    if (!amt || isNaN(amt) || !newDesc.trim()) return;

    try {
      const res = await fetch(apiUrl('/api/v1/expenses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCat,
          amount_jpy: amt,
          description: newDesc.trim(),
          is_verified_fee: false
        })
      });
      if (res.ok) {
        setNewAmount('');
        setNewDesc('');
        fetchExpenses();
      }
    } catch (err) {
      console.error('Failed to record expense:', err);
    }
  };

  const handleDeleteExpense = async (expId: string) => {
    try {
      await fetch(apiUrl(`/api/v1/expenses/${expId}`), { method: 'DELETE' });
      setExpenses(expenses.filter(e => e.expense_id !== expId));
      fetchExpenses();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const handleRemoveWishlist = (id: string) => {
    setWishlist(wishlist.filter(item => item !== id));
  };

  return (
    <div className="h-full overflow-y-auto bg-transparent text-[#29232B] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-text">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE0D0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-[#EFF5EE] text-[#4F734E] flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5 text-[#789477]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#29232B]">My Travel Dashboard</h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isOnline ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
            </span>
          </div>
          <p className="text-xs text-[#5A525E]">
            Smart budget management in Japanese Yen (¥), live expense logging, verified saved itineraries, and offline phrasebook.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white border border-[#EAE0D0] p-1 rounded-2xl self-start sm:self-auto shadow-2xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'budget' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
            }`}
          >
            Budget Manager
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'expenses' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
            }`}
          >
            Log Expense ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('saved_trips')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'saved_trips' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
            }`}
          >
            Saved Trips
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'wishlist' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
            }`}
          >
            Wishlist ({wishlist.length})
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'offline' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
            }`}
          >
            Offline Companion
          </button>
        </div>
      </div>

      {activeTab === 'budget' ? (
        /* Smart Travel Budget Overview */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm">
              <span className="text-[11px] font-bold text-[#625966] uppercase tracking-wider block mb-1">
                Planned Daily Budget
              </span>
              <span className="text-3xl font-black text-[#29232B] font-mono">
                ¥{targetDailyBudget.toLocaleString()}
              </span>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[#403944]">Target (¥):</span>
                <input
                  type="number"
                  step="1000"
                  value={targetDailyBudget}
                  onChange={(e) => setTargetDailyBudget(Math.max(1000, Number(e.target.value)))}
                  className="w-28 bg-[#FAF6F0] border border-[#EAE0D0] rounded-xl px-2.5 py-1 text-xs text-[#29232B] font-mono"
                />
              </div>
            </div>

            <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm">
              <span className="text-[11px] font-bold text-[#625966] uppercase tracking-wider block mb-1">
                Estimated Total Expenses
              </span>
              <span className="text-3xl font-black text-[#C66B4E] font-mono">
                ¥{(budgetSummary?.total_spent_jpy || 0).toLocaleString()}
              </span>
              <p className="text-xs text-[#403944] mt-3">
                Logged across {expenses.length} travel transactions.
              </p>
            </div>

            <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm">
              <span className="text-[11px] font-bold text-[#625966] uppercase tracking-wider block mb-1">
                Remaining Balance
              </span>
              <span className={`text-3xl font-black font-mono ${
                (budgetSummary?.remaining_balance_jpy ?? 0) >= 0 ? 'text-[#4F734E]' : 'text-rose-600'
              }`}>
                ¥{(budgetSummary?.remaining_balance_jpy ?? targetDailyBudget).toLocaleString()}
              </span>
              <p className="text-xs text-[#403944] mt-3">
                {(budgetSummary?.remaining_balance_jpy ?? 0) >= 0
                  ? 'Within your planned travel financial allowance.'
                  : 'Exceeding target; consider free lakeside viewpoints.'}
              </p>
            </div>
          </div>

          {/* Category Expense Breakdown */}
          {budgetSummary && (
            <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#29232B] flex items-center justify-between">
                <span>Spending by Category (Recorded)</span>
                <button
                  onClick={() => onAskHana('Can you suggest how I can optimize my travel budget around Mount Fuji?')}
                  className="text-xs font-bold text-[#C66B4E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Hana to optimize budget</span>
                </button>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(budgetSummary.spent_by_category).map(([cat, amt]) => (
                  <div key={cat} className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D0] flex flex-col justify-between">
                    <span className="text-xs font-bold text-[#625966] capitalize">{cat}</span>
                    <span className="text-base font-extrabold text-[#29232B] font-mono mt-1">¥{amt.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'expenses' ? (
        /* Live Expense Logging Form & Transactions */
        <div className="space-y-6">
          <form onSubmit={handleAddExpense} className="p-6 rounded-3xl bg-white border border-[#EAE0D0] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#29232B] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#C66B4E]" />
              <span>Record a New Travel Expense (JPY)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#625966] block mb-1">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full bg-[#FAF6F0] border border-[#EAE0D0] rounded-xl px-3 py-2 text-xs text-[#29232B]"
                >
                  <option value="transport">Transit (Bus / Train / Ropeway)</option>
                  <option value="admission">Admission & Tickets</option>
                  <option value="meals">Meals & Dining</option>
                  <option value="accommodation">Lodging / Ryokan</option>
                  <option value="shopping">Souvenirs & Shopping</option>
                  <option value="other">Other Incidentals</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#625966] block mb-1">Amount (¥)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-[#FAF6F0] border border-[#EAE0D0] rounded-xl px-3 py-2 text-xs text-[#29232B] font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#625966] block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Hoto noodles at station"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#FAF6F0] border border-[#EAE0D0] rounded-xl px-3 py-2 text-xs text-[#29232B]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#C66B4E] hover:bg-[#B2583D] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Add Expense Record
            </button>
          </form>

          {/* Transactions List */}
          <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#29232B]">Recorded Travel Expenses</h3>
            {expenses.length === 0 ? (
              <p className="text-xs text-[#625966] py-4 text-center">No expenses recorded yet. Use the form above to log your trip expenses.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => (
                  <div key={exp.expense_id} className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D0] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#29232B]">{exp.description}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#625966] border border-[#EAE0D0] capitalize">
                          {exp.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#625966] block mt-0.5">{exp.created_at}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-[#29232B] font-mono">¥{exp.amount_jpy.toLocaleString()}</span>
                      <button
                        onClick={() => handleDeleteExpense(exp.expense_id)}
                        className="p-1.5 text-[#625966] hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'saved_trips' ? (
        /* Saved Trips List */
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#29232B]">Saved Itineraries in Database</h3>
          {savedTrips.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-[#EAE0D0] text-center text-xs text-[#625966] space-y-2">
              <Calendar className="w-8 h-8 text-[#789477] mx-auto" />
              <p>No saved trips in database yet. Plan an itinerary with Hana or Journey Planner and click Export to save permanently.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedTrips.map((trip) => (
                <div key={trip.trip_id} className="p-5 rounded-2xl bg-white border border-[#EAE0D0] shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#29232B]">{trip.title}</h4>
                    <p className="text-[11px] text-[#625966]">Duration: {trip.total_days} Day(s) • Pace: {trip.pace}</p>
                    <span className="text-[10px] text-[#789477] font-semibold block mt-1">Saved: {trip.created_at}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#EAE0D0]">
                    <a
                      href={apiUrl(`/api/v1/itinerary/export-pdf?token=${trip.share_token}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#C66B4E] text-[#29232B] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-[#EAE0D0]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                    <a
                      href={`/trip/${trip.share_token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#29232B] text-white text-xs font-bold hover:bg-black transition-all flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Open Itinerary</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'wishlist' ? (
        /* Saved Wishlist */
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#29232B] flex items-center justify-between">
            <span>Saved Places for Next Trip</span>
            <span className="text-xs text-[#625966]">{wishlist.length} places saved</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishlist.map((id) => (
              <div key={id} className="p-4 rounded-2xl bg-white border border-[#EAE0D0] shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF5EE] text-[#4F734E] flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5 text-[#789477]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#29232B] capitalize">{id.replace(/_/g, ' ')}</h4>
                    <span className="text-[10px] text-[#789477] font-semibold">Verified Destination</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onAskHana(`Tell me about ${id.replace(/_/g, ' ')} and how to visit.`)}
                    className="p-1.5 text-[#625966] hover:text-[#C66B4E] rounded-lg hover:bg-[#FAF6F0] cursor-pointer"
                    title="Ask Hana"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveWishlist(id)}
                    className="p-1.5 text-[#625966] hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Offline Companion & Emergency Phrasebook */
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF6F0] text-[#29232B] text-xs font-bold border border-[#EAE0D0] transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#789477]" />
              <span>Print Itinerary Schedule</span>
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#C66B4E] hover:bg-[#B2583D] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Share Trip via QR Code</span>
            </button>
          </div>

          {/* Essential Travel Phrasebook */}
          <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#29232B] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C66B4E]" />
              <span>Essential Mount Fuji Travel Phrases (Offline Ready)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ESSENTIAL_PHRASES.map((phrase, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D0] space-y-1">
                  <span className="text-sm font-bold text-[#29232B] block">{phrase.ja}</span>
                  <span className="text-xs text-[#C66B4E] font-mono block">{phrase.romaji}</span>
                  <span className="text-xs text-[#403944] block">{phrase.en}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#29232B]">Scan to Open FujiNova Trip</h3>
            <div className="w-48 h-48 bg-[#FAF6F0] border border-[#EAE0D0] rounded-2xl mx-auto flex items-center justify-center p-3 shadow-inner">
              <QrCode className="w-36 h-36 text-[#29232B]" />
            </div>
            <p className="text-xs text-[#403944]">
              Point your phone camera to instantly access your synced itinerary and offline phrases.
            </p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-[#C66B4E] hover:bg-[#B2583D] text-white text-xs font-bold rounded-2xl cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
