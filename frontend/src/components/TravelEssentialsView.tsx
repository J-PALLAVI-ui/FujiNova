import React, { useState, useEffect } from 'react';
import { EssentialService, EmergencyHotline, BusinessListing } from '../types';
import { apiUrl } from '../config';
import { useExperienceMode } from '../context/ExperienceModeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  PhoneCall, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  Globe
} from 'lucide-react';

export const TravelEssentialsView: React.FC = () => {
  const { t } = useTranslation();
  const { isTeenMode, isFamilyMode } = useExperienceMode();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [services, setServices] = useState<EssentialService[]>([]);
  const [hotlines, setHotlines] = useState<EmergencyHotline[]>([]);
  const [businesses, setBusinesses] = useState<BusinessListing[]>([]);
  const [activeTab, setActiveTab] = useState<'essentials' | 'businesses' | 'emergency'>('essentials');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resServices, resEmerg, resBiz] = await Promise.all([
          fetch(apiUrl('/api/v1/essentials')),
          fetch(apiUrl('/api/v1/essentials/emergency')),
          fetch(apiUrl('/api/v1/businesses'))
        ]);
        if (resServices.ok) setServices(await resServices.json());
        if (resEmerg.ok) {
          const emergData = await resEmerg.json();
          setHotlines(emergData.hotlines || []);
        }
        if (resBiz.ok) setBusinesses(await resBiz.json());
      } catch (err) {
        console.error('Failed to load essentials:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = [
    { id: 'all', label: 'All Services', labelJa: 'すべて' },
    { id: 'hospital', label: 'Hospitals & Clinics', labelJa: '病院・救急' },
    { id: 'pharmacy', label: 'Pharmacies', labelJa: '薬局' },
    { id: 'convenience_store', label: '24/7 Konbini', labelJa: 'コンビニ' },
    { id: 'atm', label: 'Global ATMs', labelJa: 'ATM' },
    { id: 'toilet', label: 'Accessible Restrooms', labelJa: '多目的トイレ' },
    { id: 'train_station', label: 'Stations & Transit', labelJa: '駅・交通' },
    { id: 'restaurant', label: 'Regional Dining', labelJa: '郷土料理・飲食店' }
  ];

  const filteredServices = services.filter((s) => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory;
    const matchQ = !searchQuery || 
      s.name_en.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.name_ja.includes(searchQuery) ||
      (s.address_en && s.address_en.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQ;
  });

  const filteredBusinesses = businesses.filter((b) => {
    return !searchQuery || 
      b.name_en.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.name_ja.includes(searchQuery);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-6 md:p-8 rounded-3xl bg-white border shadow-sm ${
        isFamilyMode ? 'border-[#C8E6C9]' : isTeenMode ? 'border-[#FFD0DD]' : 'border-[#E5DDD2]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FAF6F0] text-[#C66B4E] border border-[#E5DDD2]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#C66B4E]" />
              <span>{t('essentials_badge', 'Real-World Tourist Support')}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#29232B]">
              {t('essentials_title', 'Travel Essentials & Regional Directory')}
            </h1>
            <p className="text-sm text-[#403944] max-w-2xl leading-relaxed">
              {t('essentials_subtitle', 'Verified hospitals with English-speaking staff, 24/7 convenience stores with international ATMs, barrier-free restrooms, emergency services, and authenticated local businesses around Mount Fuji and Lake Kawaguchi.')}
            </p>
          </div>

          {/* Quick Emergency Hotlines Card */}
          <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#E5DDD2] space-y-2 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#29232B] uppercase tracking-wide">Emergency Call (Japan)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32]">Free Dial</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white border border-[#E5DDD2] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#29232B]">Police (警察)</div>
                  <div className="text-[10px] text-[#625966]">Theft / Accidents</div>
                </div>
                <span className="font-extrabold text-base text-[#C66B4E]">110</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#E5DDD2] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#29232B]">Ambulance (救急)</div>
                  <div className="text-[10px] text-[#625966]">Medical / Fire</div>
                </div>
                <span className="font-extrabold text-base text-[#C66B4E]">119</span>
              </div>
            </div>
            <div className="text-[11px] text-[#625966] text-center pt-1">
              JNTO Visitor Helpline: <span className="font-mono font-bold text-[#29232B]">050-3816-2720</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs: Essentials, Businesses, Emergency Details */}
      <div className="flex items-center gap-2 border-b border-[#E5DDD2] pb-3">
        <button
          onClick={() => setActiveTab('essentials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'essentials'
              ? 'bg-[#29232B] text-white shadow-xs'
              : 'text-[#403944] hover:bg-white'
          }`}
        >
          {t('tab_essentials', 'Essential Facilities & Medical')}
        </button>
        <button
          onClick={() => setActiveTab('businesses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'businesses'
              ? 'bg-[#29232B] text-white shadow-xs'
              : 'text-[#403944] hover:bg-white'
          }`}
        >
          {t('tab_businesses', 'Local Ryokans, Rentals & Tours')}
        </button>
        <button
          onClick={() => setActiveTab('emergency')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'emergency'
              ? 'bg-[#29232B] text-white shadow-xs'
              : 'text-[#403944] hover:bg-white'
          }`}
        >
          {t('tab_emergency', 'Emergency Hotline Directory')}
        </button>
      </div>

      {/* Search & Filter Bar */}
      {activeTab !== 'emergency' && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#625966]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, address, or station..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5DDD2] text-xs text-[#29232B] placeholder-[#625966] focus:outline-hidden focus:border-[#C66B4E]"
            />
          </div>

          {activeTab === 'essentials' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <Filter className="w-3.5 h-3.5 text-[#625966] shrink-0 mr-1" />
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === c.id
                      ? 'bg-[#C66B4E] text-white font-bold shadow-xs'
                      : 'bg-white text-[#403944] hover:bg-[#FAF6F0] border border-[#E5DDD2]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      {loading ? (
        <div className="py-20 text-center text-[#403944] text-sm animate-pulse">
          Loading verified regional directory data...
        </div>
      ) : activeTab === 'essentials' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((s) => (
            <div
              key={s.service_id}
              className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                isFamilyMode ? 'border-[#C8E6C9]' : isTeenMode ? 'border-[#FFD0DD]' : 'border-[#E5DDD2]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6F0] text-[#403944] border border-[#E5DDD2] capitalize">
                    {s.category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1">
                    {s.is_24_hours === 1 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                        24/7
                      </span>
                    )}
                    {s.has_english_support === 1 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDE7F6] text-[#512DA8]">
                        English OK
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#29232B] line-clamp-1">{s.name_en}</h3>
                  <p className="text-xs text-[#625966]">{s.name_ja}</p>
                </div>

                <div className="space-y-1.5 text-xs text-[#403944]">
                  {s.opening_hours && (
                    <div className="flex items-start gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#625966] shrink-0 mt-0.5" />
                      <span className="text-[11px]">{s.opening_hours}</span>
                    </div>
                  )}
                  {s.address_en && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#625966] shrink-0 mt-0.5" />
                      <span className="text-[11px]">{s.address_en}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-[#C66B4E] shrink-0" />
                      <a href={`tel:${s.phone}`} className="text-[11px] font-bold text-[#87365E] hover:underline">
                        {s.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5DDD2] flex items-center justify-between text-[10px] text-[#625966]">
                <span>Source: {s.source}</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#4CAF50]" />
                  Verified {s.last_verified_date}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'businesses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBusinesses.map((b) => (
            <div
              key={b.business_id}
              className="p-5 rounded-2xl bg-white border border-[#E5DDD2] shadow-xs hover:shadow-md flex flex-col justify-between transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6F0] text-[#403944] border border-[#E5DDD2] capitalize">
                    {b.category.replace('_', ' ')}
                  </span>
                  {b.verified_partner === 1 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF3E0] text-[#E65100]">
                      Verified Partner
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#29232B]">{b.name_en}</h3>
                  <p className="text-xs text-[#625966]">{b.name_ja}</p>
                </div>

                <div className="space-y-1.5 text-xs text-[#403944]">
                  {b.operating_hours && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#625966] shrink-0" />
                      <span className="text-[11px]">{b.operating_hours}</span>
                    </div>
                  )}
                  {b.price_range_jpy && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[11px] text-[#C66B4E]">Price:</span>
                      <span className="text-[11px]">{b.price_range_jpy}</span>
                    </div>
                  )}
                  {b.address_en && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#625966] shrink-0 mt-0.5" />
                      <span className="text-[11px]">{b.address_en}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5DDD2] flex items-center justify-between text-xs">
                {b.official_website ? (
                  <a
                    href={b.official_website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#87365E] hover:underline font-bold"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Official Website</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-[#625966]">Verified Regional Partner</span>
                )}
                {b.phone && (
                  <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1 text-[#C66B4E] font-bold">
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Emergency Directory Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hotlines.map((h, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-[#E5DDD2] shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-[#29232B]">{h.title_en}</h3>
                  <p className="text-xs text-[#625966]">{h.title_ja}</p>
                </div>
                <a
                  href={`tel:${h.number.replace(/[^0-9]/g, '')}`}
                  className="px-4 py-2 rounded-xl bg-[#FAF6F0] hover:bg-[#C66B4E] text-[#C66B4E] hover:text-white border border-[#E5DDD2] transition-colors font-mono font-extrabold text-base flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{h.number}</span>
                </a>
              </div>
              <p className="text-xs text-[#403944] leading-relaxed">
                {h.description_en}
              </p>
              <div className="pt-2 border-t border-[#E5DDD2] flex items-center gap-1 text-[11px] text-[#625966]">
                <span className="font-medium">Languages:</span>
                <span>{h.available_languages.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
