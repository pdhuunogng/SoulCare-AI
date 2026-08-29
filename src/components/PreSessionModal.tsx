import React, { useState, useEffect } from 'react';
import { Appointment, UserRole } from '../types';
import { Video, Headphones, Wifi, VolumeX, Sparkles, Clock, ExternalLink, X, CalendarX } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { CancelAppointmentModal } from './CancelAppointmentModal';

interface PreSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  role: UserRole;
  onCancelAppointment?: (appointmentId: string, reason: string) => void;
}

export const PreSessionModal: React.FC<PreSessionModalProps> = ({
  isOpen,
  onClose,
  appointment,
  role,
  onCancelAppointment,
}) => {
  const [countdown, setCountdown] = useState(45);
  const [checkHeadphones, setCheckHeadphones] = useState(false);
  const [checkQuiet, setCheckQuiet] = useState(false);
  const [checkWifi, setCheckWifi] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLaunchMeet = () => {
    audioSynth.playChime(528, 1);
    const meetUrl = appointment.googleMeetLink || 'https://meet.google.com/air-rise-taman';
    window.open(meetUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#ffffff] border border-[#dfe4d9] rounded-3xl shadow-xl p-6 text-[#181d16] flex flex-col max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#dfe4d9]">
          <div className="flex items-center gap-2 text-[#006e22]">
            <Video className="w-5 h-5" />
            <h3 className="text-base font-bold text-[#181d16]">
              {role === 'expert' ? 'Chuẩn Bị Vào Ca Tư Vấn (Dành Cho Bác Sĩ)' : 'Màn Hình Chuẩn Bị Vào Buổi Tư Vấn 1-1'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f7faf8] hover:bg-[#f0f5ea] flex items-center justify-center text-[#6f7a6c] hover:text-[#181d16] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Appointment Target Info */}
        <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] flex items-center gap-3">
          <img
            src={appointment.expertAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
            alt="Avatar"
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#67c76c]/40"
          />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#181d16]">
              {role === 'expert' ? `Khách hàng: ${appointment.userName}` : appointment.expertName}
            </h4>
            <p className="text-xs text-[#6f7a6c]">
              {appointment.dateStr} | Khung giờ: <strong className="text-[#006e22]">{appointment.timeSlot}</strong>
            </p>
          </div>
        </div>

        {/* USER PRE-SESSION VIEW */}
        {role !== 'expert' && (
          <div className="space-y-4">
            {/* Countdown box */}
            <div className="p-4 rounded-2xl bg-[#e0f5ea] border border-[#67c76c]/30 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-[#006e22] text-xs font-semibold">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Buổi tư vấn sẽ bắt đầu sau:</span>
              </div>
              <p className="text-3xl font-mono font-black text-[#005116]">
                00:{countdown < 10 ? `0${countdown}` : countdown}s
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#6f7a6c]">
                Checklist chuẩn bị nhanh (30s):
              </h5>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkHeadphones}
                    onChange={(e) => setCheckHeadphones(e.target.checked)}
                    className="w-4 h-4 text-[#006e22] rounded"
                  />
                  <Headphones className="w-4 h-4 text-[#006e22] shrink-0" />
                  <span className="text-[#181d16]">Đã kết nối tai nghe (đảm bảo tính riêng tư cuộc gọi)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkQuiet}
                    onChange={(e) => setCheckQuiet(e.target.checked)}
                    className="w-4 h-4 text-[#006e22] rounded"
                  />
                  <VolumeX className="w-4 h-4 text-[#366664] shrink-0" />
                  <span className="text-[#181d16]">Đang ở không gian yên tĩnh, thoải mái</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkWifi}
                    onChange={(e) => setCheckWifi(e.target.checked)}
                    className="w-4 h-4 text-[#006e22] rounded"
                  />
                  <Wifi className="w-4 h-4 text-[#1976d2] shrink-0" />
                  <span className="text-[#181d16]">Đường truyền mạng Wifi / 4G ổn định</span>
                </label>
              </div>
            </div>

            {/* Soothing message */}
            <div className="p-3.5 rounded-2xl bg-[#c4f7f4]/40 border border-[#366664]/30 text-[#005116] text-xs text-center italic">
              "Hãy hít một hơi thật sâu. Chuyên gia luôn sẵn sàng lắng nghe bạn mà không phán xét bất kỳ điều gì."
            </div>

            {/* CTA */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLaunchMeet}
                className="w-full py-3.5 px-4 rounded-full bg-[#006e22] hover:bg-[#005116] text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-2xs"
              >
                <Video className="w-4 h-4" />
                Mở Google Meet & Bắt Đầu
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {onCancelAppointment && (
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full py-2 px-3 text-xs text-rose-600 hover:text-rose-700 font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <CalendarX className="w-3.5 h-3.5" />
                  <span>Không thể tham gia? Báo hủy lịch hẹn (quy định trước 12h)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* EXPERT PRE-SESSION VIEW (PATIENT BRIEFING) */}
        {role === 'expert' && (
          <div className="space-y-4">
            {/* AI Briefing Card */}
            <div className="p-4 rounded-2xl bg-[#e0f5ea] border border-[#67c76c]/40 space-y-2">
              <div className="flex items-center gap-2 text-[#006e22] text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>THẺ AI PATIENT BRIEFING (Tự động trích xuất)</span>
              </div>
              <div className="text-xs text-[#181d16] leading-relaxed space-y-1.5 bg-[#ffffff] p-3.5 rounded-xl border border-[#dfe4d9]">
                <p>
                  <strong>• Chỉ số trọng tâm:</strong> Căng thẳng PSS-10: 70% | Khí sắc PHQ-9: 65% | Giấc ngủ PSQI: 75%
                </p>
                <p>
                  <strong>• Xu hướng cảm xúc 7 ngày:</strong> User check-in 3 ngày liên tiếp tâm trạng Mệt mỏi & Buồn bã.
                </p>
                <p>
                  <strong>• Lời nhắn tiền tư vấn:</strong> "{appointment.userNotes || 'Bệnh nhân mất ngủ và hay lo âu công việc ban đêm.'}"
                </p>
                <p className="text-[#006e22] font-semibold pt-1 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span><strong>Gợi ý mở lời:</strong> Hỏi thăm về chất lượng giấc ngủ tuần qua và gợi ý bài tập thở 4-7-8 xoa dịu.</span>
                </p>
              </div>
            </div>

            {/* Expert Tech checklist */}
            <div className="p-3 bg-[#f7faf8] rounded-xl text-xs space-y-1 text-[#6f7a6c] border border-[#dfe4d9]">
              <p>✓ Đã kiểm tra Microphone & Camera</p>
              <p>✓ Bảo mật y khoa: Google Meet 1-1 không ghi âm ngoài ý muốn</p>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleLaunchMeet}
              className="w-full py-3.5 px-4 rounded-full bg-[#006e22] hover:bg-[#005116] text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-2xs"
            >
              <Video className="w-4 h-4" />
              Bắt Đầu Ca Tư Vấn (Mở Google Meet)
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cancel Appointment Modal Nested */}
      {isCancelModalOpen && onCancelAppointment && (
        <CancelAppointmentModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          appointment={appointment}
          onConfirmCancel={(aptId, reason) => {
            onCancelAppointment(aptId, reason);
            setIsCancelModalOpen(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
