import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (shouldReduceMotion) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 150);
      return () => clearTimeout(timer);
    }

    const start = performance.now();
    const duration = 760;
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (elapsed < duration) {
        rafId = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setVisible(false);
          onComplete();
        }, 120);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080808] px-6"
          role="status"
          aria-label="Loading portfolio"
        >
          <div className="flex flex-col items-center max-w-sm w-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-3 font-display text-xs tracking-[0.3em] text-[#D8F0E7]"
            >
              PORTFOLIO<span className="text-[#B56AFF]">*</span>
            </motion.div>

            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#D8F0E7]">
              Abhinav P
            </h1>
            <p className="mt-2 font-nav text-xs tracking-[0.22em] text-[#858585] uppercase">
              Data Analytics · Full Stack Development
            </p>

            <div className="mt-7 w-full h-px bg-[#191919] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#873BFF] via-[#B56AFF] to-[#D8F0E7] transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between w-full font-mono text-[11px] text-[#858585] tabular-nums">
              <span>Initializing</span>
              <span className="text-[#D3B5FF]">{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
