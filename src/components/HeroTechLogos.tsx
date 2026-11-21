import React from 'react';

export interface TechBrandSvgProps {
  className?: string;
}

// 1. Python
export const LogoPython: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M11.9 2C7.8 2 8.1 3.8 8.1 3.8v1.9h3.9v.6H6.5S4 6 4 10c0 4 2.2 3.9 2.2 3.9h1.3v-1.9s-.1-2.2 2.2-2.2h3.8s2.1 0 2.1-2V4.1S16 2 11.9 2zm-2.1 1.2c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7z"
      fill="#60A5FA"
    />
    <path
      d="M12.1 22c4.1 0 3.8-1.8 3.8-1.8v-1.9H12v-.6h5.5S20 18 20 14c0-4-2.2-3.9-2.2-3.9h-1.3V12s.1 2.2-2.2 2.2h-3.8s-2.1 0-2.1 2v3.7S8 22 12.1 22zm2.1-1.2c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z"
      fill="#D3B5FF"
    />
  </svg>
);

// 2. React.js
export const LogoReact: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="2.1" fill="#60A5FA" />
    <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="#60A5FA" strokeWidth="1.35" />
    <ellipse
      cx="12"
      cy="12"
      rx="9"
      ry="3.6"
      transform="rotate(60 12 12)"
      stroke="#B56AFF"
      strokeWidth="1.35"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="9"
      ry="3.6"
      transform="rotate(120 12 12)"
      stroke="#D3B5FF"
      strokeWidth="1.35"
    />
  </svg>
);

// 3. HTML5
export const LogoHtml5: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 3h16l-1.45 16.2L12 21l-6.55-1.8L4 3z"
      stroke="#D3B5FF"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M16.2 7.2H8.1l.3 3.4h7.5l-.55 5.4L12 17l-3.35-1-.2-2.2"
      stroke="#60A5FA"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 4. Django
export const LogoDjango: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" stroke="#B56AFF" strokeWidth="1.4" />
    <path
      d="M10.7 6.8v7.6c-1.2.2-2.2 0-2.9-.6-.7-.6-1-1.5-1-2.5 0-1.1.4-2 1.1-2.6.6-.5 1.3-.7 2.1-.6V6.8h.7zm0 3.2c-.4-.1-.8 0-1.1.2-.4.3-.6.7-.6 1.3s.2 1 .5 1.3c.3.3.7.4 1.2.3V10zm3.5-3.2h1.6v1.5h-1.6V6.8zm0 2.5h1.6v5.3c0 1.3-.2 2.2-.7 2.8-.4.6-1.1 1-2.1 1.2l-.9-.9c.7-.2 1.2-.5 1.5-.9.3-.4.5-1.1.5-2V9.3z"
      fill="#E9E9E9"
    />
  </svg>
);

// 5. JavaScript
export const LogoJavaScript: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3.5" stroke="#60A5FA" strokeWidth="1.5" />
    <path
      d="M10.4 10.6v5.1c0 1.4-.75 2.1-2 2.1-.75 0-1.3-.25-1.7-.7l1-.9c.2.25.45.4.75.4.4 0 .65-.25.65-.85v-5.15h1.3z"
      fill="#D3B5FF"
    />
    <path
      d="M12.6 16.6l1.05-.65c.28.48.68.75 1.3.75.55 0 .9-.28.9-.66 0-.46-.36-.62-1-.9l-.35-.15c-1-.42-1.65-.95-1.65-2.06 0-1.02.78-1.8 2-1.8.87 0 1.5.3 1.95 1.1l-1.07.68c-.24-.42-.5-.58-.88-.58-.4 0-.66.25-.66.58 0 .41.26.58.85.83l.35.15c1.17.5 1.83 1.01 1.83 2.16 0 1.24-.97 1.92-2.28 1.92-1.28 0-2.1-.6-2.34-1.42z"
      fill="#E9E9E9"
    />
  </svg>
);

// 6. SQL
export const LogoSql: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <ellipse cx="12" cy="6.2" rx="7.2" ry="2.7" stroke="#60A5FA" strokeWidth="1.5" />
    <path d="M4.8 6.2v11.2c0 1.5 3.22 2.7 7.2 2.7s7.2-1.2 7.2-2.7V6.2" stroke="#B56AFF" strokeWidth="1.5" />
    <path d="M4.8 11.8c0 1.5 3.22 2.7 7.2 2.7s7.2-1.2 7.2-2.7" stroke="#D3B5FF" strokeWidth="1.35" />
  </svg>
);

