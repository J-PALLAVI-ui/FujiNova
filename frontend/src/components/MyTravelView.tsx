import React, { useState } from 'react';
import { 
  Wallet, 
  Printer, 
  QrCode, 
  MapPin, 
  Trash2, 
  MessageSquare, 
  BookOpen, 
  Sparkles
} from 'lucide-react';

interface MyTravelViewProps {
  onAskHana: (prompt: string) => void;
}

interface BudgetItem {
  category: string;
  amount: number;
  icon: string;
  notes: string;
}

const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  { category: 'Transit (Buses & Rail)', amount: 4800, icon: '🚌', notes: 'Mt. Fuji Pass or Fujikyu Omni Bus & Train' },
  { category: 'Attractions & Admission', amount: 3300, icon: '🎟️', notes: 'Ropeway (¥1,000), Music Forest (¥1,800), Saiko Village (¥500)' },
  { category: 'Dining & Hoto Noodles', amount: 6500, icon: '🍲', notes: 'Traditional Hoto noodles, seasonal fruits, cafes' },
  { category: 'Onsen / Ryokan Lodging', amount: 18000, icon: '🏨', notes: 'Lakeside hot spring accommodation per person' },
  { category: 'Souvenirs & Crafts', amount: 3000, icon: '🛍️', notes: 'Kofu wine, Kikyoushingenmochi confectionery' },
];

const ESSENTIAL_PHRASES = [
  { ja: '富士山はどこから見えますか？', romaji: 'Fujisan wa doko kara miemasu ka?', en: 'Where can I see Mount Fuji from?' },
  { ja: '河口湖駅行きのバスはどれですか？', romaji: 'Kawaguchiko-eki yuki no basu wa dore desu ka?', en: 'Which bus goes to Kawaguchiko Station?' },
  { ja: '写真を撮ってもいいですか？', romaji: 'Shashin o totte mo ii desu ka?', en: 'May I take a photo here?' },
  { ja: 'おすすめのほうとう屋はありますか？', romaji: 'Osusume no houtou-ya wa arimasu ka?', en: 'Is there a recommended Hoto noodle place?' },
  { ja: '英語のメニューはありますか？', romaji: 'Eigo no menyuu wa arimasu ka?', en: 'Do you have an English menu?' },
  { ja: 'ありがとうございます', romaji: 'Arigatou gozaimasu', en: 'Thank you very much (polite)' }
];

