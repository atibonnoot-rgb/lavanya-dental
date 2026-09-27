import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Medical Dental Green Palette:
// Main green: #047857 (emerald-700) / #059669 (emerald-600)
// Deep green contrast: #064E3B (emerald-900)
// Soft mint for anatomical bases (NO skin/pink color): #D1FAE5 / #E2E8F0

export const AlignerIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Aligner tray contour */}
    <path 
      d="M17 38 C 17 25, 23 20, 27 25 C 29 27, 31 29, 32 29 C 33 29, 35 27, 37 25 C 41 20, 47 25, 47 38 C 47 43, 44 44, 40 43 C 36 42, 34 38, 32 38 C 30 38, 28 42, 24 43 C 20 44, 17 43, 17 38 Z" 
      fill="white" 
    />
    <path 
      d="M21 37 C 21 28, 25 24, 27 27 C 29 30, 31 32, 32 32 C 33 32, 35 30, 37 27 C 39 24, 43 28, 43 37" 
      stroke="#047857" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />
  </svg>
);

export const DentalImplantsIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Bone/gum base (Soft Mint #D1FAE5 - NO skin color) */}
    <path d="M12 52 C 22 46, 42 46, 52 52 L 52 58 L 12 58 Z" fill="#D1FAE5" />
    {/* Implant post */}
    <path d="M29 36 L 35 36 L 34 49 L 30 49 Z" fill="#E2E8F0" />
    <line x1="28" y1="40" x2="36" y2="40" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="29" y1="44" x2="35" y2="44" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="30" y1="48" x2="34" y2="48" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    {/* Crown */}
    <path 
      d="M24 23 C 24 16, 27 15, 32 17 C 37 15, 40 16, 40 23 C 40 30, 37 36, 32 36 C 27 36, 24 30, 24 23 Z" 
      fill="white" 
    />
  </svg>
);

export const RootCanalIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Tooth outline */}
    <path 
      d="M21 21 C 21 15, 27 16, 32 18 C 37 16, 43 15, 43 21 C 43 28, 41 33, 40 45 C 39 49, 37 49, 36 43 C 35 38, 34 32, 32 32 C 30 32, 29 38, 28 43 C 27 49, 25 49, 24 45 C 23 33, 21 28, 21 21 Z" 
      fill="white" 
    />
    {/* Canal lines */}
    <path d="M28 43 C 28 35, 30 28, 30 23" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M36 43 C 36 35, 34 28, 34 23" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
    {/* Endodontic file */}
    <path d="M33 13 C 33 10, 35 10, 36 12 C 37 14, 34 16, 32 20 L 30 30" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="36" cy="11" r="2" fill="#FDE047" />
  </svg>
);

export const BridgesIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Base foundation (Soft Mint #D1FAE5 - NO skin color) */}
    <path d="M12 46 C 22 42, 42 42, 52 46 L 52 54 L 12 54 Z" fill="#D1FAE5" />
    {/* Two support abutments */}
    <rect x="18" y="32" width="6" height="12" rx="2" fill="#94A3B8" />
    <rect x="40" y="32" width="6" height="12" rx="2" fill="#94A3B8" />
    {/* 3-Tooth Bridge */}
    <path 
      d="M16 23 C 16 18, 21 18, 24 20 C 26 18, 30 18, 32 19 C 34 18, 38 18, 40 20 C 43 18, 48 18, 48 23 C 48 30, 47 34, 40 34 C 37 34, 35 31, 32 31 C 29 31, 27 34, 24 34 C 17 34, 16 30, 16 23 Z" 
      fill="white" 
    />
    <line x1="25" y1="20" x2="25" y2="33" stroke="#047857" strokeWidth="1.5" />
    <line x1="39" y1="20" x2="39" y2="33" stroke="#047857" strokeWidth="1.5" />
  </svg>
);