// 7. PostgreSQL
export const LogoPostgres: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M17.2 5.4c-1.5-1.3-3.7-1.4-5.2-.5-1.5-.9-3.7-.8-5.2.5-1.9 1.6-2 4.9-.8 7.5.8 1.8 2 2.9 2.9 3.2.3.1.5-.1.5-.4v-2.6c0-.4-.3-.7-.7-.8-.7-.2-1.1-.8-1-1.5.1-.6.6-1 1.2-1h5.8c.6 0 1.1.4 1.2 1 .1.7-.3 1.3-1 1.5-.4.1-.7.4-.7.8v4.6c0 1.2.8 2.1 1.9 2.1 1.2 0 1.9-.9 1.9-2.2v-1.7c.9-1 1.5-2.6 1.5-4.3 0-2.5-.9-4.9-2.3-6.2z"
      stroke="#60A5FA"
      strokeWidth="1.45"
      strokeLinejoin="round"
    />
    <circle cx="9.6" cy="8.2" r="0.8" fill="#E9E9E9" />
    <circle cx="14.4" cy="8.2" r="0.8" fill="#E9E9E9" />
  </svg>
);

// 8. Postman
export const LogoPostman: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.8" stroke="#B56AFF" strokeWidth="1.45" />
    <path
      d="M8.8 15.2l5.8-5.8M14.6 9.4l-1.5 5.4-3.9-3.9 5.4-1.5z"
      stroke="#60A5FA"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="14.9" cy="9.1" r="1.1" fill="#E9E9E9" />
  </svg>
);

// 9. Docker
export const LogoDocker: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="6" y="9" width="2.5" height="2.2" rx="0.3" stroke="#60A5FA" strokeWidth="1.2" />
    <rect x="9.3" y="9" width="2.5" height="2.2" rx="0.3" stroke="#60A5FA" strokeWidth="1.2" />
    <rect x="12.6" y="9" width="2.5" height="2.2" rx="0.3" stroke="#60A5FA" strokeWidth="1.2" />
    <rect x="9.3" y="6" width="2.5" height="2.2" rx="0.3" stroke="#D3B5FF" strokeWidth="1.2" />
    <rect x="12.6" y="6" width="2.5" height="2.2" rx="0.3" stroke="#D3B5FF" strokeWidth="1.2" />
    <path
      d="M3.2 12.6h14.4c1.2 0 2.3-.5 2.9-1.4.4.8.4 2-.3 3.2-1.1 2-3.5 3.6-7.5 3.6-5.2 0-9.1-2.2-9.5-5.4z"
      stroke="#60A5FA"
      strokeWidth="1.45"
      strokeLinejoin="round"
    />
  </svg>
);

// 10. Linux
export const LogoLinux: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 3.2c2.1 0 3.2 1.7 3.2 4 0 1.4.5 2.4 1.6 3.7 1.1 1.3 1.7 2.8 1.5 4.4-.2 1.7-1.4 3.2-3.3 3.8-.8.2-1.9.4-3 .4s-2.2-.2-3-.4c-1.9-.6-3.1-2.1-3.3-3.8-.2-1.6.4-3.1 1.5-4.4 1.1-1.3 1.6-2.3 1.6-3.7 0-2.3 1.1-4 3.2-4z"
      stroke="#D3B5FF"
      strokeWidth="1.45"
    />
    <circle cx="10.7" cy="6.8" r="0.7" fill="#E9E9E9" />
    <circle cx="13.3" cy="6.8" r="0.7" fill="#E9E9E9" />
    <path d="M10.5 8.5l1.5.9 1.5-.9" stroke="#60A5FA" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 19.2c1-.4 2.1-.2 2.7.5M16.5 19.2c-1-.4-2.1-.2-2.7.5" stroke="#60A5FA" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// 11. Visual Studio Code
