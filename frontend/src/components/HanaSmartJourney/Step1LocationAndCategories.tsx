import React, { useState } from 'react';

interface Step1Props {
  onSelectOrigin: (name: string, lat: number, lon: number) => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenManualSearch: () => void;
  selectedOriginName?: string;
}

export const Step1LocationAndCategories: React.FC<Step1Props> = ({
  onSelectOrigin,
  onSelectCategory,
  onOpenManualSearch,
  selectedOriginName = 'Kawaguchiko Station'
}) => {
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    setIsDetectingLocation(true);
    setGpsMessage('Detecting your GPS location...');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const resp = await fetch(`/api/v1/journey/locations/nearby?lat=${lat}&lon=${lon}`);
            if (resp.ok) {
              const data = await resp.json();
              const detected = data.detected_location_name || 'Nearby Station';
              setGpsMessage(`Detected: ${detected}`);
              onSelectOrigin(detected, lat, lon);
            } else {
              // Fallback to Kawaguchiko station default coordinates
              onSelectOrigin('Kawaguchiko Station (GPS Approximate)', 35.4983, 138.7692);
              setGpsMessage('Detected near Kawaguchiko Station');
            }
          } catch (e) {
            onSelectOrigin('Kawaguchiko Station (Detected)', 35.4983, 138.7692);
            setGpsMessage('Detected: Kawaguchiko Station');
          } finally {
            setIsDetectingLocation(false);
          }
        },
        () => {
          // If user denies or error, gracefully fallback with polite notification
          onSelectOrigin('Kawaguchiko Station (Default)', 35.4983, 138.7692);
          setGpsMessage('Using Kawaguchiko Station as starting point');
          setIsDetectingLocation(false);
        },
        { timeout: 7000 }
      );
    } else {
      onSelectOrigin('Kawaguchiko Station', 35.4983, 138.7692);
      setGpsMessage('Using Kawaguchiko Station');
      setIsDetectingLocation(false);
    }
  };

  const categories = [
    {
      id: 'places_to_visit',
      title: 'Places to Visit',
      image: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=300&auto=format&fit=crop&q=80',
      badge: 'Attractions'
    },
    {
      id: 'railway_stations',
      title: 'Railway Stations',
      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&auto=format&fit=crop&q=80',
      badge: 'FJ01–FJ18'
    },
    {
      id: 'bus_stops',
      title: 'Bus Stops & Routes',
      image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&auto=format&fit=crop&q=80',
      badge: 'Red/Green/Blue'
    },
    {
      id: 'hotels_and_stays',
      title: 'Hotels & Stays',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=300&auto=format&fit=crop&q=80',
      badge: 'Ryokan & Stays'
    },
    {
      id: 'food_and_cafes',
      title: 'Food & Cafés',
      image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=300&auto=format&fit=crop&q=80',
      badge: 'Houtou & Udon'
    },
    {
      id: 'entertainment_activities',
      title: 'Entertainment & Activities',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&auto=format&fit=crop&q=80',
      badge: 'Fuji-Q & Parks'
    },
    {
      id: 'essential_services',
      title: 'Essential Services',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&auto=format&fit=crop&q=80',
      badge: '24h Clinics & ATMs'
    },
    {
      id: 'airports_connections',
      title: 'Airports & Connections',
      image: 'https://images.unsplash.com/photo-1534270804882-6b5eb4327658?w=300&auto=format&fit=crop&q=80',
      badge: 'Tokyo Coaches'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#FCF8F5] text-[#29252B] rounded-2xl shadow-md border border-[#E8D9CD] overflow-hidden select-none max-w-sm w-full mx-auto">
      {/* Top App Header */}
      <div className="bg-[#FFF4EC] px-4 py-2.5 flex items-center justify-between border-b border-[#EBDCD0]">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🌸</span>
          <span className="font-bold text-xs tracking-tight text-[#29252B]">FujiNova 11.0</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7A6C76]">
          <span className="cursor-pointer hover:text-[#C66B4E]">🔔</span>
          <div className="w-5 h-5 rounded-full bg-[#E9A5B5] text-[10px] text-white font-bold flex items-center justify-center">
            H
          </div>
        </div>
      </div>

      {/* Scrollable Screen Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Mount Fuji Scenic Hero Card */}
        <div className="relative rounded-xl overflow-hidden shadow-xs border border-[#E7D6CA] h-28 bg-[#FFF4EE] flex flex-col justify-end p-2.5">
          <img
            src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80"
            alt="Mount Fuji with Cherry Blossoms"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.92]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="relative z-10 text-white">
            <h2 className="font-bold text-base leading-tight drop-shadow-xs">Hana Smart Journey</h2>
            <p className="text-[10px] text-white/90 drop-shadow-xs">Plan · Check Crowd · Travel · Explore</p>
          </div>
        </div>

        {/* Hana Speech Bubble */}
        <div className="flex items-start gap-2 bg-[#FFF0F4] border border-[#FAD6DF] p-2.5 rounded-xl shadow-2xs">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E9A5B5] shrink-0 bg-white">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
              alt="Hana"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-[11px] leading-snug">
            <p className="font-semibold text-[#A83F70]">こんにちは！ I'm Hana 🌸</p>
            <p className="text-[#403944]">Where are you starting your journey?</p>
            {selectedOriginName && (
              <span className="inline-block mt-1 text-[9px] bg-white px-2 py-0.5 rounded-full border border-[#F2CAD6] text-[#A83F70] font-medium">
                Active: {selectedOriginName}
              </span>
            )}
            {gpsMessage && <p className="text-[9px] text-[#789477] font-medium mt-0.5">{gpsMessage}</p>}
          </div>
        </div>

        {/* Action 1: Use Current Location */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={isDetectingLocation}
          className="w-full py-2 px-3 rounded-xl bg-[#C66B4E] hover:bg-[#B3583C] text-white text-left flex items-center justify-between shadow-xs transition-colors group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
              🎯
            </div>
            <div>
              <p className="font-bold text-xs leading-tight">Use My Current Location</p>
              <p className="text-[10px] text-white/80 leading-tight">Get nearby stations, stops and places</p>
            </div>
          </div>
          <span className="text-xs group-hover:translate-x-0.5 transition-transform">›</span>
        </button>

        {/* Action 2: Select Location Manually */}
        <button
          onClick={onOpenManualSearch}
          className="w-full py-2 px-3 rounded-xl bg-white border border-[#EAD7C8] hover:border-[#C66B4E] text-[#29252B] text-left flex items-center justify-between shadow-2xs transition-colors group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#FFF0E8] flex items-center justify-center text-xs text-[#C66B4E]">
              📍
            </div>
            <div>
              <p className="font-bold text-xs leading-tight">Select My Location Manually</p>
              <p className="text-[10px] text-[#7A6C76] leading-tight">Search stations, bus stops, hotels or landmarks</p>
            </div>
          </div>
          <span className="text-xs text-[#7A6C76] group-hover:translate-x-0.5 transition-transform">›</span>
        </button>

        {/* Section: Explore by Category */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#29252B]">
              <span className="text-sm">🌸</span>
              <span>Explore by Category</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative rounded-lg overflow-hidden border border-[#EAD9CF] bg-white shadow-2xs hover:shadow-xs transition-all cursor-pointer h-20 flex flex-col justify-end p-1.5"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative z-10 text-white">
                  <span className="text-[8px] bg-[#C66B4E]/80 px-1.5 py-0.5 rounded-full text-white font-medium inline-block mb-0.5">
                    {cat.badge}
                  </span>
                  <p className="font-bold text-[11px] leading-tight">{cat.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Bottom Tab Navigation */}
      <div className="bg-[#FFF4EC] border-t border-[#EBDCD0] px-3 py-1.5 flex items-center justify-around text-[10px] text-[#7A6C76]">
        <div className="flex flex-col items-center cursor-pointer">
          <span>🏠</span>
          <span>Home</span>
        </div>
        <div className="flex flex-col items-center text-[#C66B4E] font-bold cursor-pointer">
          <span>🚆</span>
          <span>Journey</span>
        </div>
        <div className="flex flex-col items-center cursor-pointer">
          <span>🗺️</span>
          <span>Map</span>
        </div>
        <div className="flex flex-col items-center cursor-pointer">
          <span>✨</span>
          <span>Discover</span>
        </div>
        <div className="flex flex-col items-center cursor-pointer">
          <span>🌸</span>
          <span>Hana</span>
        </div>
      </div>

      {/* Step Indicator Footer */}
      <div className="bg-[#FAF0E6] border-t border-[#E8D7CA] px-3 py-2 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C66B4E]">
          <span className="w-4 h-4 rounded-full bg-[#C66B4E] text-white text-[10px] flex items-center justify-center font-bold">1</span>
          <span>Choose Your Starting Point</span>
        </div>
        <p className="text-[10px] text-[#7A6C76]">Select your location and explore by category</p>
      </div>
    </div>
  );
};