export const BracesIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Two front teeth */}
    <path d="M17 20 C 17 14, 30 14, 31 18 L 31 40 C 30 44, 18 44, 17 38 Z" fill="white" />
    <path d="M33 18 C 34 14, 47 14, 47 20 L 47 38 C 46 44, 34 44, 33 40 Z" fill="white" />
    {/* Orthodontic archwire */}
    <line x1="14" y1="28" x2="50" y2="28" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
    {/* Brackets */}
    <rect x="21" y="24" width="7" height="8" rx="1.5" fill="#064E3B" stroke="#E2E8F0" strokeWidth="1.5" />
    <rect x="36" y="24" width="7" height="8" rx="1.5" fill="#064E3B" stroke="#E2E8F0" strokeWidth="1.5" />
    {/* Ligature cross */}
    <line x1="22" y1="28" x2="27" y2="28" stroke="white" strokeWidth="1" />
    <line x1="37" y1="28" x2="42" y2="28" stroke="white" strokeWidth="1" />
  </svg>
);

export const DentalBondingIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Tooth */}
    <path 
      d="M22 23 C 22 16, 27 16, 32 18 C 37 16, 42 16, 42 23 C 42 30, 40 37, 38 46 C 37 49, 35 48, 34 43 C 33 39, 33 34, 32 34 C 31 34, 31 39, 30 43 C 29 48, 27 49, 26 46 C 24 37, 22 30, 22 23 Z" 
      fill="white" 
    />
    {/* Bonding composite edge being added */}
    <path d="M36 21 C 38 21, 41 22, 41 26 L 35 26 Z" fill="#6EE7B7" />
    {/* Light wand applicator */}
    <path d="M48 12 L 39 21" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
    <circle cx="38" cy="22" r="2.5" fill="#34D399" />
    {/* Sparkle */}
    <path d="M46 22 L 48 24 L 46 26 L 44 24 Z" fill="#FDE047" />
  </svg>
);

export const ToothExtractionIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Socket foundation (Soft Mint #D1FAE5 - NO skin color) */}
    <path d="M12 50 C 22 45, 42 45, 52 50 L 52 58 L 12 58 Z" fill="#D1FAE5" />
    <ellipse cx="32" cy="48" rx="8" ry="3" fill="#A7F3D0" />
    {/* Tooth lifted upward */}
    <g transform="translate(0, -5)">
      <path 
        d="M24 23 C 24 17, 28 17, 32 19 C 36 17, 40 17, 40 23 C 40 29, 38 35, 36 43 C 35 46, 34 45, 33 41 C 33 37, 33 33, 32 33 C 31 33, 31 37, 31 41 C 30 45, 29 46, 28 43 C 26 35, 24 29, 24 23 Z" 
        fill="white" 
      />
      {/* Extraction tool */}
      <path d="M20 25 C 22 23, 24 23, 26 25" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M38 25 C 40 23, 42 23, 44 25" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M32 12 L 32 20" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="2 2" />
      <path d="M32 8 L 29 11 M 32 8 L 35 11" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

export const TeethWhiteningIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Gleaming tooth */}
    <path 
      d="M21 23 C 21 16, 27 16, 32 18 C 37 16, 43 16, 43 23 C 43 31, 41 38, 39 47 C 38 51, 36 50, 35 44 C 34 39, 34 34, 32 34 C 30 34, 30 39, 29 44 C 28 50, 26 51, 25 47 C 23 38, 21 31, 21 23 Z" 
      fill="white" 
    />
    {/* Sparkling glint */}
    <path d="M41 12 L 43 17 L 48 19 L 43 21 L 41 26 L 39 21 L 34 19 L 39 17 Z" fill="#FDE047" />
    <circle cx="25" cy="27" r="1.5" fill="#FDE047" />
    <path d="M22 27 L 28 27 M 25 24 L 25 30" stroke="#FDE047" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

export const DentalJewelleryIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Tooth */}
    <path 
      d="M22 23 C 22 16, 27 16, 32 18 C 37 16, 42 16, 42 23 C 42 30, 40 37, 38 46 C 37 49, 35 48, 34 43 C 33 39, 33 34, 32 34 C 31 34, 31 39, 30 43 C 29 48, 27 49, 26 46 C 24 37, 22 30, 22 23 Z" 
      fill="white" 
    />
    {/* Crystal gem */}
    <circle cx="34" cy="26" r="3.5" fill="#38BDF8" />
    <path d="M34 20 L 35 24 L 39 26 L 35 28 L 34 32 L 33 28 L 29 26 L 33 24 Z" fill="white" />
    <circle cx="34" cy="26" r="1" fill="#F0FDF4" />
  </svg>
);