export const LogoVsCode: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M17.2 3.2l3.6 1.7v14.2l-3.6 1.7-9.6-8.8 9.6-8.8z"
      stroke="#60A5FA"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M17.2 3.2L6.8 14.8l-3.1-2.3 3.1-2.4L17.2 20.8"
      stroke="#B56AFF"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 12. Cursor
export const LogoCursor: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <polygon
      points="12,2.5 20.2,7.2 20.2,16.8 12,21.5 3.8,16.8 3.8,7.2"
      stroke="#D3B5FF"
      strokeWidth="1.45"
      strokeLinejoin="round"
    />
    <path
      d="M12 2.5v9.5l8.2-4.8M12 12l-8.2 4.8M12 12v9.5"
      stroke="#60A5FA"
      strokeWidth="1.35"
      strokeLinejoin="round"
    />
    <polygon points="12,12 16.5,9.4 16.5,14.6" fill="#E9E9E9" opacity="0.85" />
  </svg>
);

// 13. GitHub
export const LogoGitHub: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2.8c-5.1 0-9.2 4.1-9.2 9.2 0 4.07 2.64 7.52 6.3 8.74.46.08.63-.2.63-.44v-1.7c-2.56.56-3.1-1.1-3.1-1.1-.42-1.06-1.02-1.34-1.02-1.34-.84-.57.06-.56.06-.56.92.06 1.41.95 1.41.95.82 1.4 2.15 1 2.68.76.08-.6.32-1 .58-1.23-2.04-.23-4.19-1.02-4.19-4.55 0-1 .36-1.83.95-2.48-.1-.23-.41-1.17.09-2.44 0 0 .77-.25 2.53.95a8.8 8.8 0 014.6 0c1.76-1.2 2.53-.95 2.53-.95.5 1.27.19 2.21.09 2.44.59.65.95 1.48.95 2.48 0 3.54-2.15 4.32-4.2 4.54.33.29.62.85.62 1.72v2.55c0 .24.17.53.64.44 3.65-1.22 6.29-4.67 6.29-8.74 0-5.1-4.1-9.2-9.2-9.2z"
      stroke="#E9E9E9"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

// 14. Vercel
export const LogoVercel: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <polygon
      points="12,4 21,19.5 3,19.5"
      stroke="#E9E9E9"
      strokeWidth="1.6"
      strokeLinejoin="round"
      fill="rgba(211, 181, 255, 0.14)"
    />
  </svg>
);

// 15. Antigravity
export const LogoAntigravity: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M5.5 18.5L12 4.5l6.5 14"
      stroke="#60A5FA"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 15.5c2.7-1.9 6.3-1.9 9 0"
      stroke="#B56AFF"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="4.5" r="1.5" fill="#E9E9E9" />
  </svg>
);

// 16. Claude
export const LogoClaude: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <g stroke="#D3B5FF" strokeWidth="1.7" strokeLinecap="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
      <line x1="18.4" y1="5.6" x2="5.6" y2="18.4" />
      <line x1="8.4" y1="3.8" x2="15.6" y2="20.2" stroke="#B56AFF" />
      <line x1="20.2" y1="8.4" x2="3.8" y2="15.6" stroke="#B56AFF" />
    </g>
    <circle cx="12" cy="12" r="2.2" fill="#080808" />
  </svg>
);

// 17. ChatGPT
export const LogoChatGpt: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="2.6" stroke="#60A5FA" strokeWidth="1.35" />
    <path
      d="M12 3.2c2 0 3.6 1.5 3.8 3.4 1.8.4 3.2 2 3.2 4 0 .8-.2 1.6-.7 2.2.8 1.6.3 3.7-1.2 4.7-.8.6-1.8.8-2.8.6-.7 1.7-2.5 2.7-4.4 2.3-1.4-.3-2.5-1.2-3-2.5-1.8.1-3.6-1-4.1-2.8-.3-1.1-.1-2.3.6-3.2-.8-1.6-.4-3.6 1.1-4.7.9-.6 2-.8 3-.5.7-1.8 2.5-3 4.5-3z"
      stroke="#D3B5FF"
      strokeWidth="1.35"
      strokeLinejoin="round"
    />
    <path
      d="M12 9.4V4.2M14.2 10.7l4.4-2.5M14.2 13.3l4.4 2.5M12 14.6v5.2M9.8 13.3l-4.4 2.5M9.8 10.7L5.4 8.2"
      stroke="#60A5FA"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