export const MyTravelView: React.FC<MyTravelViewProps> = ({ onAskHana }) => {
  const [activeTab, setActiveTab] = useState<'budget' | 'wishlist' | 'offline'>('budget');
  const [totalTargetBudget, setTotalTargetBudget] = useState<number>(40000);
  const [partySize] = useState<number>(2);
  const [budgetItems] = useState<BudgetItem[]>(DEFAULT_BUDGET_ITEMS);
  const [showQrModal, setShowQrModal] = useState(false);

  const [wishlist, setWishlist] = useState<string[]>([
    'kawaguchiko_oishi_park',
    'arakurayama_chureito',
    'oshino_hakkai',
    'saiko_iyashi_nenba'
  ]);

  const totalEstimatedExpense = budgetItems.reduce((acc, item) => acc + item.amount * partySize, 0);
  const remainingBudget = totalTargetBudget * partySize - totalEstimatedExpense;

  const handleRemoveWishlist = (id: string) => {
    setWishlist(wishlist.filter(item => item !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full overflow-y-auto bg-transparent text-[#29252B] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-text">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE0D0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-[#EFF5EE] text-[#4F734E] flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5 text-[#789477]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#29252B]">My Travel Dashboard</h1>
          </div>
          <p className="text-xs text-[#5A525E]">
            Smart budget management in Japanese Yen, trip wishlists, and offline emergency companion.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white border border-[#EAE0D0] p-1 rounded-2xl self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'budget' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
            }`}
          >
            Budget Manager
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'wishlist' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
            }`}
          >
            Saved Wishlist ({wishlist.length})
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'offline' ? 'bg-[#C66B4E] text-white shadow-xs' : 'text-[#5A525E] hover:text-[#29252B]'
            }`}
          >
            Offline Companion
          </button>
        </div>
      </div>

      {activeTab === 'budget' ? (
        /* Smart Travel Budget Manager */
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm">
              <span className="text-[11px] font-bold text-[#8A808F] uppercase tracking-wider block mb-1">
                Total Budget ({partySize} travelers)
              </span>
              <span className="text-3xl font-black text-[#29252B] font-mono">
                ¥{(totalTargetBudget * partySize).toLocaleString()}
              </span>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-[#5A525E]">Target per person:</span>
                <input
                  type="number"
                  step="5000"
                  value={totalTargetBudget}
                  onChange={(e) => setTotalTargetBudget(Math.max(5000, Number(e.target.value)))}
                  className="w-28 bg-[#FAF6F0] border border-[#EAE0D0] rounded-xl px-2.5 py-1 text-xs text-[#29252B] font-mono focus:outline-none focus:border-[#C66B4E]"
                />
              </div>
            </div>

            <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm">
              <span className="text-[11px] font-bold text-[#8A808F] uppercase tracking-wider block mb-1">
                Estimated Total Expenses
              </span>
              <span className="text-3xl font-black text-[#C66B4E] font-mono">
                ¥{totalEstimatedExpense.toLocaleString()}
              </span>
              <p className="text-xs text-[#5A525E] mt-3">
                Approx. ¥{Math.round(totalEstimatedExpense / partySize).toLocaleString()} per traveler.
              </p>
            </div>

            <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm">
              <span className="text-[11px] font-bold text-[#8A808F] uppercase tracking-wider block mb-1">
                Remaining Surplus
              </span>
              <span className={`text-3xl font-black font-mono ${remainingBudget >= 0 ? 'text-[#4F734E]' : 'text-rose-600'}`}>
                ¥{remainingBudget.toLocaleString()}
              </span>
              <p className="text-xs text-[#5A525E] mt-3">
                {remainingBudget >= 0 ? 'On track within your target financial plan.' : 'Exceeding target; consider free viewpoints.'}
              </p>
            </div>
          </div>

          {/* Category Expense Breakdown */}
          <div className="bg-white border border-[#EAE0D0] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#29252B] flex items-center justify-between">
              <span>Category Breakdown (Per Person Estimates)</span>
              <button
                onClick={() => onAskHana('Can you help me reduce my Mount Fuji travel expenses with free attractions and budget passes?')}
                className="text-xs font-bold text-[#C66B4E] hover:text-[#B2583D] flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Hana to optimize budget</span>
              </button>
            </h3>

            <div className="space-y-3">
              {budgetItems.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D0] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-[#29252B]">{item.category}</h4>
                      <p className="text-[11px] text-[#5A525E]">{item.notes}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#29252B] font-mono">¥{item.amount.toLocaleString()}</span>
                    <span className="text-[10px] text-[#8A808F] block">per traveler</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'wishlist' ? (
        /* Saved Wishlist */
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#29252B] flex items-center justify-between">
            <span>Saved Places for Next Trip</span>
            <span className="text-xs text-[#8A808F]">{wishlist.length} places saved</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishlist.map((id) => (
              <div key={id} className="p-4 rounded-2xl bg-white border border-[#EAE0D0] shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF5EE] text-[#4F734E] flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5 text-[#789477]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#29252B] capitalize">{id.replace(/_/g, ' ')}</h4>
                    <span className="text-[10px] text-[#789477] font-semibold">Verified Destination</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onAskHana(`Tell me about ${id.replace(/_/g, ' ')} and how to visit.`)}
                    className="p-1.5 text-[#5A525E] hover:text-[#C66B4E] rounded-lg hover:bg-[#FAF6F0] cursor-pointer"
                    title="Ask Hana"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveWishlist(id)}
                    className="p-1.5 text-[#8A808F] hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
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
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF6F0] text-[#29252B] text-xs font-bold border border-[#EAE0D0] transition-colors shadow-xs cursor-pointer"
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
            <h3 className="text-sm font-bold text-[#29252B] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C66B4E]" />
              <span>Essential Mount Fuji Travel Phrases (Offline Ready)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ESSENTIAL_PHRASES.map((phrase, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EAE0D0] space-y-1">
                  <span className="text-sm font-bold text-[#29252B] block">{phrase.ja}</span>
                  <span className="text-xs text-[#C66B4E] font-mono block">{phrase.romaji}</span>
                  <span className="text-xs text-[#5A525E] block">{phrase.en}</span>
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
            <h3 className="text-base font-bold text-[#29252B]">Scan to Open FujiNova Trip</h3>
            <div className="w-48 h-48 bg-[#FAF6F0] border border-[#EAE0D0] rounded-2xl mx-auto flex items-center justify-center p-3 shadow-inner">
              <QrCode className="w-36 h-36 text-[#29252B]" />
            </div>
            <p className="text-xs text-[#5A525E]">
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
