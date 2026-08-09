import { Text } from 'react-native';
// Helper SVG Data URLs for realistic excavator and brand illustrations
export const Images = {
  splashBg: 'linear-gradient(180deg, #FFFBEB 0%, #F59E0B 35%, #78350F 100%)',
  
  // Goddess Laxmi / Divine Idol SVG
  godLogo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23D4AF37" stroke="%23B45309" stroke-width="3"/><circle cx="50" cy="50" r="40" fill="%23FEF3C7"/><path d="M50 15 L58 30 L75 32 L62 43 L66 60 L50 50 L34 60 L38 43 L25 32 L42 30 Z" fill="%23B45309"/><circle cx="50" cy="42" r="12" fill="%23DC2626"/><path d="M35 75 Q50 65 65 75 Q50 85 35 75 Z" fill="%23D4AF37"/></svg>`,

  // Excavator Graphic SVG
  excavator: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><rect x="30" y="80" width="80" height="25" rx="10" fill="%231F2937"/><circle cx="45" cy="92.5" r="7" fill="%239CA3AF"/><circle cx="70" cy="92.5" r="7" fill="%239CA3AF"/><circle cx="95" cy="92.5" r="7" fill="%239CA3AF"/><rect x="40" y="50" width="55" height="32" rx="4" fill="%23F59E0B"/><rect x="45" y="55" width="25" height="18" rx="2" fill="%236B7280"/><path d="M80 60 L130 30 L160 50 L185 35" stroke="%23D97706" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M185 35 L195 55 L175 55 Z" fill="%23374151"/></svg>`,

  // App Logo
  logo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%236B121C"/><text x="50" y="45" font-family="sans-serif" font-weight="bold" font-size="28" fill="%23D4AF37" text-anchor="middle">M</text><text x="50" y="75" font-family="sans-serif" font-weight="bold" font-size="20" fill="%23FFFFFF" text-anchor="middle">I%26E</text></svg>`,

  // Customers Avatar
  customerAvatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="%230284C7"/><circle cx="40" cy="30" r="16" fill="%23FFFFFF"/><path d="M15 68 C15 50, 65 50, 65 68 Z" fill="%23FFFFFF"/></svg>`,

  // Machine Icons
  machines: {
    jcb: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" rx="10" fill="%23F59E0B"/><path d="M10 40 L50 40 L40 20 L20 20 Z" fill="%231F2937"/></svg>`,
    poclain: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" rx="10" fill="%23EA580C"/><path d="M10 45 L50 45 L35 15 L15 15 Z" fill="%231F2937"/></svg>`,
    tipper: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" rx="10" fill="%230284C7"/><rect x="10" y="25" width="25" height="20" fill="%23FFFFFF"/><rect x="38" y="25" width="12" height="20" fill="%23E0F2FE"/></svg>`,
    tractor: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" rx="10" fill="%2316A34A"/><circle cx="20" cy="40" r="10" fill="%23FFFFFF"/><circle cx="42" cy="42" r="6" fill="%23FFFFFF"/></svg>`,
  },

  common: {
    empty: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23F3F4F6"/><path d="M35 45 L65 45 M40 60 C45 55 55 55 60 60" stroke="%239CA3AF" stroke-width="4" stroke-linecap="round"/></svg>`,
    noData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" rx="8" fill="%23F3F4F6" stroke="%23D1D5DB" stroke-width="2"/><line x1="30" y1="35" x2="70" y2="35" stroke="%239CA3AF" stroke-width="4"/><line x1="30" y1="50" x2="60" y2="50" stroke="%239CA3AF" stroke-width="4"/><line x1="30" y1="65" x2="50" y2="65" stroke="%239CA3AF" stroke-width="4"/></svg>`,
  }
};
