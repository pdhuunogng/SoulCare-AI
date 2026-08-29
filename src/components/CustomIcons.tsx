import React from 'react';

export type CustomEmotionType =
  | 'Tươi vui'
  | 'Ổn định'
  | 'Hạnh phúc'
  | 'Biết ơn'
  | 'Mệt mỏi'
  | 'Căng thẳng'
  | 'Bối rối'
  | 'Mất ngủ'
  | string;

interface EmotionIconProps {
  emotion: CustomEmotionType;
  size?: number | string;
  className?: string;
  variant?: 'outline' | 'filled' | 'pastel';
  showBackground?: boolean;
}

/**
 * Custom-designed Emotion Vector Icons for SoulCare
 * Minimalist, warm, mindfulness Zen-aesthetic vector faces with expressive curves and blush accents.
 */
export const EmotionIcon: React.FC<EmotionIconProps> = ({
  emotion,
  size = 28,
  className = '',
  variant = 'filled',
  showBackground = false,
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  // Emotion specific color and face data
  switch (emotion) {
    case 'Tươi vui':
      return (
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 select-none ${className}`}
        >
          {showBackground && (
            <circle cx="18" cy="18" r="17" fill="#fef3c7" stroke="#fde047" strokeWidth="1.5" />
          )}
          {/* Eyes: Cheerful upward arcs */}
          <path
            d="M10.5 14.5C11.5 12.5 13.5 12.5 14.5 14.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M21.5 14.5C22.5 12.5 24.5 12.5 25.5 14.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Cheeks: Cute blush */}
          <circle cx="9" cy="19" r="2.2" fill="#f59e0b" fillOpacity="0.4" />
          <circle cx="27" cy="19" r="2.2" fill="#f59e0b" fillOpacity="0.4" />
          {/* Mouth: Bright radiant smile */}
          <path
            d="M12 20.5C13.5 24.5 22.5 24.5 24 20.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M13 21C14.5 24 21.5 24 23 21"
            fill="#f59e0b"
            fillOpacity="0.3"
          />
        </svg>
      );

    case 'Ổn định':
      return (
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 select-none ${className}`}
        >
          {showBackground && (
            <circle cx="18" cy="18" r="17" fill="#e0f5ea" stroke="#67c76c" strokeWidth="1.5" />
          )}
          {/* Zen resting closed curved eyes */}
          <path
            d="M10 16C11.5 17.5 14 17.5 15.5 16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M20.5 16C22 17.5 24.5 17.5 26 16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Peaceful soft blush */}
          <circle cx="9.5" cy="19" r="2" fill="#006e22" fillOpacity="0.25" />
          <circle cx="26.5" cy="19" r="2" fill="#006e22" fillOpacity="0.25" />
          {/* Calm peaceful gentle smile */}
          <path
            d="M13.5 22C15.5 24 20.5 24 22.5 22"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'Hạnh phúc':
      return (
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 select-none ${className}`}
        >
          {showBackground && (
            <circle cx="18" cy="18" r="17" fill="#fce7f3" stroke="#f472b6" strokeWidth="1.5" />
          )}
          {/* Beaming curved joyful eyes */}
          <path
            d="M10 14C11.5 11.5 14 11.5 15.5 14"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M20.5 14C22 11.5 24.5 11.5 26 14"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Little happiness stars / sparkles */}
          <path d="M7 11L7.8 12.5L9.5 13L8 14L8.5 15.5L7 14.5L5.5 15.5L6 14L4.5 13L6.2 12.5L7 11Z" fill="#ec4899" fillOpacity="0.7" />
          <path d="M29 11L29.8 12.5L31.5 13L30 14L30.5 15.5L29 14.5L27.5 15.5L28 14L26.5 13L28.2 12.5L29 11Z" fill="#ec4899" fillOpacity="0.7" />
          {/* Glowing heart-toned blush */}
          <circle cx="9.5" cy="19.5" r="2.5" fill="#f43f5e" fillOpacity="0.4" />
          <circle cx="26.5" cy="19.5" r="2.5" fill="#f43f5e" fillOpacity="0.4" />
          {/* Wide radiant smile with open curve */}
          <path
            d="M11 20.5C12.5 25.5 23.5 25.5 25 20.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M12.5 21C14 24.5 22 24.5 23.5 21"
            fill="#f43f5e"
            fillOpacity="0.3"
          />
        </svg>
      );

    case 'Biết ơn':
      return (
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 select-none ${className}`}
        >
          {showBackground && (
            <circle cx="18" cy="18" r="17" fill="#ffe4e6" stroke="#fb7185" strokeWidth="1.5" />
          )}
          {/* Soft loving curved eyes */}
          <path
            d="M10 15C11.5 13.5 14 13.5 15.5 15"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M20.5 15C22 13.5 24.5 13.5 26 15"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Cute mini heart accents on cheeks */}
          <path
            d="M8.5 19.5C8.5 18.5 9.5 18 10.2 18.8C10.9 18 11.9 18.5 11.9 19.5C11.9 20.8 10.2 21.8 10.2 21.8C10.2 21.8 8.5 20.8 8.5 19.5Z"
            fill="#e11d48"
            fillOpacity="0.45"
          />
          <path
            d="M24.1 19.5C24.1 18.5 25.1 18 25.8 18.8C26.5 18 27.5 18.5 27.5 19.5C27.5 20.8 25.8 21.8 25.8 21.8C25.8 21.8 24.1 20.8 24.1 19.5Z"
            fill="#e11d48"
            fillOpacity="0.45"
          />
          {/* Tender thankful smile */}
          <path
            d="M13 22C15 24.5 21 24.5 23 22"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'Mệt mỏi':
      return (
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 select-none ${className}`}
        >
          {showBackground && (
            <circle cx="18" cy="18" r="17" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5" />
          )}
          {/* Droopy, low-energy closed eyes */}
          <path
            d="M9.5 17C11.5 15.5 14 16 15.5 17.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M20.5 17.5C22 16 24.5 15.5 26.5 17"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Soft tired blush */}
          <circle cx="9.5" cy="20.5" r="2" fill="#3b82f6" fillOpacity="0.3" />
          <circle cx="26.5" cy="20.5" r="2" fill="#3b82f6" fillOpacity="0.3" />
          {/* Weary flat / slightly undulating mouth */}
          <path
            d="M13 23C15 22.5 17 23.5 19 23C21 22.5 23 23 23"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'Căng thẳng':
      return (
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 select-none ${className}`}
        >
          {showBackground && (
            <circle cx="18" cy="18" r="17" fill="#f3e8ff" stroke="#d8b4fe" strokeWidth="1.5" />
          )}
          {/* Concerned angled brows */}
          <path
            d="M10 11.5L15 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M26 11.5L21 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Wide tense dot eyes */}
          <circle cx="12.5" cy="16" r="2.2" fill="currentColor" />
          <circle cx="23.5" cy="16" r="2.2" fill="currentColor" />
          {/* Little tension sweat droplet */}
          <path
            d="M28 11.5C28 11.5 29.5 13.5 29.5 14.5C29.5 15.3 28.8 16 28 16C27.2 16 26.5 15.3 26.5 14.5C26.5 13.5 28 11.5 28 11.5Z"
            fill="#9333ea"
            fillOpacity="0.75"
          />
          {/* Wavy tense mouth */}
          <path
            d="M12 23C14 21.5 16 24 18 22.5C20 21 22 23.5 24 22"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'Bối rối':
      return (
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 select-none ${className}`}
        >
          {showBackground && (
            <circle cx="18" cy="18" r="17" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
          )}
          {/* Asymmetrical quizzical brows */}
          <path
            d="M10 11.5C11.5 10 13.5 10 15 11.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M21 13L26 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* One curious round eye and one squinting eye */}
          <circle cx="12.5" cy="16" r="2.2" fill="currentColor" />
          <path
            d="M21.5 16C23 15 25 15 26.5 16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Subtle blush */}
          <circle cx="9.5" cy="19.5" r="1.8" fill="#64748b" fillOpacity="0.3" />
          <circle cx="26.5" cy="19.5" r="1.8" fill="#64748b" fillOpacity="0.3" />
          {/* Puzzled tilted mouth */}
          <path
            d="M13 23C16 21.5 20 23.5 23 22"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'Mất ngủ':
      return (
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 select-none ${className}`}
        >
          {showBackground && (
            <circle cx="18" cy="18" r="17" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5" />
          )}
          {/* Heavy half-closed eyelids */}
          <path
            d="M9.5 16C11 14.5 14 14.5 15.5 16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="12.5" cy="16.5" r="1.3" fill="currentColor" />
          <path
            d="M20.5 16C22 14.5 25 14.5 26.5 16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="23.5" cy="16.5" r="1.3" fill="currentColor" />
          {/* Under-eye dark shadow circle / tired ring */}
          <path
            d="M10 18C11.5 20 13.5 20 15 18"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
          <path
            d="M21 18C22.5 20 24.5 20 26 18"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
          {/* Floating tiny Zzz */}
          <path
            d="M27 8H31L27 12H31"
            stroke="#6366f1"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Yawning / sleepy small oval mouth */}
          <ellipse
            cx="18"
            cy="23"
            rx="2.5"
            ry="3"
            stroke="currentColor"
            strokeWidth="2"
            fill="currentColor"
            fillOpacity="0.15"
          />
        </svg>
      );

    default:
      // Default serene face
      return (
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 select-none ${className}`}
        >
          {showBackground && (
            <circle cx="18" cy="18" r="17" fill="#e0f5ea" stroke="#67c76c" strokeWidth="1.5" />
          )}
          <circle cx="12.5" cy="15.5" r="2" fill="currentColor" />
          <circle cx="23.5" cy="15.5" r="2" fill="currentColor" />
          <circle cx="9.5" cy="19" r="2" fill="#006e22" fillOpacity="0.25" />
          <circle cx="26.5" cy="19" r="2" fill="#006e22" fillOpacity="0.25" />
          <path
            d="M13 21C14.5 23.5 21.5 23.5 23 21"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};

/**
 * Custom Tab & Feature Icons tailored for SoulCare
 */

export const ZenLeafIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    <path
      d="M20.5 3.5C20.5 3.5 14.5 3 9.5 8C5.5 12 5 17.5 5 17.5C5 17.5 10.5 17 14.5 13C19.5 8 20.5 3.5 20.5 3.5Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 17.5L12 10.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M3.5 20.5C5 19 6.5 17.5 6.5 17.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M11 6.5C12.5 8 13.5 9 13.5 9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const MoodFaceTabIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    <circle
      cx="12"
      cy="12"
      r="9.5"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="2"
    />
    {/* Joyful upward curved eyes */}
    <path
      d="M7.5 10C8.2 8.8 9.5 8.8 10.2 10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M13.8 10C14.5 8.8 15.8 8.8 16.5 10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Blush */}
    <circle cx="7" cy="13" r="1.3" fill="currentColor" fillOpacity="0.4" />
    <circle cx="17" cy="13" r="1.3" fill="currentColor" fillOpacity="0.4" />
    {/* Warm smile */}
    <path
      d="M8.5 14C9.8 16.5 14.2 16.5 15.5 14"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const AssessmentChartIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    <rect x="3" y="13" width="4.5" height="8" rx="2.2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" />
    <rect x="9.8" y="7" width="4.5" height="14" rx="2.2" fill="currentColor" fillOpacity="0.75" stroke="currentColor" strokeWidth="1.8" />
    <rect x="16.5" y="10" width="4.5" height="11" rx="2.2" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.8" />
    {/* Diagnostic trend line indicator */}
    <path d="M5.2 9L12 4L18.8 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="4" r="1.5" fill="currentColor" />
  </svg>
);

export const MindfulFlameIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    <path
      d="M12 2C10.5 5 8 7 8 10.5C8 12.5 9 14 10.5 15C9 13.5 9 11.5 10 10C11 11.5 12 12.5 12 14.5C12.5 13 13.5 11.5 15 10.5C15.5 12 16 13.5 16 14.5C16 18.5 13.5 21 12 21C7.5 21 4 17 4 12C4 7 8 4 12 2Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 21C15 21 18 18 18 14C18 10 15 7.5 14 6C14 8 13 9 12 10.5C11 9 10 7.5 10 6C9 7.5 6 10 6 14C6 18 9 21 12 21Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M12 18.5C13.5 18.5 14.5 17 14.5 15C14.5 13.5 13.5 12.5 12 11C10.5 12.5 9.5 13.5 9.5 15C9.5 17 10.5 18.5 12 18.5Z"
      fill="#fef08a"
    />
  </svg>
);

export const SleepMoonIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="18" cy="6" r="1" fill="currentColor" />
    <circle cx="15" cy="3.5" r="0.75" fill="currentColor" />
  </svg>
);

export const StrengthIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    <path
      d="M6 9V5C6 3.89543 6.89543 3 8 3H16C17.1046 3 18 3.89543 18 5V9C18 12.3137 15.3137 15 12 15C8.68629 15 6 12.3137 6 9Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M6 6H3C2.44772 6 2 6.44772 2 7V8C2 9.65685 3.34315 11 5 11H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M18 6H21C21.5523 6 22 6.44772 22 7V8C22 9.65685 20.6569 11 19 11H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 15V19M8 21H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const SparkleStarIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    <path
      d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="19" cy="5" r="1.5" fill="currentColor" />
  </svg>
);

export const HeartZenIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    <path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
