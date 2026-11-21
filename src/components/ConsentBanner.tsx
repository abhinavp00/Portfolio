import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface ConsentBannerProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics privacy notice"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-40 rounded-2xl border border-[#303030] bg-[#101010]/95 backdrop-blur-md p-4 shadow-[0_18px_50px_rgba(0,0,0,0.65)]"
    >
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#191919] border border-[#303030] text-[#B56AFF] shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-nav text-xs font-semibold text-[#D8F0E7]">
              Privacy-Conscious Analytics
            </p>
            <button
              type="button"
              onClick={onDecline}
              aria-label="Dismiss and decline analytics"
              className="text-[#858585] hover:text-[#D8F0E7] p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#BDBDBD]">
            This portfolio uses anonymous session analytics to measure project engagement and resume
            downloads. No invasive fingerprinting, full IP addresses, or form messages are stored
            in analytics.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="font-nav px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#873BFF] to-[#B56AFF] hover:brightness-110 text-xs font-medium text-[#F8FAFC] transition-all"
            >
              Accept Analytics
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="font-nav px-3.5 py-1.5 rounded-full border border-[#303030] bg-[#141414] hover:border-[#858585] text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7] transition-colors"
            >
              Opt Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
