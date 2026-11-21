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
  version?: string;
}

export const FujiNovaLogo: React.FC<FujiNovaLogoProps> = ({
  variant = 'full-horizontal',
  className = '',
  size = 'md',
  showTagline = false,
  version = '8.0'
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

  // Official Sakura Garden Palette
  const vermilionColor = isMonochrome ? 'currentColor' : '#C66B4E';
  const sakuraColor = isMonochrome ? 'currentColor' : '#E9A5B5';
  const charcoalText = isMonochrome ? 'currentColor' : '#29252B';

  // Vector Symbol: Japanese Circular Emblem with Mount Fuji & Wrapping Sakura Blossom Cluster
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
        {/* Rich Plum / Vermilion Sun Emblem */}
        <linearGradient id="fnSakuraSun" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C66B4E" />
          <stop offset="50%" stopColor="#A84465" />
          <stop offset="100%" stopColor="#7E244D" />
        </linearGradient>

        {/* Mount Fuji Body Slope */}
        <linearGradient id="fnFujiBody" x1="50%" y1="35%" x2="50%" y2="90%">
          <stop offset="0%" stopColor="#3D3740" />
          <stop offset="100%" stopColor="#29252B" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="fnShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#29252B" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Outer Circular Seal Badge */}
      <circle 
        cx="50" 
        cy="50" 
        r="46" 
        fill={isMonochrome ? 'none' : 'url(#fnSakuraSun)'} 
        stroke={isMonochrome ? 'currentColor' : '#F7EFE5'} 
        strokeWidth={isMonochrome ? '3' : '2'}
        filter="url(#fnShadow)"
      />

      {/* Mount Fuji Silhouette Silhouette with White Snowcap */}
      <g>
        {/* Fuji Mountain Base */}
        <path
          d="M 18 80 C 32 75 42 55 47 42 L 53 42 C 58 55 68 75 82 80 C 72 82 28 82 18 80 Z"
          fill="url(#fnFujiBody)"
        />
        {/* Snowcap with distinctive scalloped edges */}
        <path
          d="M 47 42 L 53 42 C 55 48 57 53 59 56 L 56 57 L 54 53 L 52 58 L 50 54 L 48 58 L 46 54 L 44 57 L 41 56 C 43 53 45 48 47 42 Z"
          fill="#FFFFFF"
        />
      </g>

      {/* Stylized Sakura Blossom Cluster Wrapping around Left and Base */}
      {/* Blossom 1 (Top Left) */}
      <g transform="translate(18, 28) scale(0.24)">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <path
            key={i}
            d="M 0 0 C -12 -24 -24 -40 0 -50 C 24 -40 12 -24 0 0 Z"
            fill="#FFFFFF"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx="0" cy="0" r="7" fill={sakuraColor} />
      </g>

      {/* Blossom 2 (Mid Left) */}
      <g transform="translate(14, 52) scale(0.3)">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <path
            key={i}
            d="M 0 0 C -12 -24 -24 -40 0 -50 C 24 -40 12 -24 0 0 Z"
            fill="#FFFFFF"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx="0" cy="0" r="7" fill={vermilionColor} />
      </g>

      {/* Blossom 3 (Bottom Center) */}
      <g transform="translate(36, 75) scale(0.26)">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <path
            key={i}
            d="M 0 0 C -12 -24 -24 -40 0 -50 C 24 -40 12 -24 0 0 Z"
            fill="#FFFFFF"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx="0" cy="0" r="7" fill={sakuraColor} />
      </g>

      {/* Drifting Petal (Right) */}
      <path
        d="M 72 32 C 75 28 80 30 78 35 C 75 38 70 36 72 32 Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
    </svg>
  );

  // Variant: Just the emblem symbol
  if (variant === 'compact-symbol' || variant === 'favicon' || variant === 'square-icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderSymbol()}
      </div>
    );
  }

  // Variant: Full Horizontal with Logo typography and Japanese kanji
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderSymbol()}
      <div className="flex flex-col select-none">
        <div className="flex items-center gap-1.5">
          <span
            className="font-black tracking-tight leading-none text-ink-charcoal"
            style={{
              fontSize: size === 'sm' ? '1.15rem' : size === 'md' ? '1.45rem' : size === 'lg' ? '1.75rem' : '2.1rem',
              color: charcoalText
            }}
          >
            <span>Fuji</span>
            <span style={{ color: vermilionColor }}>Nova</span>
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-matcha-light text-matcha-green border border-matcha-border/40 hidden sm:inline-block">
            {version}
          </span>
        </div>
        {(showTagline || variant === 'full-horizontal') && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-charcoal-muted leading-tight mt-0.5">
            <span className="text-sakura-pink">🌸</span>
            <span>Mount Fuji & Five Lakes</span>
            <span className="text-charcoal-light font-normal hidden lg:inline">・ 富士山の旅</span>
          </div>
        )}
      </div>
    </div>
  );
};
