import React, { useEffect, useRef } from 'react';
import {
  LogoAntigravity,
  LogoBluePrism,
  LogoChatGpt,
  LogoClaude,
  LogoCursor,
  LogoDjango,
  LogoDocker,
  LogoGitHub,
  LogoHtml5,
  LogoJavaScript,
  LogoLinux,
  LogoMachineLearning,
  LogoOpenVpn,
  LogoPostgres,
  LogoPostman,
  LogoPowerBi,
  LogoPython,
  LogoReact,
  LogoSql,
  LogoTableau,
  LogoVercel,
  LogoVsCode,
  type TechBrandSvgProps,
} from './HeroTechLogos';

interface FloatingTechLogoItem {
  id: string;
  name: string;
  Icon: React.FC<TechBrandSvgProps>;
  top: string;
  left: string;
  sizeClass: string;
  variant: 'a' | 'b' | 'c' | 'd';
  durationSec: number;
  delaySec: number;
  accent: 'blue' | 'violet';
  mobileVisible?: boolean;
  tooltipBelow?: boolean;
}

const FLOATING_TECH_LOGOS: FloatingTechLogoItem[] = [
  // Top perimeter
  {
    id: 'python',
    name: 'Python',
    Icon: LogoPython,
    top: '6%',
    left: '6%',
    sizeClass: 'w-7 h-7',
    variant: 'a',
    durationSec: 18,
    delaySec: -3,
    accent: 'blue',
    mobileVisible: true,
    tooltipBelow: true,
  },
  {
    id: 'react',
    name: 'React.js',
    Icon: LogoReact,
    top: '7%',
    left: '28%',
    sizeClass: 'w-7 h-7',
    variant: 'b',
    durationSec: 20,
    delaySec: -7,
    accent: 'blue',
    mobileVisible: true,
    tooltipBelow: true,
  },
  {
    id: 'claude',
    name: 'Claude',
    Icon: LogoClaude,
    top: '8%',
    left: '48%',
    sizeClass: 'w-6 h-6',
    variant: 'c',
    durationSec: 22,
    delaySec: -5,
    accent: 'violet',
    tooltipBelow: true,
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    Icon: LogoChatGpt,
    top: '6%',
    left: '66%',
    sizeClass: 'w-6 h-6',
    variant: 'd',
    durationSec: 19,
    delaySec: -11,
    accent: 'blue',
    mobileVisible: true,
    tooltipBelow: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    Icon: LogoGitHub,
    top: '7%',
    left: '89%',
    sizeClass: 'w-6 h-6',
    variant: 'a',
    durationSec: 21,
    delaySec: -4,
    accent: 'violet',
    mobileVisible: true,
    tooltipBelow: true,
  },

  // Left ambient edge
  {
    id: 'django',
    name: 'Django',
    Icon: LogoDjango,
    top: '28%',
    left: '2.2%',
    sizeClass: 'w-6 h-6',
    variant: 'c',
    durationSec: 23,
    delaySec: -8,
    accent: 'violet',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    Icon: LogoPostgres,
    top: '52%',
    left: '2.5%',
    sizeClass: 'w-7 h-7',
    variant: 'b',
    durationSec: 19,
    delaySec: -13,
    accent: 'blue',
    mobileVisible: true,
  },
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    Icon: LogoVsCode,
    top: '74%',
    left: '3%',
    sizeClass: 'w-6 h-6',
    variant: 'd',
    durationSec: 22,
    delaySec: -6,
    accent: 'blue',
  },

  // Center gutter between headline column and orbital portrait
  {
    id: 'docker',
    name: 'Docker',
    Icon: LogoDocker,
    top: '21%',
    left: '52%',
    sizeClass: 'w-7 h-7',
    variant: 'b',
    durationSec: 24,
    delaySec: -9,
    accent: 'blue',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    Icon: LogoCursor,
    top: '37%',
    left: '56%',
    sizeClass: 'w-6 h-6',
    variant: 'd',
    durationSec: 17,
    delaySec: -2,
    accent: 'violet',
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    Icon: LogoMachineLearning,
    top: '53%',
    left: '51%',
    sizeClass: 'w-7 h-7',
    variant: 'a',
    durationSec: 21,
    delaySec: -14,
    accent: 'violet',
    mobileVisible: true,
  },
  {
    id: 'powerbi',
    name: 'Power BI',
    Icon: LogoPowerBi,
    top: '68%',
    left: '55%',
    sizeClass: 'w-6 h-6',
    variant: 'c',
    durationSec: 20,
    delaySec: -10,
    accent: 'blue',
  },

  // Right flank & orbital perimeter
  {
    id: 'linux',
    name: 'Linux',
    Icon: LogoLinux,
    top: '22%',
    left: '93%',
    sizeClass: 'w-6 h-6',
    variant: 'd',
    durationSec: 23,
    delaySec: -5,
    accent: 'violet',
    mobileVisible: true,
  },
  {
    id: 'vercel',
    name: 'Vercel',
    Icon: LogoVercel,
    top: '44%',
    left: '94%',
    sizeClass: 'w-5 h-5',
    variant: 'a',
    durationSec: 18,
    delaySec: -12,
    accent: 'blue',
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    Icon: LogoAntigravity,
    top: '66%',
    left: '93%',
    sizeClass: 'w-6 h-6',
    variant: 'c',
    durationSec: 21,
    delaySec: -7,
    accent: 'blue',
    mobileVisible: true,
  },
  {
    id: 'tableau',
    name: 'Tableau',
    Icon: LogoTableau,
    top: '18%',
    left: '62%',
    sizeClass: 'w-6 h-6',
    variant: 'c',
    durationSec: 25,
    delaySec: -15,
    accent: 'blue',
  },

  // Bottom ambient belt
  {
    id: 'html5',
    name: 'HTML5',
    Icon: LogoHtml5,
    top: '88%',
    left: '9%',
    sizeClass: 'w-6 h-6',
    variant: 'b',
    durationSec: 20,
    delaySec: -4,
    accent: 'violet',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    Icon: LogoJavaScript,
    top: '89%',
    left: '24%',
    sizeClass: 'w-6 h-6',
    variant: 'd',
    durationSec: 22,
    delaySec: -9,
    accent: 'blue',
    mobileVisible: true,
  },
  {
    id: 'sql',
    name: 'SQL',
    Icon: LogoSql,
    top: '86%',
    left: '41%',
    sizeClass: 'w-6 h-6',
    variant: 'a',
    durationSec: 19,
    delaySec: -11,
    accent: 'violet',
  },
  {
    id: 'postman',
    name: 'Postman',
    Icon: LogoPostman,
    top: '88%',
    left: '60%',
    sizeClass: 'w-6 h-6',
    variant: 'c',
    durationSec: 23,
    delaySec: -3,
    accent: 'blue',
  },
  {
    id: 'openvpn',
    name: 'OpenVPN',
    Icon: LogoOpenVpn,
    top: '86%',
    left: '76%',
    sizeClass: 'w-6 h-6',
    variant: 'b',
    durationSec: 21,
    delaySec: -16,
    accent: 'blue',
  },
  {
    id: 'blueprism',
    name: 'Blue Prism',
    Icon: LogoBluePrism,
    top: '87%',
    left: '90%',
    sizeClass: 'w-6 h-6',
    variant: 'd',
    durationSec: 24,
    delaySec: -8,
    accent: 'violet',
    mobileVisible: true,
  },
];

