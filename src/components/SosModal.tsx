import React, { useState } from 'react';
import { SOSBuddy } from '../types';
import { ShieldAlert, HeartPulse, Send, PhoneCall, Check, X, Sparkles, Wind } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  sosBuddy: SOSBuddy;
  onStartBreathing: () => void;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  sosBuddy,
  onStartBreathing,
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'grounding' | 'buddySent'>('main');
  const [groundingStep, setGroundingStep] = useState(0);

  if (!isOpen) return null;

  const grounding54321 = [
    { num: 5, sense: 'Thị giác', title: '5 Đồ vật bạn nhìn thấy xung quanh', desc: 'Hãy đảo mắt chậm rãi và đọc tên 5 món đồ trong tầm mắt (ví dụ: chiếc cốc, chiếc quạt, bức tranh...)' },
    { num: 4, sense: 'Xúc giác', title: '4 Cảm giác trên cơ thể', desc: 'Chạm tay vào 4 bề mặt: mặt bàn, chiếc áo bạn đang mặc, lòng bàn chân chạm sàn nhà...' },
    { num: 3, sense: 'Thính giác', title: '3 Âm thanh bạn đang nghe', desc: 'Lắng nghe 3 âm thanh: tiếng quạt gió, tiếng xe cộ xa xa, hoặc tiếng nhịp thở của chính bạn.' },
    { num: 2, sense: 'Khứu giác', title: '2 Mùi hương nhận diện được', desc: 'Hít sâu và cảm nhận 2 mùi hương: mùi gối, mùi tinh dầu hoặc không khí trong phòng.' },
    { num: 1, sense: 'Vị giác', title: '1 Vị giác trong khoang miệng', desc: 'Cảm nhận vị giác hiện tại, hoặc uống một ngụm nước ấm mát lành.' },
  ];

  const handleSendBuddySOS = () => {
    setActiveTab('buddySent');
    audioSynth.playChime(440, 1.2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#ffffff] border border-[#dfe4d9] rounded-3xl shadow-xl p-5 text-[#181d16] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#dfe4d9]">
          <div className="flex items-center gap-2.5 text-[#ba1a1a]">
            <div className="w-9 h-9 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-[#ba1a1a] animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#181d16]">Khay Cứu Hộ SOS Khẩn Cấp</h3>
              <p className="text-[11px] text-[#6f7a6c]">Bạn đang an toàn, hãy thả lỏng nhé</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f7faf8] hover:bg-[#f0f5ea] flex items-center justify-center text-[#6f7a6c] hover:text-[#181d16] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MAIN MENU */}
        {activeTab === 'main' && (
          <div className="space-y-3 pt-3">
            {/* Option 1: Thở Hộp (Navy SEALs) - Tái lập tập trung & bình tĩnh */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartBreathing();
              }}
              className="w-full p-3.5 rounded-2xl bg-[#ffffff] hover:bg-[#f7faf8] border border-[#dfe4d9] hover:border-[#67c76c] flex items-center justify-between text-left transition group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center shrink-0">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#006e22] transition">
                    Bài tập hít thở: Thở Hộp (Navy SEALs)
                  </h4>
                  <p className="text-[10px] text-[#6f7a6c]">Tái lập tập trung & bình tĩnh</p>
                </div>
              </div>
              <span className="text-[11px] text-[#006e22] font-bold bg-[#e0f5ea] px-2.5 py-1 rounded-full">Bắt đầu</span>
            </button>

            {/* Option 2: Breathing 4-7-8 (Harvard) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartBreathing();
              }}
              className="w-full p-3.5 rounded-2xl bg-[#ffffff] hover:bg-[#f7faf8] border border-[#dfe4d9] hover:border-[#67c76c] flex items-center justify-between text-left transition group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c4f7f4] text-[#005116] flex items-center justify-center shrink-0">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#006e22] transition">
                    Bài tập hít thở: Thở 4-7-8 (Harvard)
                  </h4>
                  <p className="text-[10px] text-[#6f7a6c]">Giảm lo âu & đi vào giấc ngủ</p>
                </div>
              </div>
              <span className="text-[11px] text-[#006e22] font-bold bg-[#c4f7f4] px-2.5 py-1 rounded-full">Bắt đầu</span>
            </button>

            {/* Option 3: Calming / Focus steps */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('grounding');
                setGroundingStep(0);
              }}
              className="w-full p-3.5 rounded-2xl bg-[#ffffff] hover:bg-[#f7faf8] border border-[#dfe4d9] hover:border-[#67c76c] flex items-center justify-between text-left transition group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e3f2fd] text-[#1976d2] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#006e22] transition">
                    Bài tập tập trung bình tĩnh lại (3 phút)
                  </h4>
                  <p className="text-[10px] text-[#6f7a6c]">5 bước thư giãn giác quan 5-4-3-2-1 & giải tỏa hoảng loạn</p>
                </div>
              </div>
              <span className="text-[11px] text-[#1976d2] font-bold bg-[#e3f2fd] px-2.5 py-1 rounded-full">5 bước</span>
            </button>

            {/* Option 4: Send SOS Buddy */}
            <div className="p-3.5 rounded-2xl bg-[#fff8f7] border border-[#ffdad6] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#ba1a1a]" />
                  <h4 className="text-xs font-bold text-[#181d16]">
                    SOS Buddy: {sosBuddy.name ? sosBuddy.name : 'Người thân khẩn cấp (Chưa cài đặt)'}
                  </h4>
                </div>
                {sosBuddy.phone && (
                  <a
                    href={`tel:${sosBuddy.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#ba1a1a] text-[11px] font-bold transition"
                    title={`Gọi ${sosBuddy.name || 'Người thân'}`}
                  >
                    <PhoneCall className="w-3 h-3 text-[#ba1a1a]" />
                    <span>{sosBuddy.phone}</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSendBuddySOS}
                  className="py-2.5 px-3 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sosBuddy.phone ? 'Gửi tin SOS' : 'Gửi tín hiệu SOS'}</span>
                </button>

                <a
                  href={`tel:${(sosBuddy.phone || '115').replace(/\s+/g, '')}`}
                  className="py-2.5 px-3 rounded-full bg-[#ffffff] hover:bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#ba1a1a]" />
                  <span>{sosBuddy.phone ? sosBuddy.phone : 'Gọi 115'}</span>
                </a>
              </div>
            </div>

            {/* Option 5: National Hotlines */}
            <div className="p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#6f7a6c] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 text-[#006e22]" />
                  Hotline 24/7 (0đ)
                </span>
                <span className="text-[10px] text-[#006e22] lowercase font-normal">chạm để gọi</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:19006233"
                  className="py-2 px-3 rounded-xl bg-[#ffffff] hover:bg-[#e0f5ea] hover:border-[#67c76c] border border-[#dfe4d9] text-[#181d16] flex items-center justify-center gap-2 transition group shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#006e22] group-hover:scale-110 transition" />
                  <span className="font-mono font-bold text-xs text-[#181d16]">1900 6233</span>
                </a>
                <a
                  href="tel:115"
                  className="py-2 px-3 rounded-xl bg-[#ffffff] hover:bg-[#ffdad6] hover:border-[#ba1a1a] border border-[#dfe4d9] text-[#181d16] flex items-center justify-center gap-2 transition group shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#ba1a1a] group-hover:scale-110 transition" />
                  <span className="font-mono font-bold text-xs text-[#181d16]">115</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* GROUNDING 5-4-3-2-1 STEPPER */}
        {activeTab === 'grounding' && (
          <div className="space-y-5 pt-4">
            <div className="flex items-center justify-between text-xs text-[#006e22] font-semibold">
              <span>Bài tập tập trung & bình tĩnh lại</span>
              <span>Bước {groundingStep + 1} / 5</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#e0f5ea] border border-[#67c76c]/40 text-center space-y-3 shadow-inner">
              <div className="w-16 h-16 rounded-full bg-[#ffffff] text-[#006e22] font-black text-3xl flex items-center justify-center mx-auto ring-4 ring-[#67c76c]/30 shadow-sm">
                {grounding54321[groundingStep].num}
              </div>
              <span className="text-xs uppercase tracking-wider text-[#006e22] font-bold">
                {grounding54321[groundingStep].sense}
              </span>
              <h4 className="text-base font-bold text-[#181d16]">
                {grounding54321[groundingStep].title}
              </h4>
              <p className="text-xs text-[#3f4a3d] leading-relaxed">
                {grounding54321[groundingStep].desc}
              </p>
            </div>

            <div className="flex gap-2">
              {groundingStep > 0 && (
                <button
                  type="button"
                  onClick={() => setGroundingStep((prev) => prev - 1)}
                  className="py-2.5 px-4 rounded-full text-xs font-semibold bg-[#f7faf8] text-[#181d16] border border-[#dfe4d9] hover:bg-[#e0f5ea]"
                >
                  Quay lại
                </button>
              )}
              {groundingStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    setGroundingStep((prev) => prev + 1);
                    audioSynth.playChime(528, 1);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-full text-xs font-bold bg-[#006e22] hover:bg-[#005116] text-white shadow-2xs transition"
                >
                  Tôi đã làm xong, tiếp tục
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('main')}
                  className="flex-1 py-2.5 px-4 rounded-full text-xs font-bold bg-[#006e22] hover:bg-[#005116] text-white shadow-2xs transition"
                >
                  Hoàn tất bài tập (Trở về)
                </button>
              )}
            </div>
          </div>
        )}

        {/* BUDDY SOS SENT SCREEN */}
        {activeTab === 'buddySent' && (
          <div className="space-y-4 pt-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[#e0f5ea] text-[#006e22] flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-[#181d16]">
              Đã kích hoạt tín hiệu SOS tới {sosBuddy.name || 'Người thân'}!
            </h4>
            <p className="text-xs text-[#3f4a3d] leading-relaxed">
              Hệ thống đã gửi thông báo bảo mật qua SMS và Email của {sosBuddy.name} ({sosBuddy.phone}). Hãy giữ điện thoại bên mình nhé.
            </p>
            <div className="p-3 bg-[#f7faf8] rounded-2xl text-[11px] text-[#6f7a6c] border border-[#dfe4d9] flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#006e22] shrink-0 mt-0.5" />
              <span><strong>Gợi ý:</strong> Hãy nhắm mắt lại, hít 3 hơi thở sâu và cho phép bản thân nghỉ ngơi trong chốc lát.</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              className="w-full py-2.5 rounded-full bg-[#006e22] hover:bg-[#005116] text-xs font-semibold text-white"
            >
              Quay lại menu trợ giúp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
