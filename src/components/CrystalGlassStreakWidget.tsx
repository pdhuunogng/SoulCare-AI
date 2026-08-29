import React, { useState, useEffect } from 'react';
import { UserChallengeProgress } from '../types';

interface CrystalGlassStreakWidgetProps {
  challengeProgress?: UserChallengeProgress | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
}

// 6 Soothing Auto-Cycling Aura Color Themes
const AURA_PALETTES = [
  {
    id: 'aurora-mint',
    name: 'Xanh Băng Ngọc',
    coreGlow: 'radial-gradient(circle at 50% 50%, rgba(110, 231, 183, 0.45) 0%, rgba(52, 211, 153, 0.25) 45%, rgba(16, 185, 129, 0.05) 70%, transparent 100%)',
    flameStroke: 'url(#rainbow-gradient-mint)',
    textGradient: 'from-amber-200 via-rose-300 to-teal-200',
    ambientShadow: 'rgba(52, 211, 153, 0.25)',
    outerAura: 'from-emerald-400/20 via-teal-300/15 to-cyan-400/10',
  },
  {
    id: 'sunset-coral',
    name: 'San Hô Hoàng Hôn',
    coreGlow: 'radial-gradient(circle at 50% 50%, rgba(253, 186, 116, 0.45) 0%, rgba(251, 146, 60, 0.25) 45%, rgba(244, 63, 94, 0.05) 70%, transparent 100%)',
    flameStroke: 'url(#rainbow-gradient-sunset)',
    textGradient: 'from-yellow-200 via-orange-300 to-rose-300',
    ambientShadow: 'rgba(251, 146, 60, 0.25)',
    outerAura: 'from-orange-400/20 via-rose-400/15 to-amber-400/10',
  },
  {
    id: 'mystic-violet',
    name: 'Tím Cực Quang',
    coreGlow: 'radial-gradient(circle at 50% 50%, rgba(196, 181, 253, 0.45) 0%, rgba(167, 139, 250, 0.25) 45%, rgba(139, 92, 246, 0.05) 70%, transparent 100%)',
    flameStroke: 'url(#rainbow-gradient-violet)',
    textGradient: 'from-indigo-200 via-purple-300 to-pink-200',
    ambientShadow: 'rgba(167, 139, 250, 0.25)',
    outerAura: 'from-purple-400/20 via-indigo-400/15 to-pink-400/10',
  },
  {
    id: 'ocean-cyan',
    name: 'Lam Hải Lưu',
    coreGlow: 'radial-gradient(circle at 50% 50%, rgba(125, 211, 252, 0.45) 0%, rgba(56, 189, 248, 0.25) 45%, rgba(14, 165, 233, 0.05) 70%, transparent 100%)',
    flameStroke: 'url(#rainbow-gradient-ocean)',
    textGradient: 'from-cyan-200 via-sky-300 to-indigo-200',
    ambientShadow: 'rgba(56, 189, 248, 0.25)',
    outerAura: 'from-cyan-400/20 via-sky-400/15 to-blue-400/10',
  },
  {
    id: 'rose-quartz',
    name: 'Hồng Thạch Anh',
    coreGlow: 'radial-gradient(circle at 50% 50%, rgba(254, 205, 211, 0.45) 0%, rgba(251, 113, 133, 0.25) 45%, rgba(225, 29, 72, 0.05) 70%, transparent 100%)',
    flameStroke: 'url(#rainbow-gradient-rose)',
    textGradient: 'from-rose-200 via-pink-300 to-amber-200',
    ambientShadow: 'rgba(251, 113, 133, 0.25)',
    outerAura: 'from-rose-400/20 via-pink-400/15 to-amber-300/10',
  },
  {
    id: 'celestial-gold',
    name: 'Ánh Kim Ban Mai',
    coreGlow: 'radial-gradient(circle at 50% 50%, rgba(253, 224, 71, 0.4) 0%, rgba(234, 179, 8, 0.2) 45%, rgba(202, 138, 4, 0.05) 70%, transparent 100%)',
    flameStroke: 'url(#rainbow-gradient-gold)',
    textGradient: 'from-amber-200 via-yellow-300 to-emerald-200',
    ambientShadow: 'rgba(234, 179, 8, 0.25)',
    outerAura: 'from-amber-400/20 via-yellow-400/15 to-orange-400/10',
  },
];

