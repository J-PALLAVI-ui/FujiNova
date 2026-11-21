import React, { createContext, useContext, useState } from 'react';

export type ExperienceMode = 'adult' | 'teen' | 'family';

export interface ExperienceTheme {
  name: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  secondaryAccent: string;
  badgeColor: string;
  cardRadius: string;
  cardBorder: string;
  surfaceBg: string;
  bannerGradient: string;
  ctaButton: string;
  tagStyle: string;
  iconName: 'compass' | 'sparkles' | 'smile';
  hanaGreeting: string;
  hanaTone: string;
}

interface ExperienceModeContextType {
  mode: ExperienceMode;
  setMode: (mode: ExperienceMode) => void;
  isAdultMode: boolean;
  isTeenMode: boolean;
  isFamilyMode: boolean;
  modeTitle: string;
  modeDescription: string;
  modeBadgeColor: string;
  theme: ExperienceTheme;
}

const ExperienceModeContext = createContext<ExperienceModeContextType | undefined>(undefined);

export const MODE_CONFIGS: Record<ExperienceMode, ExperienceTheme> = {
  adult: {
    name: 'adult',
    title: 'Standard Explorer (Adult)',
    subtitle: 'Refined Japanese Travel Journal',
    description: 'Comprehensive transit schedules, budget optimization, elevation profiles & full accessibility metrics.',
    accentColor: '#C66B4E',
    secondaryAccent: '#87365E',
    badgeColor: 'bg-[#C66B4E]/10 text-[#C66B4E] border-[#C66B4E]/30',
    cardRadius: 'rounded-xl',
    cardBorder: 'border-[#E5DDD2]',
    surfaceBg: 'bg-[#FAF6F0]',
    bannerGradient: 'bg-[#FAF6F0]',
    ctaButton: 'bg-[#C66B4E] hover:bg-[#B2583D] text-white shadow-xs',
    tagStyle: 'px-2 py-0.5 rounded-lg bg-[#FAF6F0] border border-[#E5DDD2] text-[#403944] font-medium text-xs',
    iconName: 'compass',
    hanaGreeting: 'Konnichiwa. I am Hana, your Mount Fuji research companion. How may I assist your travel planning today?',
    hanaTone: 'Professional, structured, editorial'
  },
  teen: {
    name: 'teen',
    title: 'Trendsetter (Teenager)',
    subtitle: 'Modern Sakura Pop & Photo Spots',
    description: 'Vibrant modern aesthetics, photography ratings, viral viewspots, and quick cultural takeaways.',
    accentColor: '#FF5C8A',
    secondaryAccent: '#9A2B64',
    badgeColor: 'bg-[#FF5C8A]/10 text-[#FF5C8A] border-[#FF5C8A]/30',
    cardRadius: 'rounded-2xl',
    cardBorder: 'border-[#FFD0DD]',
    surfaceBg: 'bg-[#FFF0F4]',
    bannerGradient: 'bg-gradient-to-br from-[#FFF0F4] via-[#FFEBF1] to-[#FFF5E6]',
    ctaButton: 'bg-gradient-to-r from-[#FF5C8A] to-[#FF8E53] hover:from-[#E64977] hover:to-[#E67A42] text-white shadow-md font-bold',
    tagStyle: 'px-2.5 py-0.5 rounded-full bg-[#FFEBF1] border border-[#FFD0DD] text-[#9A2B64] font-bold text-xs',
    iconName: 'sparkles',
    hanaGreeting: 'Hey! ✨ Ready to capture the most aesthetic Mount Fuji spots and viral views?',
    hanaTone: 'Energetic, visual, photo-focused'
  },
  family: {
    name: 'family',
    title: 'Family & Junior Explorer',
    subtitle: 'Playful Mount Fuji Adventure Map',
    description: 'Playful icons, child-safe trails, restroom proximity alerts, and interactive explorer badges.',
    accentColor: '#4CAF50',
    secondaryAccent: '#FF9800',
    badgeColor: 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/30',
    cardRadius: 'rounded-3xl',
    cardBorder: 'border-[#C8E6C9]',
    surfaceBg: 'bg-[#F1F8E9]',
    bannerGradient: 'bg-gradient-to-br from-[#F1F8E9] via-[#FFF9C4] to-[#EDE7F6]',
    ctaButton: 'bg-[#4CAF50] hover:bg-[#43A047] text-white shadow-md font-extrabold text-sm',
    tagStyle: 'px-3 py-1 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] font-bold text-xs',
    iconName: 'smile',
    hanaGreeting: 'Konnichiwa! 🌸 Welcome to Mount Fuji Junior Adventures! Let’s find fun places together!',
    hanaTone: 'Friendly, encouraging, child-safe'
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

  const theme = MODE_CONFIGS[mode];

  return (
    <ExperienceModeContext.Provider
      value={{
        mode,
        setMode,
        isAdultMode: mode === 'adult',
        isTeenMode: mode === 'teen',
        isFamilyMode: mode === 'family',
        modeTitle: theme.title,
        modeDescription: theme.description,
        modeBadgeColor: theme.badgeColor,
        theme
      }}
    >
      {children}
    </ExperienceModeContext.Provider>
  );
};

export const useExperienceMode = (): ExperienceModeContextType => {
  const context = useContext(ExperienceModeContext);
  if (!context) {
    const theme = MODE_CONFIGS.adult;
    return {
      mode: 'adult',
      setMode: () => {},
      isAdultMode: true,
      isTeenMode: false,
      isFamilyMode: false,
      modeTitle: theme.title,
      modeDescription: theme.description,
      modeBadgeColor: theme.badgeColor,
      theme
    };
  }
  return context;
};
