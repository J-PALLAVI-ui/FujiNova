import React, { createContext, useContext, useState } from 'react';

export type ExperienceMode = 'adult' | 'teen' | 'family';

interface ExperienceModeContextType {
  mode: ExperienceMode;
  setMode: (mode: ExperienceMode) => void;
  isAdultMode: boolean;
  isTeenMode: boolean;
  isFamilyMode: boolean;
  modeTitle: string;
  modeDescription: string;
  modeBadgeColor: string;
}

const ExperienceModeContext = createContext<ExperienceModeContextType | undefined>(undefined);

const MODE_METADATA = {
  adult: {
    title: 'Standard Explorer (Adult)',
    description: 'Comprehensive transit schedules, budget optimization, elevation profiles & full accessibility metrics.',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
  },
  teen: {
    title: 'Trendsetter (Teenager)',
    description: 'Vibrant modern aesthetics, photography ratings, viral viewspots, and quick cultural takeaways.',
    badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30'
  },
  family: {
    title: 'Family & Junior Explorer',
    description: 'Playful icons, child-safe trails, restroom proximity alerts, and interactive explorer badges.',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  }
};

export const ExperienceModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ExperienceMode>(() => {
    try {
      const saved = localStorage.getItem('fujinova_experience_mode') as ExperienceMode;
      if (saved && (saved === 'adult' || saved === 'teen' || saved === 'family')) {
        return saved;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'adult';
  });

  const setMode = (newMode: ExperienceMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('fujinova_experience_mode', newMode);
    } catch {
      // Ignore localStorage errors
    }
  };

  const meta = MODE_METADATA[mode];

  return (
    <ExperienceModeContext.Provider
      value={{
        mode,
        setMode,
        isAdultMode: mode === 'adult',
        isTeenMode: mode === 'teen',
        isFamilyMode: mode === 'family',
        modeTitle: meta.title,
        modeDescription: meta.description,
        modeBadgeColor: meta.badgeColor
      }}
    >
      {children}
    </ExperienceModeContext.Provider>
  );
};

export const useExperienceMode = (): ExperienceModeContextType => {
  const context = useContext(ExperienceModeContext);
  if (!context) {
    const meta = MODE_METADATA.adult;
    return {
      mode: 'adult',
      setMode: () => {},
      isAdultMode: true,
      isTeenMode: false,
      isFamilyMode: false,
      modeTitle: meta.title,
      modeDescription: meta.description,
      modeBadgeColor: meta.badgeColor
    };
  }
  return context;
};
