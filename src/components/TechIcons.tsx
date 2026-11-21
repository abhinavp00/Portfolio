import React from 'react';

export const BrandLogoMark: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ap-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#873BFF" />
        <stop offset="100%" stopColor="#B56AFF" />
      </linearGradient>
    </defs>
    <rect x="1.5" y="1.5" width="37" height="37" rx="9" fill="#101010" stroke="url(#ap-logo-grad)" strokeWidth="1.6" />
    <path
      d="M11.5 27.5L17.5 12.5H21.2L27.2 27.5H23.7L22.5 24.2H16.2L15 27.5H11.5ZM17.3 21.3H21.4L19.35 15.8L17.3 21.3Z"
      fill="#D8F0E7"
    />
    <circle cx="29.5" cy="12.5" r="2" fill="#B56AFF" />
  </svg>
);

export const EditorialStar: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
      fill="currentColor"
    />
  </svg>
);

export const PythonBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M11.9 2C7.8 2 8.1 3.8 8.1 3.8v1.9h3.9v.6H6.5S4 6 4 10c0 4 2.2 3.9 2.2 3.9h1.3v-1.9s-.1-2.2 2.2-2.2h3.8s2.1 0 2.1-2V4.1S16 2 11.9 2zm-2.1 1.2c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7z"
      fill="#D3B5FF"
    />
    <path
      d="M12.1 22c4.1 0 3.8-1.8 3.8-1.8v-1.9H12v-.6h5.5S20 18 20 14c0-4-2.2-3.9-2.2-3.9h-1.3V12s.1 2.2-2.2 2.2h-3.8s-2.1 0-2.1 2v3.7S8 22 12.1 22zm2.1-1.2c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z"
      fill="#D8F0E7"
    />
  </svg>
);

export const DjangoBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#191919" stroke="#B56AFF" strokeWidth="1.4" />
    <path
      d="M10.8 7v7.3c-1.2.2-2.1 0-2.8-.6-.7-.6-1-1.4-1-2.4 0-1.1.4-2 1.1-2.6.6-.5 1.3-.7 2.1-.6V7h.6zm0 3.1c-.4-.1-.8 0-1.1.2-.4.3-.6.7-.6 1.3s.2 1 .5 1.3c.3.3.7.4 1.2.3v-3.1zm3.4-3.1h1.5v1.4h-1.5V7zm0 2.4h1.5v5.2c0 1.3-.2 2.2-.7 2.8-.4.5-1.1.9-2 1.1l-.9-.9c.7-.2 1.2-.5 1.5-.9.3-.4.5-1.1.5-2V9.4z"
      fill="#D8F0E7"
    />
  </svg>
);

export const ReactBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="2.1" fill="#D8F0E7" />
    <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="#D3B5FF" strokeWidth="1.3" />
    <ellipse
      cx="12"
      cy="12"
      rx="9"
      ry="3.6"
      transform="rotate(60 12 12)"
      stroke="#B56AFF"
      strokeWidth="1.3"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="9"
      ry="3.6"
      transform="rotate(120 12 12)"
      stroke="#D3B5FF"
      strokeWidth="1.3"
    />
  </svg>
);

export const PostgresBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <ellipse cx="12" cy="6.5" rx="7" ry="2.8" stroke="#D3B5FF" strokeWidth="1.5" />
    <path d="M5 6.5v11c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-11" stroke="#D3B5FF" strokeWidth="1.5" />
    <path d="M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8" stroke="#B56AFF" strokeWidth="1.5" />
  </svg>
);

export const PowerBIBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="13" width="3.5" height="7" rx="1" fill="#873BFF" />
    <rect x="10.25" y="9" width="3.5" height="11" rx="1" fill="#B56AFF" />
    <rect x="16.5" y="4" width="3.5" height="16" rx="1" fill="#D8F0E7" />
  </svg>
);

export const SqlBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="3" stroke="#B56AFF" strokeWidth="1.4" fill="#191919" />
    <path d="M7.5 10.5l2.5 1.8-2.5 1.8M11.5 14.5h4.5" stroke="#D8F0E7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
