import React from 'react';

export type OrbThemeColor = 'mint' | 'amber' | 'lavender' | 'rose' | 'ocean';

export interface OrbColorConfig {
  id: OrbThemeColor;
  name: string;
  emotionLabel: string;
  primaryHex: string;
  glowClass: string;
  coreGradient: string;
  mistGradient1: string;
  mistGradient2: string;
  ringColor: string;
  shadowColor: string;
  accentPillBg: string;
  accentPillText: string;
}

export const ORB_THEMES: Record<OrbThemeColor, OrbColorConfig> = {
  mint: {
    id: 'mint',
    name: 'Xanh Ngọc Chánh Niệm',
    emotionLabel: 'Bình an & Cân bằng',
    primaryHex: '#34d399',
    glowClass: 'from-emerald-400/70 via-teal-300/50 to-cyan-400/60',
    coreGradient: 'radial-gradient(circle at 45% 45%, rgba(209, 250, 229, 0.95) 0%, rgba(52, 211, 153, 0.8) 35%, rgba(16, 185, 129, 0.6) 65%, rgba(4, 120, 87, 0.4) 100%)',
    mistGradient1: 'radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.9) 0%, rgba(167,243,208,0.7) 40%, rgba(16,185,129,0) 75%)',
    mistGradient2: 'radial-gradient(circle at 60% 35%, rgba(204,251,241,0.85) 0%, rgba(45,212,191,0.5) 50%, transparent 80%)',
    ringColor: 'rgba(52, 211, 153, 0.45)',
    shadowColor: 'rgba(16, 185, 129, 0.35)',
    accentPillBg: 'bg-emerald-500/20 border-emerald-500/30',
    accentPillText: 'text-emerald-300',
  },
  amber: {
    id: 'amber',
    name: 'Hổ Phách Ấm Áp',
    emotionLabel: 'Năng lượng & Tươi vui',
    primaryHex: '#f59e0b',
    glowClass: 'from-amber-400/80 via-orange-400/50 to-yellow-300/60',
    coreGradient: 'radial-gradient(circle at 45% 45%, rgba(254, 243, 199, 0.95) 0%, rgba(245, 158, 11, 0.85) 40%, rgba(217, 119, 6, 0.6) 70%, rgba(180, 83, 9, 0.4) 100%)',
    mistGradient1: 'radial-gradient(ellipse at 45% 55%, rgba(255,255,255,0.9) 0%, rgba(253,230,138,0.75) 40%, rgba(245,158,11,0) 75%)',
    mistGradient2: 'radial-gradient(circle at 55% 40%, rgba(254,215,170,0.85) 0%, rgba(234,88,12,0.5) 50%, transparent 80%)',
    ringColor: 'rgba(245, 158, 11, 0.45)',
    shadowColor: 'rgba(245, 158, 11, 0.35)',
    accentPillBg: 'bg-amber-500/20 border-amber-500/30',
    accentPillText: 'text-amber-300',
  },
  lavender: {
    id: 'lavender',
    name: 'Tím Oải Hương Dịu Êm',
    emotionLabel: 'Thả lỏng & Giải tỏa',
    primaryHex: '#a855f7',
    glowClass: 'from-purple-400/70 via-indigo-400/50 to-cyan-300/60',
    coreGradient: 'radial-gradient(circle at 45% 45%, rgba(243, 232, 255, 0.95) 0%, rgba(168, 85, 247, 0.8) 35%, rgba(129, 140, 248, 0.6) 65%, rgba(79, 70, 229, 0.4) 100%)',
    mistGradient1: 'radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.9) 0%, rgba(233,213,255,0.75) 40%, rgba(168,85,247,0) 75%)',
    mistGradient2: 'radial-gradient(circle at 60% 40%, rgba(199,210,254,0.85) 0%, rgba(99,102,241,0.5) 50%, transparent 80%)',
    ringColor: 'rgba(168, 85, 247, 0.45)',
    shadowColor: 'rgba(168, 85, 247, 0.35)',
    accentPillBg: 'bg-purple-500/20 border-purple-500/30',
    accentPillText: 'text-purple-300',
  },
  rose: {
    id: 'rose',
    name: 'Hồng Thạch Anh Biết Ơn',
    emotionLabel: 'Yêu thương & Biết ơn',
    primaryHex: '#fb7185',
    glowClass: 'from-rose-400/70 via-pink-400/50 to-amber-300/60',
    coreGradient: 'radial-gradient(circle at 45% 45%, rgba(255, 228, 230, 0.95) 0%, rgba(251, 113, 133, 0.8) 35%, rgba(244, 63, 94, 0.6) 65%, rgba(190, 18, 60, 0.4) 100%)',
    mistGradient1: 'radial-gradient(ellipse at 45% 50%, rgba(255,255,255,0.9) 0%, rgba(254,205,211,0.75) 40%, rgba(244,63,94,0) 75%)',
    mistGradient2: 'radial-gradient(circle at 55% 35%, rgba(253,164,175,0.85) 0%, rgba(225,29,72,0.5) 50%, transparent 80%)',
    ringColor: 'rgba(251, 113, 133, 0.45)',
    shadowColor: 'rgba(244, 63, 94, 0.35)',
    accentPillBg: 'bg-rose-500/20 border-rose-500/30',
    accentPillText: 'text-rose-300',
  },
  ocean: {
    id: 'ocean',
    name: 'Xanh Lam Đại Dương',
    emotionLabel: 'Tĩnh tâm & Sâu lắng',
    primaryHex: '#38bdf8',
    glowClass: 'from-sky-400/70 via-cyan-400/50 to-blue-500/60',
    coreGradient: 'radial-gradient(circle at 45% 45%, rgba(224, 242, 254, 0.95) 0%, rgba(56, 189, 248, 0.8) 35%, rgba(14, 165, 233, 0.6) 65%, rgba(3, 105, 161, 0.4) 100%)',
    mistGradient1: 'radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.9) 0%, rgba(186,230,253,0.75) 40%, rgba(56,189,248,0) 75%)',
    mistGradient2: 'radial-gradient(circle at 60% 40%, rgba(165,243,252,0.85) 0%, rgba(6,182,212,0.5) 50%, transparent 80%)',
    ringColor: 'rgba(56, 189, 248, 0.45)',
    shadowColor: 'rgba(14, 165, 233, 0.35)',
    accentPillBg: 'bg-sky-500/20 border-sky-500/30',
    accentPillText: 'text-sky-300',
  },
};

