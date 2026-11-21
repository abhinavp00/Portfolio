import React, { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

interface HeroTypingHeadlineProps {
  greeting: string;
  heading: string;
  ready?: boolean;
}

interface CharStep {
  char: string;
  line: 'greeting' | 'heading';
  index: number;
  delayAfterMs: number;
}

function getCharDelay(char: string, isLastOfGreeting: boolean): number {
  if (isLastOfGreeting) return 220;
  if (char === ',') return 190;
  if (char === "'" || char === '’') return 70;
  if (char === ' ') return 48;
  return 56;
}

export const HeroTypingHeadline: React.FC<HeroTypingHeadlineProps> = ({
  greeting,
  heading,
  ready = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const timersRef = useRef<number[]>([]);
  const isInViewportRef = useRef(false);
  const hasExitedViewportRef = useRef(false);
  const hasPlayedInitialRef = useRef(false);
  const isAnimatingRef = useRef(false);

  const { greetingChars, headingChars, steps } = useMemo(() => {
    const gChars = Array.from(greeting);
    const hChars = Array.from(heading);
    const allSteps: CharStep[] = [];

    gChars.forEach((char, idx) => {
      allSteps.push({
        char,
        line: 'greeting',
        index: allSteps.length,
        delayAfterMs: getCharDelay(char, idx === gChars.length - 1),
      });
    });

    hChars.forEach((char, idx) => {
      allSteps.push({
        char,
        line: 'heading',
        index: allSteps.length,
        delayAfterMs: idx === hChars.length - 1 ? 0 : getCharDelay(char, false),
      });
    });

    return { greetingChars: gChars, headingChars: hChars, steps: allSteps };
  }, [greeting, heading]);

  charRefs.current.length = steps.length;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const headingEl = headingRef.current;
    if (!wrapper) return;

    const clearAllTimers = () => {
      for (const id of timersRef.current) {
        window.clearTimeout(id);
      }
      timersRef.current = [];
    };

    const showAllInstantly = () => {
      clearAllTimers();
      isAnimatingRef.current = false;
      headingEl?.removeAttribute('data-typing-complete');
      for (const el of charRefs.current) {
        if (!el) continue;
        el.setAttribute('data-typed', 'true');
        el.removeAttribute('data-cursor');
      }
    };

    const resetAllHidden = () => {
      clearAllTimers();
      isAnimatingRef.current = false;
      headingEl?.removeAttribute('data-typing-complete');
      for (const el of charRefs.current) {
        if (!el) continue;
        el.removeAttribute('data-typed');
        el.removeAttribute('data-cursor');
      }
    };

    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (shouldReduceMotion || reducedQuery.matches) {
      showAllInstantly();
      return;
    }

    const startTypingSequence = (initialDelayMs: number) => {
      resetAllHidden();
      if (steps.length === 0) return;
      isAnimatingRef.current = true;

      let cursorIndex = -1;
      let accumulatedDelay = initialDelayMs;

      steps.forEach((step, idx) => {
        const timerId = window.setTimeout(() => {
          if (cursorIndex >= 0) {
            charRefs.current[cursorIndex]?.removeAttribute('data-cursor');
          }
          const currentEl = charRefs.current[idx];
          if (currentEl) {
            currentEl.setAttribute('data-typed', 'true');
            currentEl.setAttribute('data-cursor', 'true');
            cursorIndex = idx;
          }

          if (idx === steps.length - 1) {
            isAnimatingRef.current = false;
            headingEl?.setAttribute('data-typing-complete', 'true');
            const finishTimer = window.setTimeout(() => {
              currentEl?.removeAttribute('data-cursor');
            }, 850);
            timersRef.current.push(finishTimer);
          }
        }, accumulatedDelay);

        timersRef.current.push(timerId);
        accumulatedDelay += step.delayAfterMs;
      });
    };

    // Hide characters while waiting for LoadingScreen fade or initial viewport entry
    resetAllHidden();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          const wasOutside = !isInViewportRef.current;
          isInViewportRef.current = true;

          if (!ready) return;

          if (!hasPlayedInitialRef.current) {
            hasPlayedInitialRef.current = true;
            hasExitedViewportRef.current = false;
            startTypingSequence(110);
          } else if (wasOutside && hasExitedViewportRef.current) {
            hasExitedViewportRef.current = false;
            startTypingSequence(90);
          }
        } else if (!entry.isIntersecting) {
          isInViewportRef.current = false;
          if (hasPlayedInitialRef.current) {
            hasExitedViewportRef.current = true;
            resetAllHidden();
          }
        }
      },
      {
        threshold: [0, 0.2, 0.5],
      }
    );

    observer.observe(wrapper);

    // If already visible in viewport when ready switches from false -> true
    if (ready) {
      const rect = wrapper.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      if (inView && !hasPlayedInitialRef.current) {
        isInViewportRef.current = true;
        hasPlayedInitialRef.current = true;
        hasExitedViewportRef.current = false;
        startTypingSequence(110);
      }
    }

    return () => {
      observer.disconnect();
      clearAllTimers();
    };
  }, [ready, shouldReduceMotion, steps]);

  const renderWords = (
    chars: string[],
    offset: number,
    keyPrefix: string
  ): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    let currentWord: { char: string; globalIdx: number }[] = [];

    const flushWord = (wordIdx: number) => {
      if (currentWord.length === 0) return;
      nodes.push(
        <span key={`${keyPrefix}-word-${wordIdx}`} className="inline-block">
          {currentWord.map(({ char, globalIdx }) => (
            <span
              key={`${keyPrefix}-c-${globalIdx}`}
              ref={(el) => {
                charRefs.current[globalIdx] = el;
              }}
              className="hero-type-char"
            >
              {char}
            </span>
          ))}
        </span>
      );
      currentWord = [];
    };

    chars.forEach((char, i) => {
      const globalIdx = offset + i;
      if (char === ' ') {
        flushWord(i);
        nodes.push(
          <span
            key={`${keyPrefix}-space-${globalIdx}`}
            ref={(el) => {
              charRefs.current[globalIdx] = el;
            }}
            className="hero-type-char"
          >
            {' '}
          </span>
        );
      } else {
        currentWord.push({ char, globalIdx });
      }
    });

    flushWord(chars.length);
    return nodes;
  };

  return (
    <div ref={wrapperRef} className="mt-5">
      <span
        aria-label={greeting}
        className="block font-editorial italic text-xl sm:text-2xl text-[#858585]"
      >
        <span aria-hidden="true">{renderWords(greetingChars, 0, 'greeting')}</span>
      </span>
      <h1
        ref={headingRef}
        aria-label={heading}
        className="hero-typing-heading mt-1 font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5rem] font-semibold tracking-tight leading-[1.03] text-[#D8F0E7]"
        style={{ textWrap: 'balance' }}
      >
        <span aria-hidden="true">
          {renderWords(headingChars, greetingChars.length, 'heading')}
        </span>
      </h1>
    </div>
  );
};
