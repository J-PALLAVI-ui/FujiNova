import React from 'react';

export type LogoVariant = 
  | 'full-horizontal' 
  | 'compact-symbol' 
  | 'square-icon' 
  | 'mobile' 
  | 'favicon'
  | 'light' 
  | 'dark' 
  | 'monochrome';

interface FujiNovaLogoProps {
  variant?: LogoVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export const FujiNovaLogo: React.FC<FujiNovaLogoProps> = ({
  variant = 'full-horizontal',
  className = '',
  size = 'md',
  showTagline = false
}) => {
  // Dimension mappings
  const heightMap = {
    sm: variant === 'full-horizontal' ? 28 : 24,
    md: variant === 'full-horizontal' ? 38 : 32,
    lg: variant === 'full-horizontal' ? 48 : 42,
    xl: variant === 'full-horizontal' ? 64 : 56
  };

  const currentHeight = heightMap[size];
  const isMonochrome = variant === 'monochrome';
  const isLightMode = variant === 'light';

  // Palette definitions
  const snowWhite = isMonochrome ? '#FFFFFF' : '#FFFFFF';
  const sakuraPink = isMonochrome ? 'currentColor' : '#F2A7C0';
  const blossomRose = isMonochrome ? 'currentColor' : '#D96C98';
  const goldPath = isMonochrome ? 'currentColor' : '#F59E0B';
  const textColor = isMonochrome 
    ? 'currentColor' 
    : isLightMode 
    ? '#17253F' 
    : '#FFFFFF';

  // Vector Symbol: Mount Fuji + Sakura Blossom + Travel Compass Arc
  const renderSymbol = () => (
    <svg
      viewBox="0 0 100 100"
      width={currentHeight}
      height={currentHeight}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 select-none overflow-visible"
      aria-label="FujiNova Mount Fuji and Sakura Emblem"
    >
      <defs>
        {/* Sky / Base Circular Glow */}
        <linearGradient id="fnSkyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2878B8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#17253F" stopOpacity="0.95" />
        </linearGradient>

        {/* Mount Fuji Body Gradient */}
        <linearGradient id="fnFujiSlope" x1="50%" y1="20%" x2="50%" y2="90%">
          <stop offset="0%" stopColor="#2A6496" />
          <stop offset="100%" stopColor="#17253F" />
        </linearGradient>

        {/* Sakura Petal Radial Gradient */}
        <radialGradient id="fnSakuraGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF1F5" />
          <stop offset="60%" stopColor="#F2A7C0" />
          <stop offset="100%" stopColor="#D96C98" />
        </radialGradient>

        {/* Travel Path Orbital Gradient */}
        <linearGradient id="fnPathGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9BD7EF" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#F2A7C0" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="fnShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Outer Circular Seal Badge */}
      <circle 
        cx="50" 
        cy="50" 
        r="46" 
        fill={isMonochrome ? 'none' : 'url(#fnSkyGlow)'} 
        stroke={isMonochrome ? 'currentColor' : '#9BD7EF'} 
        strokeWidth={isMonochrome ? '3' : '2'}
        strokeOpacity={isMonochrome ? '1' : '0.4'}
        filter="url(#fnShadow)"
      />

      {/* Rising Sun Disk / Golden Hour Aura */}
      {!isMonochrome && (
        <circle cx="50" cy="42" r="28" fill="#F2A7C0" fillOpacity="0.25" />
      )}

      {/* Mount Fuji Base & Flanks */}
      <path
        d="M14 82 C28 78 38 48 46 26 L54 26 C62 48 72 78 86 82 C74 85 26 85 14 82 Z"
        fill={isMonochrome ? '#333333' : 'url(#fnFujiSlope)'}
      />

      {/* Mount Fuji Snowcap with Iconic Volcanic Ridges */}
      <path
        d="M46 26 L54 26 C57 34 60 41 64 47 C61 45 58 48 56 46 C54 44 52 50 50 48 C48 46 45 50 43 46 C41 48 38 45 36 47 C40 41 43 34 46 26 Z"
        fill={snowWhite}
      />

      {/* Snowcap Shadow Accent */}
      {!isMonochrome && (
        <path
          d="M50 26 L54 26 C57 34 60 41 64 47 C61 45 58 48 56 46 C54 44 52 50 50 48 Z"
          fill="#9BD7EF"
          fillOpacity="0.4"
        />
      )}

      {/* Curved Exploration Path / Orbital Compass Arc */}
      <path
        d="M18 72 C32 86 68 86 84 66"
        stroke={goldPath}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="1 0"
        fill="none"
      />
      <circle cx="84" cy="66" r="3.5" fill="#F59E0B" />

      {/* Sakura Branch & Cherry Blossoms (Left Foreground) */}
      <g id="sakura-cluster" transform="translate(6, 18)">
        {/* Curved Cherry Branch */}
        <path
          d="M6 55 C12 40 18 32 30 24"
          stroke={isMonochrome ? 'currentColor' : '#8B5A3C'}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Main Five-Petal Cherry Blossom */}
        <g transform="translate(22, 24)">
          {/* 5 Petals with Heart Notches */}
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <path
              key={i}
              transform={`rotate(${angle})`}
              d="M0 -3 C-4 -8 -6 -13 -3 -15 C-1 -16 0 -13 0 -13 C0 -13 1 -16 3 -15 C6 -13 4 -8 0 -3 Z"
              fill={isMonochrome ? '#FFFFFF' : 'url(#fnSakuraGrad)'}
              stroke={isMonochrome ? 'currentColor' : blossomRose}
              strokeWidth="0.8"
            />
          ))}
          {/* Flower Center & Pistils */}
          <circle cx="0" cy="0" r="2.5" fill={isMonochrome ? 'currentColor' : '#F59E0B'} />
          <circle cx="0" cy="0" r="1.2" fill={isMonochrome ? '#FFFFFF' : '#FFFFFF'} />
        </g>

        {/* Small Accompanying Sakura Blossom */}
        <g transform="translate(10, 44) scale(0.65)">
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <path
              key={i}
              transform={`rotate(${angle})`}
              d="M0 -3 C-4 -8 -6 -13 -3 -15 C-1 -16 0 -13 0 -13 C0 -13 1 -16 3 -15 C6 -13 4 -8 0 -3 Z"
              fill={isMonochrome ? '#FFFFFF' : 'url(#fnSakuraGrad)'}
              stroke={isMonochrome ? 'currentColor' : blossomRose}
              strokeWidth="0.8"
            />
          ))}
          <circle cx="0" cy="0" r="2" fill="#F59E0B" />
        </g>

        {/* Drifting Petals in Spring Breeze */}
        <path
          d="M36 12 C38 8 42 7 44 9 C45 11 43 14 40 14 C37 14 35 13 36 12 Z"
          fill={sakuraPink}
          opacity="0.85"
        />
        <path
          d="M48 22 C50 19 53 19 54 21 C55 23 53 25 51 25 C49 25 47 23 48 22 Z"
          fill={sakuraPink}
          opacity="0.75"
        />
      </g>

      {/* Subtle 4-Point Compass Star (Upper Right) */}
      <g transform="translate(74, 26) scale(0.8)">
        <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill={goldPath} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
      </g>
    </svg>
  );

  // If compact symbol, square icon, or favicon, return symbol alone
  if (variant === 'compact-symbol' || variant === 'square-icon' || variant === 'favicon' || variant === 'mobile') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderSymbol()}
      </div>
    );
  }

  // Full Horizontal Logo with Modern Typography
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {renderSymbol()}
      <div className="flex flex-col">
        <div className="flex items-center leading-none tracking-tight">
          <span 
            className="font-black text-lg sm:text-xl tracking-tight"
            style={{ color: textColor }}
          >
            Fuji
          </span>
          <span 
            className="font-extrabold text-lg sm:text-xl tracking-tight"
            style={{ 
              color: isMonochrome ? textColor : '#F2A7C0',
              textShadow: isMonochrome ? 'none' : '0 0 12px rgba(242, 167, 192, 0.4)'
            }}
          >
            Nova
          </span>
          <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 tracking-widest uppercase">
            7.0
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400 mt-1">
            Discover • Explore • Experience
          </span>
        )}
      </div>
    </div>
  );
};
