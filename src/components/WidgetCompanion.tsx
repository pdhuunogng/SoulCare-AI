import React, { useState } from 'react';
import { UserChallengeProgress } from '../types';
import { OrbThemeColor } from './CrystalGlassOrb';
import { Sparkles, Check, Flame, Wind } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import confetti from 'canvas-confetti';
import { CrystalGlassStreakWidget } from './CrystalGlassStreakWidget';

interface WidgetCompanionProps {
  challengeProgress: UserChallengeProgress | null;
  onCheckInStreak: () => void;
  onOpenBreathing: () => void;
  onOpenMusic: () => void;
  onNavigateToChallenge: () => void;
  currentOrbTheme?: OrbThemeColor;
  onChangeOrbTheme?: (theme: OrbThemeColor) => void;
}

export const WidgetCompanion: React.FC<WidgetCompanionProps> = ({
  challengeProgress,
  onCheckInStreak,
  onOpenBreathing,
  onOpenMusic,
  onNavigateToChallenge,
  currentOrbTheme,
  onChangeOrbTheme,
}) => {
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const streakCount = challengeProgress?.currentStreak ?? 5;
  const totalDays = challengeProgress?.totalDays ?? 7;
  const completedCount = challengeProgress?.daysCompletedCount ?? 5;

  const handleStreakClick = () => {
    onCheckInStreak();
    setJustCheckedIn(true);
    audioSynth.playChime(587, 1);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
      });
    } catch {
      // ignore
    }
    setTimeout(() => setJustCheckedIn(false), 3000);
  };

  return (
    <div className="p-4 space-y-4 text-[#181d16] font-sans">
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#e0f5ea] text-[#006e22] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[#181d16] text-xs">Widget Màn Hình 2x2 Pha Lê</h4>
            <p className="text-[10px] text-[#6f7a6c]">Quả cầu thủy tinh tự chuyển sắc theo nhịp sinh học</p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] text-[10px] font-bold border border-[#67c76c]/30 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-500 fill-amber-400" />
          <span>{completedCount}/{totalDays} Ngày</span>
        </span>
      </div>

      {/* Widget Showcase Canvas (Stitch Pure Minimalist Glass Simulation) */}
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#eaf2eb]/90 via-[#f4f8f5]/80 to-[#ffffff] rounded-3xl border border-[#dfe4d9] shadow-sm relative overflow-hidden">
        {/* The Crystal Glass Orb with Auto-Cycling Glowing Flame & Streak */}
        <CrystalGlassStreakWidget
          challengeProgress={challengeProgress}
          size="md"
          interactive={true}
          onClick={handleStreakClick}
        />

        {/* Quick Interaction Bar Beneath Widget */}
        <div className="w-full max-w-xs mt-5 space-y-2">
          <button
            type="button"
            onClick={handleStreakClick}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#006e22] hover:bg-[#005116] text-white font-bold text-xs shadow-md shadow-emerald-900/10 flex items-center justify-center gap-1.5 transition transform active:scale-95"
          >
            {justCheckedIn ? (
              <>
                <Check className="w-4 h-4 text-white stroke-[3]" />
                <span>Đã Ghi Nhận Điểm Danh!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Chạm Quả Cầu Để Điểm Danh ({completedCount}/{totalDays})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenBreathing}
            className="w-full py-2 px-3 rounded-2xl bg-[#ffffff] hover:bg-[#e0f5ea] text-[#006e22] font-semibold text-[11px] border border-[#dfe4d9] flex items-center justify-center gap-1.5 transition"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Kích hoạt nhanh bài tập thở 4-7-8</span>
          </button>
        </div>
      </div>

      <div className="p-3 bg-[#ffffff] rounded-2xl border border-[#dfe4d9] text-[11px] text-[#6f7a6c] space-y-1">
        <p className="font-semibold text-[#181d16] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#006e22]" />
          <span>Tính năng chuyển màu thông minh:</span>
        </p>
        <p className="leading-relaxed">
          Quả cầu trên widget tự động luân chuyển giữa 6 gam màu quang phổ (Xanh Băng Ngọc, San Hô, Tím Cực Quang, Lam Hải Lưu, Hồng Thạch Anh, Ánh Kim) theo chu kỳ êm dịu, giúp thị giác luôn được thư giãn tự nhiên.
        </p>
      </div>
    </div>
  );
};