export const CompleteDenturesIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Upper arch (Soft Mint #A7F3D0 - NO pink/skin color) */}
    <path d="M16 23 C 16 16, 48 16, 48 23 C 48 28, 46 29, 44 28 C 40 26, 24 26, 20 28 C 18 29, 16 28, 16 23 Z" fill="#A7F3D0" />
    {/* Upper row of teeth */}
    <path d="M19 24 C 20 24, 44 24, 45 24 L 44 29 C 40 31, 24 31, 20 29 Z" fill="white" />
    {/* Lower row of teeth */}
    <path d="M19 40 C 20 40, 44 40, 45 40 L 44 35 C 40 33, 24 33, 20 35 Z" fill="white" />
    {/* Lower arch (Soft Mint #A7F3D0 - NO pink/skin color) */}
    <path d="M16 41 C 16 48, 48 48, 48 41 C 48 36, 46 35, 44 36 C 40 38, 24 38, 20 36 C 18 35, 16 36, 16 41 Z" fill="#A7F3D0" />
    {/* Tooth divisions */}
    <line x1="25" y1="24" x2="25" y2="40" stroke="#047857" strokeWidth="1" />
    <line x1="32" y1="24" x2="32" y2="40" stroke="#047857" strokeWidth="1" />
    <line x1="39" y1="24" x2="39" y2="40" stroke="#047857" strokeWidth="1" />
  </svg>
);

export const DentalCleaningIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Base (Soft Mint #D1FAE5 - NO skin color) */}
    <path d="M12 50 C 22 45, 42 45, 52 50 L 52 58 L 12 58 Z" fill="#D1FAE5" />
    {/* Tooth */}
    <path 
      d="M24 27 C 24 21, 28 21, 32 23 C 36 21, 40 21, 40 27 C 40 33, 38 39, 36 47 C 35 50, 34 49, 33 45 C 33 41, 33 37, 32 37 C 31 37, 31 41, 31 45 C 30 49, 29 50, 28 47 C 26 39, 24 33, 24 27 Z" 
      fill="white" 
    />
    {/* Ultrasonic scaler probe */}
    <path d="M16 14 L 26 31" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M26 31 L 28 33" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
    {/* Spray */}
    <circle cx="30" cy="32" r="1" fill="#6EE7B7" />
    <circle cx="28" cy="35" r="1.2" fill="#6EE7B7" />
    <circle cx="31" cy="36" r="0.8" fill="#6EE7B7" />
  </svg>
);

export const DentalVeneersIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="64" height="64" rx="14" fill="#047857" />
    {/* Base (Soft Mint #D1FAE5 - NO skin color) */}
    <path d="M12 48 C 22 43, 42 43, 52 48 L 52 56 L 12 56 Z" fill="#D1FAE5" />
    {/* Prepared tooth */}
    <path 
      d="M24 28 C 24 23, 28 23, 32 25 C 36 23, 40 23, 40 28 C 40 34, 38 40, 36 47 C 34 49, 33 47, 32 41 C 31 47, 30 49, 28 47 C 26 40, 24 34, 24 28 Z" 
      fill="#E2E8F0" 
    />
    {/* Applicator stick */}
    <path d="M22 10 L 26 21" stroke="#A7F3D0" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="26" cy="21" rx="2" ry="1.2" fill="#6EE7B7" />
    {/* Veneer shell */}
    <path 
      d="M23 27 C 23 21, 28 21, 33 23 C 38 21, 41 22, 41 27 C 41 33, 39 37, 38 41 C 33 42, 27 42, 24 38 Z" 
      fill="white" 
      stroke="#10B981" 
      strokeWidth="1.5" 
    />
  </svg>
);

// Map of all 12 treatments to their corresponding SVG icon component
export const TREATMENT_ICON_MAP: Record<string, React.FC<IconProps>> = {
  'serv-aligner': AlignerIcon,
  'serv-dental-implants': DentalImplantsIcon,
  'serv-root-canal': RootCanalIcon,
  'serv-bridges': BridgesIcon,
  'serv-braces': BracesIcon,
  'serv-dental-bonding': DentalBondingIcon,
  'serv-tooth-extraction': ToothExtractionIcon,
  'serv-teeth-whitening': TeethWhiteningIcon,
  'serv-dental-jewellery': DentalJewelleryIcon,
  'serv-complete-dentures': CompleteDenturesIcon,
  'serv-dental-cleaning': DentalCleaningIcon,
  'serv-dental-veneers': DentalVeneersIcon,
};
