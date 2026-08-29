import React, { useId } from 'react';

interface RibbonIconProps {
  className?: string;
  size?: number | string;
  showBackground?: boolean;
  isPulsing?: boolean;
}

/**
 * SoulCare Transparent White Crystal Glass Orb Logo
 * Quả cầu thủy tinh trong suốt màu trắng tinh khiết, phát sáng trên nền
 * gradient xanh lá rèn luyện thói quen (#59be68 -> #65cca8 -> #80e5d8).
 */
export const RibbonIcon: React.FC<RibbonIconProps> = ({
  className = '',
  size = 32,
  showBackground = true,
  isPulsing = false,
}) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '');

  const bgGradId = `checkinGreenBg_${id}`;
  const whiteAuraGradId = `whiteAuraGrad_${id}`;
  const whiteGlassGradId = `whiteGlassGrad_${id}`;
  const whiteMist1Id = `whiteMist1_${id}`;
  const whiteMist2Id = `whiteMist2_${id}`;
  const whiteCoreGlowId = `whiteCoreGlow_${id}`;
  const whiteSpecId = `whiteSpec_${id}`;
  const whiteCausticId = `whiteCaustic_${id}`;
  const auraBlurId = `auraBlur_${id}`;
  const mistBlurId = `mistBlur_${id}`;
  const orbShadowId = `orbShadow_${id}`;

  const dim = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      style={{ width: dim, height: dim }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        isPulsing ? 'animate-pulse' : ''
      } ${className}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* 1. NỀN GRADIENT XANH LÁ RÈN LUYỆN THÓI QUEN (CHALLENGE CHECK-IN GREEN-TO-MINT) */}
          <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#59be68" />
            <stop offset="50%" stopColor="#65cca8" />
            <stop offset="100%" stopColor="#80e5d8" />
          </linearGradient>

          {/* 2. BỘ LỌC BLUR CHO QUẢ CẦU THỦY TINH TRONG SUỐT FROSTED */}
          <filter id={auraBlurId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
          </filter>

          <filter id={mistBlurId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
          </filter>

          <filter id={orbShadowId} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#045220" floodOpacity="0.25" />
          </filter>

          {/* 3. HÀO QUANG TRẮNG TRONG SUỐT PHÁT SÁNG (WHITE AURA GLOW) */}
          <radialGradient id={whiteAuraGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* 4. VỎ CẦU THỦY TINH TRẮNG TRONG SUỐT (TRANSLUCENT WHITE GLASS SHELL) */}
          <radialGradient id={whiteGlassGradId} cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.75" />
          </radialGradient>

          {/* 5. LÕI SƯƠNG MỜ TRẮNG TRONG SUỐT BÊN TRONG (WHITE FROSTED NEBULA) */}
          <radialGradient id={whiteMist1Id} cx="38%" cy="46%" r="48%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={whiteMist2Id} cx="64%" cy="38%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* 6. TÂM SÁNG TRẮNG DỊU DÀNG (CENTER WHITE RADIANCE) */}
          <radialGradient id={whiteCoreGlowId} cx="50%" cy="50%" r="35%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* 7. VỆT KHÚC XẠ PHẢN QUANG LƯỠI LIỀM TRẮNG (GLOSSY WHITE SPECULAR CRESCENT) */}
          <linearGradient id={whiteSpecId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* 8. VÒNG SÁNG ĐÁY THỦY TINH (WHITE CAUSTIC RIM ARC) */}
          <linearGradient id={whiteCausticId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* NỀN GRADIENT XANH LÁ (CHALLENGE CHECK-IN THEME SQUIRCLE) */}
        {showBackground && (
          <>
            <rect
              x="2"
              y="2"
              width="96"
              height="96"
              rx="24"
              fill={`url(#${bgGradId})`}
            />
            {/* Subtle gloss wave across background */}
            <path
              d="M 2 35 Q 50 15 98 42 L 98 2 Q 98 2 98 2 L 2 2 Z"
              fill="#ffffff"
              fillOpacity="0.16"
            />
          </>
        )}

        {/* 1. HÀO QUANG TRẮNG BLUR XUNG QUANH QUẢ CẦU */}
        <circle
          cx="50"
          cy="50"
          r={showBackground ? 32 : 40}
          fill={`url(#${whiteAuraGradId})`}
          filter={`url(#${auraBlurId})`}
        />

        {/* 2. QUẢ CẦU THỦY TINH TRONG SUỐT MÀU TRẮNG (TRANSPARENT WHITE GLASS ORB) */}
        <g filter={`url(#${orbShadowId})`}>
          {/* Vỏ cầu thủy tinh trong suốt viền trắng tinh tế */}
          <circle
            cx="50"
            cy="50"
            r={showBackground ? 28 : 36}
            fill={`url(#${whiteGlassGradId})`}
            stroke="#ffffff"
            strokeWidth={showBackground ? 1.5 : 1.8}
            strokeOpacity="0.85"
          />

          {/* Sương mờ trắng chuyển động bên trong quả cầu */}
          <g filter={`url(#${mistBlurId})`}>
            <ellipse
              cx={showBackground ? 45 : 44}
              cy={showBackground ? 48 : 48}
              rx={showBackground ? 20 : 25}
              ry={showBackground ? 17 : 21}
              fill={`url(#${whiteMist1Id})`}
            />
            <ellipse
              cx={showBackground ? 55 : 56}
              cy={showBackground ? 44 : 43}
              rx={showBackground ? 16 : 21}
              ry={showBackground ? 13 : 17}
              fill={`url(#${whiteMist2Id})`}
            />
            <circle
              cx="50"
              cy="50"
              r={showBackground ? 14 : 17}
              fill={`url(#${whiteCoreGlowId})`}
            />
          </g>

          {/* Vạch khúc xạ đáy sáng bóng của quả cầu thủy tinh */}
          <path
            d={
              showBackground
                ? "M 32 63 C 38 74, 62 74, 68 63"
                : "M 27 67 C 35 81, 65 81, 73 67"
            }
            stroke={`url(#${whiteCausticId})`}
            strokeWidth={showBackground ? 2.5 : 3.2}
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
          />

          {/* Ánh phản chiếu lưỡi liềm bề mặt kính cong (Glossy Specular Crescent Glare) */}
          <path
            d={
              showBackground
                ? "M 30 42 C 32 29, 45 25, 59 26 C 48 27, 37 32, 34 44 Z"
                : "M 25 40 C 28 24, 44 18, 62 20 C 48 21, 34 28, 29 43 Z"
            }
            fill={`url(#${whiteSpecId})`}
            opacity="0.95"
          />

          {/* Đốm sáng ngọc trai phản chiếu trên kính */}
          <circle
            cx={showBackground ? 39 : 36}
            cy={showBackground ? 33 : 30}
            r={showBackground ? 2.6 : 3.2}
            fill="#ffffff"
            fillOpacity="0.98"
          />
          <circle
            cx={showBackground ? 46 : 44}
            cy={showBackground ? 29 : 25}
            r={showBackground ? 1.3 : 1.6}
            fill="#ffffff"
            fillOpacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
};
