import React, { useState, useEffect } from 'react';
import { SmartJourneyBanner } from './SmartJourneyBanner';
import { SmartJourneyFooter } from './SmartJourneyFooter';
import { Step1LocationAndCategories } from './Step1LocationAndCategories';
import { Step2CrowdAndChoices } from './Step2CrowdAndChoices';
import { Step3StationGuide } from './Step3StationGuide';
import { Step4DetailedJourney } from './Step4DetailedJourney';

interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
}

export const HanaSmartJourneyView: React.FC = () => {
  const [activeStepMobile, setActiveStepMobile] = useState<1 | 2 | 3 | 4>(1);
  const [selectedOrigin, setSelectedOrigin] = useState('Kawaguchiko Station');
  const [selectedDestination, setSelectedDestination] = useState('Chureito Pagoda');
  const [_selectedOriginCoords, setSelectedOriginCoords] = useState({ lat: 35.4983, lon: 138.7692 });
  
  // Manual search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Category view modal state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<any[]>([]);

  // Execute search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await fetch(`/api/v1/journey/locations/search?q=${encodeURIComponent(searchQuery)}`);
        if (resp.ok) {
          const data = await resp.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load category items when selected
  useEffect(() => {
    if (!selectedCategory) return;
    const fetchCategory = async () => {
      try {
        const resp = await fetch(`/api/v1/journey/categories/${selectedCategory}/items`);
        if (resp.ok) {
          const data = await resp.json();
          setCategoryItems(data);
        }
      } catch (err) {
        console.error('Category fetch error:', err);
      }
    };
    fetchCategory();
  }, [selectedCategory]);

  const handleSelectOrigin = (name: string, lat: number, lon: number) => {
    setSelectedOrigin(name);
    setSelectedOriginCoords({ lat, lon });
    setIsSearchOpen(false);
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleSelectCrowdChoice = (_choiceId: string, alternative?: any) => {
    if (alternative) {
      setSelectedDestination(alternative.name_en);
    }
    setActiveStepMobile(3);
  };

  return (
    <div className="min-h-screen bg-[#F7EFE5] text-[#29252B] flex flex-col justify-between selection:bg-[#E9A5B5] selection:text-[#29252B]">
      {/* 1. Master Top Banner */}
      <SmartJourneyBanner />

      {/* 2. Main Stage Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Mobile Step Navigator Strip */}
        <div className="flex xl:hidden items-center justify-between bg-white p-2 rounded-xl border border-[#EAD7C8] shadow-2xs">
          <span className="text-xs font-bold text-[#C66B4E]">Journey Step:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStepMobile(step as 1 | 2 | 3 | 4)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeStepMobile === step
                    ? 'bg-[#C66B4E] text-white shadow-xs'
                    : 'bg-[#FAF2EB] text-[#7A6C76] hover:bg-[#F2DECF]'
                }`}
              >
                Step {step}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Connected Screens (Desktop Side-by-Side or Mobile Active View) */}
        <div className="relative">
          {/* Desktop Grid Layout: Shows all 4 screens side by side with connecting arrows */}
          <div className="hidden xl:grid xl:grid-cols-4 gap-4 items-stretch">
            {/* Screen 1 */}
            <div className="relative flex flex-col">
              <Step1LocationAndCategories
                onSelectOrigin={handleSelectOrigin}
                onSelectCategory={handleSelectCategory}
                onOpenManualSearch={() => setIsSearchOpen(true)}
                selectedOriginName={selectedOrigin}
              />
              {/* Connector Arrow to Screen 2 */}
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[#E9A5B5] text-[#C66B4E] font-extrabold flex items-center justify-center text-sm shadow-xs border border-white">
                ›
              </div>
            </div>

            {/* Screen 2 */}
            <div className="relative flex flex-col">
              <Step2CrowdAndChoices
                destinationName={selectedDestination}
                onSelectChoice={handleSelectCrowdChoice}
                onProceedToTransport={() => setActiveStepMobile(3)}
              />
              {/* Connector Arrow to Screen 3 */}
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[#E9A5B5] text-[#C66B4E] font-extrabold flex items-center justify-center text-sm shadow-xs border border-white">
                ›
              </div>
            </div>

            {/* Screen 3 */}
            <div className="relative flex flex-col">
              <Step3StationGuide
                stationName={selectedOrigin.includes('Station') ? selectedOrigin : 'Kawaguchiko Station'}
                onProceedToJourneyPlan={() => setActiveStepMobile(4)}
              />
              {/* Connector Arrow to Screen 4 */}
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[#E9A5B5] text-[#C66B4E] font-extrabold flex items-center justify-center text-sm shadow-xs border border-white">
                ›
              </div>
            </div>

            {/* Screen 4 */}
            <div className="flex flex-col">
              <Step4DetailedJourney
                originName={selectedOrigin}
                destinationName={selectedDestination}
                onSaveTrip={() => alert('Journey saved to your My Travel itinerary! 🌸')}
              />
            </div>
          </div>

          {/* Tablet & Mobile Single Screen View */}
          <div className="xl:hidden flex justify-center">
            {activeStepMobile === 1 && (
              <Step1LocationAndCategories
                onSelectOrigin={handleSelectOrigin}
                onSelectCategory={handleSelectCategory}
                onOpenManualSearch={() => setIsSearchOpen(true)}
                selectedOriginName={selectedOrigin}
              />
            )}
            {activeStepMobile === 2 && (
              <Step2CrowdAndChoices
                destinationName={selectedDestination}
                onSelectChoice={handleSelectCrowdChoice}
                onProceedToTransport={() => setActiveStepMobile(3)}
                onBack={() => setActiveStepMobile(1)}
              />
            )}
            {activeStepMobile === 3 && (
              <Step3StationGuide
                stationName={selectedOrigin.includes('Station') ? selectedOrigin : 'Kawaguchiko Station'}
                onProceedToJourneyPlan={() => setActiveStepMobile(4)}
                onBack={() => setActiveStepMobile(2)}
              />
            )}
            {activeStepMobile === 4 && (
              <Step4DetailedJourney
                originName={selectedOrigin}
                destinationName={selectedDestination}
                onBack={() => setActiveStepMobile(3)}
                onSaveTrip={() => alert('Journey saved to your My Travel itinerary! 🌸')}
              />
            )}
          </div>
        </div>
      </main>

      {/* Manual Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFF9F5] max-w-md w-full rounded-2xl p-4 border border-[#EBDCD0] shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-2">
              <div className="flex items-center gap-1.5 font-bold text-sm text-[#29252B]">
                <span>📍</span>
                <span>Select Your Starting Point</span>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="w-6 h-6 rounded-full bg-gray-200 text-xs flex items-center justify-center font-bold text-gray-700 hover:bg-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search station, bus stop, hotel or landmark..."
                className="w-full px-3 py-2 text-xs bg-white border border-[#EAD7C8] rounded-xl focus:outline-hidden focus:border-[#C66B4E]"
                autoFocus
              />
              {isSearching && (
                <span className="absolute right-3 top-2.5 text-[10px] text-[#7A6C76]">Searching...</span>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectOrigin(item.title, item.latitude, item.longitude)}
                    className="p-2 bg-white rounded-lg border border-[#EAD7C8] hover:border-[#C66B4E] cursor-pointer flex items-center justify-between shadow-2xs group transition-colors"
                  >
                    <div>
                      <p className="font-bold text-xs text-[#29252B] leading-tight group-hover:text-[#C66B4E]">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-[#7A6C76]">{item.subtitle}</p>
                    </div>
                    <span className="text-xs text-[#7A6C76] group-hover:translate-x-0.5 transition-transform">›</span>
                  </div>
                ))
              ) : searchQuery ? (
                <p className="text-center text-xs text-[#7A6C76] py-4">No matching locations found.</p>
              ) : (
                <div className="text-[11px] text-[#7A6C76] space-y-1">
                  <p className="font-semibold text-[#29252B]">Popular Starting Points:</p>
                  <div
                    onClick={() => handleSelectOrigin('Kawaguchiko Station [FJ18]', 35.4983, 138.7692)}
                    className="p-1.5 bg-white rounded border border-[#EAD7C8] cursor-pointer hover:border-[#C66B4E]"
                  >
                    🚆 Kawaguchiko Station [FJ18]
                  </div>
                  <div
                    onClick={() => handleSelectOrigin('Fujisan Station [FJ16]', 35.4839, 138.7958)}
                    className="p-1.5 bg-white rounded border border-[#EAD7C8] cursor-pointer hover:border-[#C66B4E]"
                  >
                    🚆 Fujisan Station [FJ16]
                  </div>
                  <div
                    onClick={() => handleSelectOrigin('Otsuki Station [FJ01]', 35.6133, 138.9428)}
                    className="p-1.5 bg-white rounded border border-[#EAD7C8] cursor-pointer hover:border-[#C66B4E]"
                  >
                    🚆 Otsuki Station [FJ01]
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Items Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFF9F5] max-w-lg w-full rounded-2xl p-4 border border-[#EBDCD0] shadow-xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-2 shrink-0">
              <span className="font-bold text-sm text-[#C66B4E] uppercase tracking-wide">
                🌸 Category Destinations
              </span>
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-6 h-6 rounded-full bg-gray-200 text-xs flex items-center justify-center font-bold text-gray-700 hover:bg-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {categoryItems.map((item) => (
                <div
                  key={item.item_id}
                  onClick={() => {
                    setSelectedDestination(item.name_en);
                    setSelectedCategory(null);
                    setActiveStepMobile(2);
                  }}
                  className="bg-white p-2.5 rounded-xl border border-[#EAD7C8] hover:border-[#C66B4E] cursor-pointer shadow-2xs flex items-start gap-3 transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#EAD7C8] shrink-0">
                    <img src={item.image_url} alt={item.name_en} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-[#29252B] truncate">{item.name_en}</p>
                      <span className="text-[9px] bg-[#FFF0E8] text-[#C66B4E] px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge || item.crowd_level}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#7A6C76] italic">{item.name_ja}</p>
                    <p className="text-[10px] text-[#403944] line-clamp-2 mt-0.5">{item.description_en}</p>
                    <div className="flex items-center justify-between mt-1 text-[9px] text-[#7A6C76]">
                      <span>{item.municipality}</span>
                      <span className="text-[#C66B4E] font-bold">Check Crowd & Route →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Master Bottom Footer */}
      <SmartJourneyFooter />
    </div>
  );
};