interface HeroTechBackgroundProps {
  sectionRef: React.RefObject<HTMLElement | null>;
}

export const HeroTechBackground: React.FC<HeroTechBackgroundProps> = ({ sectionRef }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    if (!section || !container) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const nodeElements = Array.from(
      container.querySelectorAll<HTMLElement>('[data-tech-node="true"]')
    );

    let activeEl: HTMLElement | null = null;
    let rafId: number | null = null;
    let tapTimer: number | null = null;
    let pointerX = -9999;
    let pointerY = -9999;
    let overInteractiveUi = false;

    const setHoveredNode = (next: HTMLElement | null) => {
      if (activeEl && activeEl !== next) {
        activeEl.removeAttribute('data-hovered');
      }
      if (next && activeEl !== next) {
        next.setAttribute('data-hovered', 'true');
      }
      activeEl = next;
    };

    const findClosestNode = (x: number, y: number, radiusPx: number): HTMLElement | null => {
      let closest: HTMLElement | null = null;
      let bestDistSq = radiusPx * radiusPx;

      for (const el of nodeElements) {
        if (el.offsetParent === null) continue;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const distSq = dx * dx + dy * dy;
        if (distSq <= bestDistSq) {
          bestDistSq = distSq;
          closest = el;
        }
      }
      return closest;
    };

    const updateProximity = () => {
      rafId = null;
      const rect = container.getBoundingClientRect();
      container.style.setProperty('--cursor-x', `${pointerX - rect.left}px`);
      container.style.setProperty('--cursor-y', `${pointerY - rect.top}px`);
      container.style.setProperty('--cursor-active', overInteractiveUi ? '0' : '1');

      if (overInteractiveUi) {
        setHoveredNode(null);
        return;
      }

      const closest = findClosestNode(pointerX, pointerY, 46);
      setHoveredNode(closest);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (coarsePointerQuery.matches) return;
      const target = e.target as HTMLElement | null;
      overInteractiveUi = Boolean(target?.closest('a, button, input, label, [role="button"]'));
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateProximity);
      }
    };

    const handleMouseLeave = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      container.style.setProperty('--cursor-active', '0');
      setHoveredNode(null);
    };

    // Mobile / touch tap inspection without blocking scrolling or button clicks
    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (reducedMotionQuery.matches) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('a, button, input, label, [role="button"]')) {
        return;
      }
      const t = e.changedTouches[0];
      if (!t) return;
      const moveDist = Math.hypot(t.clientX - touchStartX, t.clientY - touchStartY);
      if (moveDist > 12) return; // Ignore scroll gestures

      const tappedNode = findClosestNode(t.clientX, t.clientY, 42);
      if (!tappedNode) {
        setHoveredNode(null);
        return;
      }

      if (tapTimer !== null) {
        window.clearTimeout(tapTimer);
      }
      setHoveredNode(tappedNode);
      tapTimer = window.setTimeout(() => {
        setHoveredNode(null);
        tapTimer = null;
      }, 2200);
    };

    if (!reducedMotionQuery.matches) {
      section.addEventListener('mousemove', handleMouseMove, { passive: true });
      section.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }
    section.addEventListener('touchstart', handleTouchStart, { passive: true });
    section.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('mouseleave', handleMouseLeave);
      section.removeEventListener('touchstart', handleTouchStart);
      section.removeEventListener('touchend', handleTouchEnd);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (tapTimer !== null) window.clearTimeout(tapTimer);
      setHoveredNode(null);
    };
  }, [sectionRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="hero-tech-bg-layer pointer-events-none absolute inset-0 z-[1] overflow-hidden select-none"
    >
      {/* Subtle Electric-Blue & Royal-Violet Pointer Ambient Field */}
      <div className="hero-tech-cursor-glow pointer-events-none absolute inset-0" />

      {/* Floating Technology Ecosystem Logos */}
      {FLOATING_TECH_LOGOS.map((item) => {
        const Icon = item.Icon;
        return (
          <div
            key={item.id}
            className={`hero-tech-float-wrap hero-tech-float-${item.variant} absolute ${
              item.mobileVisible ? 'block' : 'hidden md:block'
            }`}
            style={{
              top: item.top,
              left: item.left,
              animationDuration: `${item.durationSec}s`,
              animationDelay: `${item.delaySec}s`,
            }}
          >
            <div
              data-tech-node="true"
              data-accent={item.accent}
              className="hero-tech-node relative flex items-center justify-center p-2 rounded-xl"
            >
              <Icon className={`${item.sizeClass} relative z-10`} />

              {/* Sleek Tooltip on Hover / Mobile Tap */}
              <span
                className={`hero-tech-tooltip pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-md border border-[#B56AFF]/45 bg-[#0D0D12]/95 text-[10px] font-mono font-medium tracking-wide text-[#D8F0E7] shadow-[0_6px_20px_rgba(0,0,0,0.65)] ${
                  item.tooltipBelow ? 'top-full mt-2' : 'bottom-full mb-2'
                }`}
              >
                {item.name}
              </span>
            </div>
          </div>
        );
      })}

      {/* Soft Edge Vignette Blending */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(8,8,8,0.52)_100%)]" />
    </div>
  );
};
