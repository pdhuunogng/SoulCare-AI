import React, { useState } from 'react';
import { INITIAL_QUIZ_QUESTIONS } from '../data/initialData';
import { QuizQuestion, QuizResult } from '../types';
import { RadarChart } from './RadarChart';
import { ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, RotateCcw, HeartHandshake, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: QuizResult) => void;
  onCompleteQuiz?: (result: QuizResult) => void;
  onTriggerSOS: () => void;
  onNavigateToBooking?: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onCompleteQuiz,
  onTriggerSOS,
  onNavigateToBooking,
}) => {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Question answers: mapping question id -> value 0..3
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Active question set (starts with Tier 1: 8 questions)
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(
    INITIAL_QUIZ_QUESTIONS.filter((q) => q.tier === 1)
  );

  const [tier2ActivatedGroup, setTier2ActivatedGroup] = useState<'depression' | 'anxiety' | 'stress' | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null);

  if (!isOpen) return null;

  const currentQ = activeQuestions[currentStepIndex];
  const currentValue = currentQ ? (answers[currentQ.id] ?? 0) : 0;

  const sliderLabels = [
    { val: 0, text: 'Không bao giờ', desc: '0 ngày trong 2 tuần qua' },
    { val: 1, text: 'Vài ngày', desc: '1 - 6 ngày' },
    { val: 2, text: 'Hơn một nửa số ngày', desc: '7 - 11 ngày' },
    { val: 3, text: 'Gần như hàng ngày', desc: '12 - 14 ngày' },
  ];

  const handleSliderChange = (val: number) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  const handleNextQuestion = () => {
    if (answers[currentQ.id] === undefined) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: 0 }));
    }

    if (currentStepIndex < activeQuestions.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      return;
    }

    if (activeQuestions.length === 8 && !tier2ActivatedGroup) {
      const q1 = answers[1] ?? 0;
      const q2 = answers[2] ?? 0;
      const q3 = answers[3] ?? 0;
      const q4 = answers[4] ?? 0;
      const q5 = answers[5] ?? 0;
      const q6 = answers[6] ?? 0;
      const q7 = answers[7] ?? 0;
      const q8 = answers[8] ?? 0;

      const scoreDepressionT1 = q1 + q2;
      const scoreAnxietyT1 = q3 + q4;
      const scoreStressT1 = q5 + q6;

      let triggerGroup: 'depression' | 'anxiety' | 'stress' | null = null;
      let additionalQs: QuizQuestion[] = [];

      if (scoreDepressionT1 >= 3) {
        triggerGroup = 'depression';
        additionalQs = INITIAL_QUIZ_QUESTIONS.filter((q) => q.group === 'depression' && q.tier === 2);
      } else if (scoreAnxietyT1 >= 3) {
        triggerGroup = 'anxiety';
        additionalQs = INITIAL_QUIZ_QUESTIONS.filter((q) => q.group === 'anxiety' && q.tier === 2);
      } else if (scoreStressT1 >= 3) {
        triggerGroup = 'stress';
        additionalQs = INITIAL_QUIZ_QUESTIONS.filter((q) => q.group === 'stress' && q.tier === 2);
      }

      if (triggerGroup && additionalQs.length > 0) {
        setTier2ActivatedGroup(triggerGroup);
        setActiveQuestions((prev) => [...prev, ...additionalQs]);
        setCurrentStepIndex(8);
        return;
      }
    }

    computeAndFinish();
  };

  const computeAndFinish = () => {
    const q1 = answers[1] ?? 0;
    const q2 = answers[2] ?? 0;
    const q3 = answers[3] ?? 0;
    const q4 = answers[4] ?? 0;
    const q5 = answers[5] ?? 0;
    const q6 = answers[6] ?? 0;
    const q7 = answers[7] ?? 0;
    const q8 = answers[8] ?? 0;

    let depressionPct = ((q1 + q2) / 6) * 100;
    let anxietyPct = ((q3 + q4) / 6) * 100;
    let stressPct = ((q5 + q6) / 6) * 100;
    const sleepPct = ((q7 + q8) / 6) * 100;

    let sosTriggered = false;

    if (tier2ActivatedGroup === 'depression') {
      let fullDepScore = q1 + q2;
      for (let i = 9; i <= 15; i++) {
        const val = answers[i] ?? 0;
        fullDepScore += val;
      }
      depressionPct = (fullDepScore / 27) * 100;

      if ((answers[15] ?? 0) >= 1) {
        sosTriggered = true;
      }
    } else if (tier2ActivatedGroup === 'anxiety') {
      let fullAnxScore = q3 + q4;
      for (let i = 16; i <= 20; i++) {
        fullAnxScore += answers[i] ?? 0;
      }
      anxietyPct = (fullAnxScore / 21) * 100;
    } else if (tier2ActivatedGroup === 'stress') {
      let fullStressScore = q5 + q6;
      const reversedIds = [22, 23, 25, 26];
      for (let i = 21; i <= 28; i++) {
        const raw = answers[i] ?? 0;
        if (reversedIds.includes(i)) {
          fullStressScore += 3 - raw;
        } else {
          fullStressScore += raw;
        }
      }
      stressPct = (fullStressScore / 30) * 100;
    }

    const result: QuizResult = {
      completedAt: new Date().toLocaleDateString('vi-VN'),
      depressionPct: Math.round(depressionPct),
      anxietyPct: Math.round(anxietyPct),
      stressPct: Math.round(stressPct),
      sleepPct: Math.round(sleepPct),
      tier2TriggeredGroup: tier2ActivatedGroup,
      sosTriggered,
    };

    setFinalResult(result);
    setIsCompleted(true);
    if (onCompleteQuiz) {
      onCompleteQuiz(result);
    } else if (onComplete) {
      onComplete(result);
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
  };

  const getSeverityBadge = (pct: number) => {
    if (pct <= 25) {
      return { label: 'Vững vàng', color: 'bg-[#e0f5ea] text-[#006e22] border-[#67c76c]/30' };
    }
    if (pct <= 50) {
      return { label: 'Cần chút lắng nghe', color: 'bg-[#fff8e1] text-[#f57f17] border-[#ffa000]/30' };
    }
    if (pct <= 75) {
      return { label: 'Mức độ cần chăm sóc', color: 'bg-[#fff3e0] text-[#e65100] border-[#ff9800]/30' };
    }
    return { label: 'Áp lực ở mức cao', color: 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/30' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#ffffff] rounded-3xl shadow-xl border border-[#dfe4d9] p-6 md:p-8 flex flex-col text-[#181d16]">
        {/* DISCLAIMER SCREEN */}
        {!hasStarted && !isCompleted && (
          <div className="space-y-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#f7faf8] hover:bg-[#f0f5ea] flex items-center justify-center text-[#6f7a6c] hover:text-[#181d16] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold text-[#181d16]">
                Tầm Soát Sức Khỏe Tinh Thần Đa Chiều
              </h2>
              <p className="text-xs text-[#6f7a6c] leading-relaxed">
                Bộ câu hỏi chuẩn hóa quốc tế (PHQ, GAD, PSS, PSQI) giúp bạn thấu hiểu 4 khía cạnh: Khí sắc, Lo âu, Căng thẳng và Giấc ngủ.
              </p>
            </div>

            {/* Disclaimer Box */}
            <div className="p-4 rounded-2xl bg-[#fff8e1] border border-[#ffe082] flex gap-3 text-[#f57f17] text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 shrink-0 text-[#f57f17] mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Miễn trừ trách nhiệm y khoa:</p>
                <p className="text-[#6f7a6c]">
                  Bài tầm soát này được thiết kế để tự đánh giá lối sống và nhận diện sớm các chỉ số căng thẳng, không phải là chẩn đoán y khoa chính thức và không thay thế thăm khám với Bác sĩ.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#006e22] focus:ring-[#006e22] cursor-pointer"
              />
              <span className="text-xs font-medium text-[#3f4a3d]">
                Tôi hiểu kết quả chỉ mang tính tự tầm soát lối sống, không thay thế chẩn đoán y khoa.
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-full text-xs font-medium text-[#6f7a6c] hover:bg-[#f7faf8] transition border border-[#dfe4d9]"
              >
                Để sau
              </button>
              <button
                type="button"
                disabled={!disclaimerAccepted}
                onClick={() => setHasStarted(true)}
                className="flex-1 py-3 px-4 rounded-full text-xs font-bold text-white bg-[#006e22] hover:bg-[#005116] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition flex items-center justify-center gap-2"
              >
                Bắt đầu làm Quiz
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* QUIZ QUESTIONS STEPPER */}
        {hasStarted && !isCompleted && currentQ && (
          <div className="space-y-6">
            {/* Header Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6f7a6c]">
                <span className="font-semibold text-[#006e22]">
                  {currentQ.categoryName}
                </span>
                <span>
                  Câu {currentStepIndex + 1} / {activeQuestions.length}
                </span>
              </div>
              <div className="w-full bg-[#f0f5ea] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#006e22] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / activeQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="min-h-[90px] flex items-center">
              <h3 className="text-base md:text-lg font-bold text-[#181d16] leading-snug">
                {currentQ.text}
              </h3>
            </div>

            {/* 4-Step Interactive Slider */}
            <div className="space-y-4 pt-2">
              <div className="relative flex items-center justify-between px-2">
                {[0, 1, 2, 3].map((step) => (
                  <button
                    key={`step-dot-${step}`}
                    type="button"
                    onClick={() => handleSliderChange(step)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentValue === step
                        ? 'bg-[#006e22] text-white scale-110 shadow-sm ring-4 ring-[#67c76c]/30'
                        : 'bg-[#f7faf8] text-[#6f7a6c] hover:bg-[#e0f5ea] border border-[#dfe4d9]'
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>

              {/* Native range input */}
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={currentValue}
                onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-[#dfe4d9] rounded-lg appearance-none cursor-pointer accent-[#006e22]"
              />

              {/* Active selection preview */}
              <div className="p-4 rounded-2xl bg-[#e0f5ea] border border-[#67c76c]/30 text-center">
                <p className="text-base font-bold text-[#006e22]">
                  {sliderLabels[currentValue].text}
                </p>
                <p className="text-xs text-[#005116]/80 mt-0.5">
                  ({sliderLabels[currentValue].desc})
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#dfe4d9]">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                  className="py-3 px-5 rounded-full text-xs font-semibold text-[#6f7a6c] hover:bg-[#f7faf8] border border-[#dfe4d9] transition"
                >
                  Quay lại
                </button>
              )}
              <button
                type="button"
                onClick={handleNextQuestion}
                className="flex-1 py-3 px-5 rounded-full text-xs font-bold text-white bg-[#006e22] hover:bg-[#005116] shadow-sm transition flex items-center justify-center gap-2"
              >
                {currentStepIndex === activeQuestions.length - 1 ? 'Xem kết quả' : 'Tiếp theo'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {isCompleted && finalResult && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0f5ea] text-[#006e22] text-xs font-semibold border border-[#67c76c]/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Hoàn thành tầm soát
              </div>
              <h2 className="text-xl font-bold text-[#181d16]">
                Bản Đồ Phổ Tâm Lý Đa Chiều
              </h2>
              <p className="text-xs text-[#6f7a6c]">
                Thực hiện ngày {finalResult.completedAt}
              </p>
            </div>

            {/* Radar Chart Component */}
            <div className="py-2 flex justify-center bg-[#f7faf8] rounded-3xl border border-[#dfe4d9]">
              <RadarChart
                depressionPct={finalResult.depressionPct}
                anxietyPct={finalResult.anxietyPct}
                stressPct={finalResult.stressPct}
                sleepPct={finalResult.sleepPct}
                size={270}
              />
            </div>

            {/* Severity Tags */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { name: 'Khí sắc (PHQ)', val: finalResult.depressionPct },
                { name: 'Lo âu (GAD)', val: finalResult.anxietyPct },
                { name: 'Căng thẳng (PSS)', val: finalResult.stressPct },
                { name: 'Giấc ngủ (PSQI)', val: finalResult.sleepPct },
              ].map((item, i) => {
                const badge = getSeverityBadge(item.val);
                return (
                  <div
                    key={`sev-${i}`}
                    className="p-3 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] shadow-2xs flex flex-col justify-between"
                  >
                    <span className="text-xs font-semibold text-[#6f7a6c]">
                      {item.name}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-bold text-[#181d16]">
                        {item.val}%
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SOS Warning if Q15 was triggered */}
            {finalResult.sosTriggered && (
              <div className="p-4 rounded-2xl bg-[#fff8f7] border border-[#ffdad6] text-[#ba1a1a] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-[#ba1a1a]">
                  <AlertTriangle className="w-5 h-5 text-[#ba1a1a] animate-pulse" />
                  Cảnh báo an toàn tinh thần
                </div>
                <p>
                  Chỉ số của bạn cho thấy bạn đang trải qua áp lực nặng nề. Bạn không phải chịu đựng một mình. Hãy kết nối ngay với người thân hoặc chuyên gia y tế.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerSOS();
                  }}
                  className="w-full mt-1 py-2 px-3 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-semibold text-xs transition"
                >
                  Mở Trợ Giúp Khẩn Cấp SOS Ngay
                </button>
              </div>
            )}

            {/* Note disclaimer */}
            <p className="text-[11px] text-[#6f7a6c] text-center leading-relaxed italic">
              * Kết quả trên chỉ mang tính chất tự tham khảo lối sống, không có giá trị chẩn đoán y khoa.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setCurrentStepIndex(0);
                  setActiveQuestions(INITIAL_QUIZ_QUESTIONS.filter((q) => q.tier === 1));
                  setTier2ActivatedGroup(null);
                  setIsCompleted(false);
                }}
                className="py-3 px-4 rounded-full text-xs font-semibold text-[#6f7a6c] hover:bg-[#f7faf8] border border-[#dfe4d9] transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Làm lại Quiz
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToBooking();
                }}
                className="flex-1 py-3 px-4 rounded-full text-xs font-bold text-white bg-[#006e22] hover:bg-[#005116] shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <HeartHandshake className="w-4 h-4" />
                Đặt tư vấn miễn phí buổi đầu (0đ)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