interface CrystalGlassOrbProps {
  theme?: OrbThemeColor;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStand?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  showGlow?: boolean;
  pulseSpeed?: 'slow' | 'normal' | 'fast';
}

export const CrystalGlassOrb: React.FC<CrystalGlassOrbProps> = ({
  theme = 'mint',
  size = 'md',
  showStand = false,
  interactive = false,
  onClick,
  className = '',
  showGlow = true,
  pulseSpeed = 'normal',
}) => {
  const config = ORB_THEMES[theme] || ORB_THEMES.mint;

  const sizeDimensions = {
    xs: { orb: 'w-7 h-7', outer: 'w-7 h-7', blur: 'blur-xs', standW: 'w-5', standH: 'h-1' },
    sm: { orb: 'w-10 h-10', outer: 'w-10 h-10', blur: 'blur-sm', standW: 'w-8', standH: 'h-1.5' },
    md: { orb: 'w-14 h-14', outer: 'w-14 h-14', blur: 'blur-md', standW: 'w-10', standH: 'h-2' },
    lg: { orb: 'w-32 h-32', outer: 'w-32 h-32', blur: 'blur-xl', standW: 'w-24', standH: 'h-3' },
    xl: { orb: 'w-52 h-52', outer: 'w-52 h-52', blur: 'blur-2xl', standW: 'w-36', standH: 'h-4' },
  }[size];

  const pulseAnimation = {
    slow: 'duration-[6000ms]',
    normal: 'duration-[4000ms]',
    fast: 'duration-[2000ms]',
  }[pulseSpeed];

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center select-none ${
        interactive ? 'cursor-pointer group hover:scale-105 active:scale-95 transition-all duration-300' : ''
      } ${className}`}
    >
      {/* Outer Ethereal Atmosphere Aura Glow */}
      {showGlow && (
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr ${config.glowClass} opacity-60 ${sizeDimensions.blur} animate-pulse ${pulseAnimation} pointer-events-none transition-all duration-700`}
        />
      )}

      {/* Main Glass Sphere Shell */}
      <div
        className={`relative ${sizeDimensions.orb} rounded-full overflow-hidden flex items-center justify-center transition-all duration-700`}
        style={{
          boxShadow: `0 8px 32px 0 ${config.shadowColor}, inset 0 0 0 1.5px rgba(255, 255, 255, 0.4), inset 0 -6px 14px rgba(0,0,0,0.3)`,
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Deep Radiant Core Swirl */}
        <div
          className="absolute inset-1 rounded-full transition-all duration-700 opacity-90 animate-pulse"
          style={{ background: config.coreGradient }}
        />

        {/* Ethereal Misty Clouds & Swirling Fog Layers */}
        <div
          className="absolute inset-0 rounded-full opacity-80 mix-blend-screen animate-spin"
          style={{
            background: config.mistGradient1,
            animationDuration: '14s',
            animationTimingFunction: 'linear',
          }}
        />

        <div
          className="absolute inset-0 rounded-full opacity-70 mix-blend-overlay animate-spin"
          style={{
            background: config.mistGradient2,
            animationDuration: '9s',
            animationDirection: 'reverse',
            animationTimingFunction: 'ease-in-out',
          }}
        />

        {/* Dynamic Center Wisp / Fluid Smoke Core (Simulating Stitch Artwork) */}
        <div
          className="absolute inset-2 rounded-full opacity-60 filter blur-[2px] animate-pulse"
          style={{
            background: 'radial-gradient(circle at 48% 48%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.4) 30%, transparent 70%)',
          }}
        />

        {/* Specular Curved Light Glare Top Left */}
        <div
          className="absolute top-1 left-2 rounded-full bg-white/70 blur-[0.5px] -rotate-45"
          style={{
            width: size === 'xl' ? '60px' : size === 'lg' ? '36px' : size === 'md' ? '16px' : '10px',
            height: size === 'xl' ? '28px' : size === 'lg' ? '16px' : size === 'md' ? '8px' : '5px',
          }}
        />

        {/* Subtle Rim Refraction Bottom Right */}
        <div
          className="absolute bottom-1 right-2 rounded-full bg-white/40 blur-[0.5px]"
          style={{
            width: size === 'xl' ? '32px' : size === 'lg' ? '20px' : size === 'md' ? '10px' : '6px',
            height: size === 'xl' ? '14px' : size === 'lg' ? '8px' : size === 'md' ? '4px' : '3px',
          }}
        />
      </div>

      {/* Glass Pedestal Stand Reflection (As in Stitch reference photos 2, 3, 4) */}
      {showStand && (
        <div className="flex flex-col items-center mt-1.5 opacity-80">
          <div
            className={`${sizeDimensions.standW} ${sizeDimensions.standH} rounded-full bg-white/10 border border-white/25 shadow-lg backdrop-blur-md`}
            style={{
              boxShadow: `0 4px 12px ${config.shadowColor}`,
            }}
          />
        </div>
      )}
    </div>
  );
};