// 18. Machine Learning
export const LogoMachineLearning: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M6 7l6 5-6 5M6 12h6M12 7l6 5-6 5"
      stroke="#B56AFF"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="5.5" cy="7" r="1.7" fill="#080808" stroke="#60A5FA" strokeWidth="1.4" />
    <circle cx="5.5" cy="12" r="1.7" fill="#080808" stroke="#60A5FA" strokeWidth="1.4" />
    <circle cx="5.5" cy="17" r="1.7" fill="#080808" stroke="#60A5FA" strokeWidth="1.4" />
    <circle cx="12" cy="7" r="1.7" fill="#080808" stroke="#D3B5FF" strokeWidth="1.4" />
    <circle cx="12" cy="12" r="1.7" fill="#080808" stroke="#D3B5FF" strokeWidth="1.4" />
    <circle cx="12" cy="17" r="1.7" fill="#080808" stroke="#D3B5FF" strokeWidth="1.4" />
    <circle cx="18.5" cy="12" r="1.9" fill="#080808" stroke="#E9E9E9" strokeWidth="1.5" />
  </svg>
);

// 19. OpenVPN
export const LogoOpenVpn: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M6.4 18.8a8.4 8.4 0 1111.2 0"
      stroke="#60A5FA"
      strokeWidth="1.65"
      strokeLinecap="round"
    />
    <circle cx="12" cy="10.8" r="2.2" stroke="#D3B5FF" strokeWidth="1.5" />
    <path d="M10.8 12.6L9.8 19h4.4l-1-6.4" stroke="#B56AFF" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

// 20. Power BI
export const LogoPowerBi: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="13" width="3.5" height="7" rx="1" fill="#873BFF" />
    <rect x="10.25" y="9" width="3.5" height="11" rx="1" fill="#B56AFF" />
    <rect x="16.5" y="4" width="3.5" height="16" rx="1" fill="#60A5FA" />
  </svg>
);

// 21. Tableau
export const LogoTableau: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <g stroke="#60A5FA" strokeWidth="1.45" strokeLinecap="round">
      <line x1="12" y1="8.5" x2="12" y2="15.5" />
      <line x1="8.5" y1="12" x2="15.5" y2="12" />
    </g>
    <g stroke="#D3B5FF" strokeWidth="1.35" strokeLinecap="round">
      <line x1="12" y1="3" x2="12" y2="6.2" />
      <line x1="10.4" y1="4.6" x2="13.6" y2="4.6" />
      <line x1="12" y1="17.8" x2="12" y2="21" />
      <line x1="10.4" y1="19.4" x2="13.6" y2="19.4" />
      <line x1="4.6" y1="10.4" x2="4.6" y2="13.6" />
      <line x1="3" y1="12" x2="6.2" y2="12" />
      <line x1="19.4" y1="10.4" x2="19.4" y2="13.6" />
      <line x1="17.8" y1="12" x2="21" y2="12" />
    </g>
    <g stroke="#B56AFF" strokeWidth="1.25" strokeLinecap="round">
      <line x1="7.2" y1="6" x2="7.2" y2="8.4" />
      <line x1="6" y1="7.2" x2="8.4" y2="7.2" />
      <line x1="16.8" y1="6" x2="16.8" y2="8.4" />
      <line x1="15.6" y1="7.2" x2="18" y2="7.2" />
      <line x1="7.2" y1="15.6" x2="7.2" y2="18" />
      <line x1="6" y1="16.8" x2="8.4" y2="16.8" />
      <line x1="16.8" y1="15.6" x2="16.8" y2="18" />
      <line x1="15.6" y1="16.8" x2="18" y2="16.8" />
    </g>
  </svg>
);

// 22. Blue Prism
export const LogoBluePrism: React.FC<TechBrandSvgProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <polygon
      points="12,3.2 20,17.5 4,17.5"
      stroke="#60A5FA"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <polygon
      points="12,8.5 16.5,17.5 7.5,17.5"
      stroke="#B56AFF"
      strokeWidth="1.35"
      strokeLinejoin="round"
    />
    <line x1="12" y1="3.2" x2="12" y2="17.5" stroke="#D3B5FF" strokeWidth="1.2" />
  </svg>
);
