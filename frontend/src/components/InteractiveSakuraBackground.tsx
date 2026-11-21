import React, { useEffect, useRef, useState, useCallback } from 'react';

export type SeasonMode = 'spring' | 'summer' | 'autumn' | 'winter';

interface InteractiveSakuraBackgroundProps {
  activeTab?: string;
  reducedMotion?: boolean;
  season?: SeasonMode;
}

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  angle: number;
  angularSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  petalType: number; // 0, 1, 2 for slight variations
}

export const InteractiveSakuraBackground: React.FC<InteractiveSakuraBackgroundProps> = ({
  activeTab = 'discover',
  reducedMotion = false,
  season = 'spring'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const animFrameIdRef = useRef<number | null>(null);
  const petalsRef = useRef<Petal[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check system reduced motion
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } catch (_) {}
  }, []);

  const isMotionDisabled = reducedMotion || prefersReducedMotion;

  // Determine petal count & opacity by active tab
  const getTabConfig = useCallback(() => {
    switch (activeTab) {
      case 'twin':
        return { count: 0, opacity: 0.15, showFujiBackdrop: false };
      case 'hana':
        return { count: 18, opacity: 0.45, showFujiBackdrop: true };
      case 'discover':
        return { count: 36, opacity: 0.8, showFujiBackdrop: true };
      case 'journey':
      case 'mytravel':
      case 'intelligence':
      case 'settings':
      default:
        return { count: 22, opacity: 0.6, showFujiBackdrop: true };
    }
  }, [activeTab]);

  // Handle Mouse movement for interactive breeze
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePosRef.current = { x: -1000, y: -1000 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const { count, opacity: tabOpacity } = getTabConfig();

    // Initialize petals
    const petals: Petal[] = [];
    for (let i = 0; i < count; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 7 + Math.random() * 8,
        speedY: 0.5 + Math.random() * 0.8,
        speedX: -0.3 + Math.random() * 0.7,
        angle: Math.random() * 360,
        angularSpeed: (Math.random() - 0.5) * 1.1,
        flip: Math.random() * Math.PI,
        flipSpeed: 0.02 + Math.random() * 0.03,
        opacity: (0.45 + Math.random() * 0.5) * tabOpacity,
        petalType: Math.floor(Math.random() * 3)
      });
    }
    petalsRef.current = petals;

    // Draw individual botanical petal / leaf based on season
    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.scale(1, Math.cos(p.flip));

      ctx.beginPath();
      const r = p.size;

      if (season === 'winter') {
        // Crystalline snow dust
        ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.9})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 4;
        ctx.fill();
      } else if (season === 'summer') {
        // Matcha green fresh tea leaf
        ctx.moveTo(0, -r);
        ctx.bezierCurveTo(r * 0.7, -r * 0.5, r * 0.7, r * 0.5, 0, r);
        ctx.bezierCurveTo(-r * 0.7, r * 0.5, -r * 0.7, -r * 0.5, 0, -r);
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
        grad.addColorStop(0, `rgba(217, 230, 215, ${p.opacity})`);
        grad.addColorStop(0.7, `rgba(120, 148, 119, ${p.opacity * 0.9})`);
        grad.addColorStop(1, `rgba(95, 124, 94, ${p.opacity * 0.85})`);
        ctx.fillStyle = grad;
        ctx.fill();
      } else if (season === 'autumn') {
        // Golden maple momiji leaf
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.4, -r * 0.3);
        ctx.lineTo(r * 0.8, -r * 0.1);
        ctx.lineTo(r * 0.3, r * 0.3);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.3, r * 0.3);
        ctx.lineTo(-r * 0.8, -r * 0.1);
        ctx.lineTo(-r * 0.4, -r * 0.3);
        ctx.closePath();
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
        grad.addColorStop(0, `rgba(251, 191, 36, ${p.opacity})`);
        grad.addColorStop(0.6, `rgba(217, 119, 6, ${p.opacity * 0.95})`);
        grad.addColorStop(1, `rgba(198, 107, 78, ${p.opacity * 0.85})`);
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        // Default Spring Sakura cherry blossom petal
        ctx.moveTo(0, -r);
        ctx.bezierCurveTo(r * 0.7, -r * 0.8, r * 0.8, r * 0.3, 0, r);
        ctx.bezierCurveTo(-r * 0.8, r * 0.3, -r * 0.7, -r * 0.8, 0, -r);

        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
        grad.addColorStop(0, `rgba(255, 245, 248, ${p.opacity * 1.1})`);
        grad.addColorStop(0.6, `rgba(233, 165, 181, ${p.opacity})`);
        grad.addColorStop(1, `rgba(220, 126, 148, ${p.opacity * 0.9})`);

        ctx.fillStyle = grad;
        ctx.fill();

        // Subtle center vein
        ctx.strokeStyle = `rgba(199, 90, 116, ${p.opacity * 0.35})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(0, r * 0.3);
        ctx.stroke();
      }

      ctx.restore();
    };

    let animationTime = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (count > 0 && !isMotionDisabled) {
        animationTime += 0.015;
        const mouse = mousePosRef.current;

        for (let i = 0; i < petals.length; i++) {
          const p = petals[i];

          // Natural swaying motion
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(animationTime + i) * 0.4;
          p.angle += p.angularSpeed;
          p.flip += p.flipSpeed;

          // Interactive mouse deflection breeze
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130 && dist > 0) {
            const force = (130 - dist) / 130;
            p.x += (dx / dist) * force * 3.5;
            p.y += (dy / dist) * force * 2.5;
          }

          // Screen wrap-around
          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;

          drawPetal(p);
        }
      } else if (count > 0 && isMotionDisabled) {
        petals.slice(0, 10).forEach(drawPetal);
      }

      if (!isMotionDisabled && count > 0) {
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    if (!isMotionDisabled && count > 0) {
      animFrameIdRef.current = requestAnimationFrame(render);
    } else {
      render();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [activeTab, isMotionDisabled, getTabConfig, season]);

  const { showFujiBackdrop } = getTabConfig();

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Warm Ivory Japanese Sakura Garden Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7EFE5] via-[#FAF3EC] to-[#F3E7D9] transition-colors duration-700" />

      {/* 2. Soft Ambient Sakura & Matcha Garden Accents */}
      <div className="absolute -top-20 -right-20 w-[650px] h-[550px] bg-radial from-[#E9A5B5]/20 via-[#B99BCB]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-[700px] h-[450px] bg-radial from-[#789477]/15 via-[#C66B4E]/10 to-transparent blur-3xl pointer-events-none" />

      {/* 3. Mount Fuji & Lake Kawaguchiko Silhouette (Authentic Japanese Woodblock aesthetic) */}
      {showFujiBackdrop && (
        <svg
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1920px] h-[320px] md:h-[440px] opacity-35 transition-opacity duration-700 pointer-events-none"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="sakuraFujiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C66B4E" stopOpacity="0.35" />
              <stop offset="40%" stopColor="#789477" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#29252B" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="sakuraSnowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#FDF2F4" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#E9A5B5" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="sakuraLakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B99BCB" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F7EFE5" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Mount Fuji Outer Symmetrical Cone */}
          <path
            d="M 280 400 C 440 370 570 240 680 90 L 760 90 C 870 240 1000 370 1160 400 Z"
            fill="url(#sakuraFujiGrad)"
          />

          {/* Snowcap on Mount Fuji with jagged ridgelines */}
          <path
            d="M 680 90 L 760 90 C 785 130 810 165 825 185 L 810 190 L 785 160 L 765 195 L 740 170 L 720 200 L 700 170 L 685 190 L 665 165 Z"
            fill="url(#sakuraSnowGrad)"
          />

          {/* Distant Foothills and Lake Kawaguchiko Water Reflection */}
          <path
            d="M 0 350 Q 360 330 720 345 T 1440 350 L 1440 400 L 0 400 Z"
            fill="url(#sakuraLakeGrad)"
          />
        </svg>
      )}

      {/* 4. Falling Petals Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-none" />
    </div>
  );
};