export const CrystalGlassStreakWidget: React.FC<CrystalGlassStreakWidgetProps> = ({
  challengeProgress,
  className = '',
  size = 'md',
  interactive = true,
  onClick,
}) => {
  const [currentPaletteIndex, setCurrentPaletteIndex] = useState(0);

  // Automatic Smooth Color Transition Cycle (Changes every 6.5 seconds automatically without user options)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPaletteIndex((prev) => (prev + 1) % AURA_PALETTES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const palette = AURA_PALETTES[currentPaletteIndex];

  const completed = challengeProgress ? challengeProgress.daysCompletedCount : 0;
  const total = challengeProgress ? challengeProgress.totalDays : 21;
  const streakDisplay = `${completed}/${total}`;

  // Dimensions based on size prop
  const orbSizeClasses = {
    sm: 'w-36 h-36',
    md: 'w-48 h-48',
    lg: 'w-60 h-60',
  }[size];

  const fontSizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }[size];

  const flameSize = {
    sm: 32,
    md: 42,
    lg: 54,
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      title="Widget Quả Cầu Pha Lê (Tự động đổi màu chuyển sắc)"
    >
      {/* SVG Gradient Definitions for Iridescent Rainbow Neon Outline */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="rainbow-gradient-mint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="25%" stopColor="#fb923c" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="75%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          <linearGradient id="rainbow-gradient-sunset" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <linearGradient id="rainbow-gradient-violet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="30%" stopColor="#818cf8" />
            <stop offset="70%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>

          <linearGradient id="rainbow-gradient-ocean" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="35%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>

          <linearGradient id="rainbow-gradient-rose" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="35%" stopColor="#fb7185" />
            <stop offset="70%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id="rainbow-gradient-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#facc15" />
            <stop offset="70%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>
      </svg>

      {/* Outer Ethereal Atmosphere Aura Glow */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${palette.outerAura} blur-2xl opacity-60 transition-all duration-1000 ease-in-out pointer-events-none group-hover:opacity-80`}
      />

      {/* Main Frosted Translucent Crystal Glass Sphere Shell */}
      <div
        className={`relative ${orbSizeClasses} rounded-full overflow-hidden flex items-center justify-center transition-all duration-700 backdrop-blur-md shadow-2xl`}
        style={{
          boxShadow: `
            0 24px 48px -12px ${palette.ambientShadow},
            0 12px 24px -8px rgba(0, 0, 0, 0.08),
            inset 0 0 0 1.5px rgba(255, 255, 255, 0.75),
            inset 0 2px 6px rgba(255, 255, 255, 0.9),
            inset 0 -8px 20px rgba(0, 0, 0, 0.06)
          `,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(240, 245, 243, 0.2) 60%, rgba(255, 255, 255, 0.3) 100%)',
        }}
      >
        {/* Soft Inner Atmosphere Glow (Auto-Cycling Color) */}
        <div
          className="absolute inset-2 rounded-full transition-all duration-1000 ease-in-out opacity-90"
          style={{ background: palette.coreGlow }}
        />

        {/* Subtle Swirling Mist Cloud (Slow breathing motion) */}
        <div
          className="absolute inset-0 rounded-full opacity-40 mix-blend-screen animate-spin"
          style={{
            background: 'radial-gradient(ellipse at 45% 55%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%)',
            animationDuration: '24s',
            animationTimingFunction: 'linear',
          }}
        />

        {/* Center Content: Iridescent Neon Outline Flame + Glowing Streak Text */}
        <div className="relative z-10 flex items-center justify-center gap-2.5 transition-transform duration-300 group-hover:scale-105">
          {/* Iridescent Neon Flame Icon */}
          <div className="relative flex items-center justify-center">
            {/* Outer Flame Glow */}
            <svg
              width={flameSize}
              height={flameSize}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 blur-[3px] opacity-75"
            >
              <path
                d="M12 2C9.5 5 7 8 7 12C7 15.866 10.134 19 14 19C17.866 19 21 15.866 21 12C21 9 18.5 6.5 17 5C17 7.5 15.5 9 14 9C12.5 9 12 7.5 12 5.5C12 4 12.5 3 12 2Z"
                fill="none"
                stroke={palette.flameStroke}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 13C10 15 11.5 17 14 17C15.5 17 17 15.5 17 14C17 12.5 15.5 11.5 14.5 11.5C13.5 11.5 13 12.5 12 12.5C11 12.5 10 12 10 13Z"
                fill="none"
                stroke={palette.flameStroke}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Crisp Iridescent Flame Vector */}
            <svg
              width={flameSize}
              height={flameSize}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.7)]"
            >
              {/* Outer Flame Contour */}
              <path
                d="M12 2.5C9.5 5.5 7 8.2 7 12.2C7 16.066 10.134 19.2 14 19.2C17.866 19.2 21 16.066 21 12.2C21 9.2 18.5 6.8 17 5.2C17 7.7 15.5 9.2 14 9.2C12.5 9.2 12 7.7 12 5.7C12 4.2 12.5 3.3 12 2.5Z"
                fill="none"
                stroke={palette.flameStroke}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Inner Flame Swirl */}
              <path
                d="M10.5 13.5C10.5 15.5 12 17 14 17C15.5 17 17 15.8 17 14.2C17 12.8 15.8 11.8 14.5 11.8C13.2 11.8 12.8 12.8 12 12.8C11.2 12.8 10.5 12.2 10.5 13.5Z"
                fill="none"
                stroke={palette.flameStroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Glowing Translucent Iridescent Streak Number Text (e.g. 5/7) */}
          <span
            className={`font-black font-mono tracking-tight ${fontSizeClasses} relative`}
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              background: 'linear-gradient(135deg, #fef08a 0%, #fb923c 30%, #f472b6 60%, #60a5fa 85%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 6px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 12px rgba(251, 146, 60, 0.35))',
            }}
          >
            {streakDisplay}
          </span>
        </div>

        {/* Top-Left Specular Curved Light Reflection Glare */}
        <div
          className="absolute top-2 left-3 rounded-full bg-white/75 blur-[0.6px] -rotate-45 pointer-events-none"
          style={{
            width: size === 'lg' ? '44px' : size === 'md' ? '32px' : '22px',
            height: size === 'lg' ? '18px' : size === 'md' ? '12px' : '8px',
          }}
        />

        {/* Subtle Top-Right Secondary Glint */}
        <div
          className="absolute top-4 right-5 rounded-full bg-white/50 blur-[0.8px] pointer-events-none"
          style={{
            width: size === 'lg' ? '14px' : size === 'md' ? '10px' : '7px',
            height: size === 'lg' ? '8px' : size === 'md' ? '6px' : '4px',
          }}
        />

        {/* Bottom-Right Translucent Glass Rim Light */}
        <div
          className="absolute bottom-2.5 right-4 rounded-full bg-white/40 blur-[0.8px] pointer-events-none"
          style={{
            width: size === 'lg' ? '28px' : size === 'md' ? '20px' : '14px',
            height: size === 'lg' ? '10px' : size === 'md' ? '7px' : '5px',
          }}
        />
      </div>

      {/* Soft Grounding Ambient Shadow Underneath the Sphere */}
      <div
        className="rounded-full blur-md opacity-35 transition-all duration-1000 mt-2 pointer-events-none"
        style={{
          width: size === 'lg' ? '120px' : size === 'md' ? '90px' : '65px',
          height: size === 'lg' ? '12px' : size === 'md' ? '9px' : '6px',
          backgroundColor: palette.ambientShadow,
          boxShadow: `0 8px 16px ${palette.ambientShadow}`,
        }}
      />
    </div>
  );
};
