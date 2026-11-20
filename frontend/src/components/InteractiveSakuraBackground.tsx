import React, { useEffect, useRef, useState, useCallback } from 'react';

interface InteractiveSakuraBackgroundProps {
  activeTab?: string;
  reducedMotion?: boolean;
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
  reducedMotion = false
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
        return { count: 16, opacity: 0.35, showFujiBackdrop: true };
      case 'discover':
        return { count: 38, opacity: 0.75, showFujiBackdrop: true };
      case 'journey':
      case 'mytravel':
      case 'intelligence':
      case 'settings':
      default:
        return { count: 24, opacity: 0.55, showFujiBackdrop: true };
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
        speedY: 0.6 + Math.random() * 0.9,
        speedX: -0.4 + Math.random() * 0.8,
        angle: Math.random() * 360,
        angularSpeed: (Math.random() - 0.5) * 1.2,
        flip: Math.random() * Math.PI,
        flipSpeed: 0.02 + Math.random() * 0.03,
        opacity: (0.4 + Math.random() * 0.5) * tabOpacity,
        petalType: Math.floor(Math.random() * 3)
      });
    }
    petalsRef.current = petals;

    // Draw individual sakura petal
    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.scale(1, Math.cos(p.flip));

      ctx.beginPath();
      // Curved cherry blossom petal with subtle tip cleft
      const r = p.size;
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.7, -r * 0.8, r * 0.8, r * 0.3, 0, r);
      ctx.bezierCurveTo(-r * 0.8, r * 0.3, -r * 0.7, -r * 0.8, 0, -r);

      // Gradient color from soft white-pink to blush cherry
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
      grad.addColorStop(0, `rgba(255, 240, 245, ${p.opacity * 1.1})`);
      grad.addColorStop(0.6, `rgba(251, 207, 232, ${p.opacity})`);
      grad.addColorStop(1, `rgba(244, 114, 182, ${p.opacity * 0.85})`);

      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle center vein
      ctx.strokeStyle = `rgba(236, 72, 153, ${p.opacity * 0.4})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.4);
      ctx.stroke();

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

          // Interactive mouse breeze deflection
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120;
            p.x += (dx / dist) * force * 3;
            p.y += (dy / dist) * force * 2;
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
        // Render static petals if reduced motion is enabled
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
  }, [activeTab, isMotionDisabled, getTabConfig]);

  const { showFujiBackdrop } = getTabConfig();

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Deep Atmospheric Gradient Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0c1220] to-[#120f24] transition-colors duration-700" />

      {/* 2. Soft Ambient Sakura Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-radial from-pink-500/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[700px] h-[400px] bg-radial from-sky-500/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* 3. Mount Fuji & Lake Reflection Silhouette (SVG) */}
      {showFujiBackdrop && (
        <svg
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1920px] h-[360px] md:h-[480px] opacity-25 transition-opacity duration-700 pointer-events-none"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="fujiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="35%" stopColor="#1e293b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#e2e8f0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="lakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Mount Fuji Outer Symmetrical Cone */}
          <path
            d="M 280 400 C 440 370 570 240 680 90 L 760 90 C 870 240 1000 370 1160 400 Z"
            fill="url(#fujiGrad)"
          />

          {/* Snowcap on Mount Fuji with jagged ridgelines */}
          <path
            d="M 680 90 L 760 90 C 785 130 810 165 825 185 L 810 190 L 785 160 L 765 195 L 740 170 L 720 200 L 700 170 L 685 190 L 665 165 Z"
            fill="url(#snowGrad)"
          />

          {/* Distant Foothills and Lake Kawaguchiko Mirror Surface */}
          <path
            d="M 0 350 Q 360 330 720 345 T 1440 350 L 1440 400 L 0 400 Z"
            fill="url(#lakeGrad)"
          />
        </svg>
      )}

      {/* 4. Falling Petals Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-none" />
    </div>
  );
};
