import React, { useState } from 'react';
import { Appointment } from '../types';
import {
  AlertTriangle,
  Clock,
  X,
  Calendar,
  User,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirmCancel: (appointmentId: string, reason: string) => void;
}

const PRESET_REASONS = [
  'Bận lịch làm việc / Học tập đột xuất',
  'Có việc gia đình phát sinh gấp',
  'Tình trạng tâm lý / Sức khỏe đã cải thiện',
  'Muốn đổi sang Chuyên gia hoặc khung giờ khác',
  'Sự cố thiết bị / Đường truyền mạng không đảm bảo',
  'Lý do cá nhân khác',
];

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [agreedPolicy, setAgreedPolicy] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handleConfirm = () => {
    const finalReason = [
      selectedReason,
      customReason.trim() ? `Chi tiết: ${customReason.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' - ');

    if (!finalReason) {
      setErrorMsg('Vui lòng chọn hoặc nhập ít nhất một lý do hủy lịch hẹn.');
      return;
    }

    if (!agreedPolicy) {
      setErrorMsg('Vui lòng xác nhận bạn đã hiểu quy định hủy lịch trước 12h.');
      return;
    }

    setIsSubmitting(true);
    audioSynth.playNotification();

    setTimeout(() => {
      onConfirmCancel(appointment.id, finalReason);
      setIsSubmitting(false);
      // Reset fields
      setSelectedReason('');
      setCustomReason('');
      setErrorMsg(null);
      onClose();
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      id="cancel-appointment-modal-backdrop"
    >
      <div
        className="relative w-full max-w-lg bg-[#ffffff] border border-[#dfe4d9] rounded-3xl shadow-xl p-6 text-[#181d16] flex flex-col max-h-[90vh] overflow-y-auto space-y-4"
        id="cancel-appointment-modal-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#dfe4d9]">
          <div className="flex items-center gap-2 text-rose-700">
            <div className="w-8 h-8 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#181d16]">Hủy Lịch Hẹn Tư Vấn</h3>
              <p className="text-[11px] text-[#6f7a6c]">Xác nhận hủy và giải phóng khung giờ cho chuyên gia</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f7faf8] hover:bg-[#f0f5ea] flex items-center justify-center text-[#6f7a6c] hover:text-[#181d16] transition"
            id="btn-close-cancel-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Appointment Information Card */}
        <div className="p-3.5 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] flex items-center gap-3">
          <img
            src={
              appointment.expertAvatar ||
              'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
            }
            alt={appointment.expertName || 'Chuyên gia'}
            className="w-12 h-12 rounded-2xl object-cover ring-1 ring-[#dfe4d9] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[#181d16] truncate">
              {appointment.expertName || 'Chuyên gia tư vấn SoulCare'}
            </h4>
            <p className="text-[11px] text-[#6f7a6c] truncate">{appointment.expertTitle || 'Tư vấn tâm lý 1-1'}</p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#006e22] mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{appointment.dateStr} • {appointment.timeSlot}</span>
            </div>
          </div>
        </div>

        {/* 12-HOUR CANCELLATION POLICY NOTICE */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300/80 text-amber-950 space-y-2 text-xs" id="cancellation-policy-notice">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Quy Định Hủy Lịch Trước 12 Giờ (Bắt Buộc)</span>
          </div>
          <div className="text-[11px] leading-relaxed text-amber-900/90 space-y-1">
            <p>
              • Vui lòng thông báo hủy trước <strong>ít nhất 12 giờ</strong> so với giờ hẹn để Chuyên gia có thể sắp xếp hỗ trợ người bệnh khác đang cần phiên khẩn cấp.
            </p>
            <p>
              • Hủy sát giờ (&lt;12h) hoặc vắng mặt không lý do (No-show) có thể tạm thời giới hạn quyền đặt lịch khám 0đ trong các tuần tiếp theo.
            </p>
          </div>
        </div>

        {/* REASON SELECTION */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#181d16] flex items-center justify-between">
            <span>Lý do hủy lịch hẹn: <span className="text-rose-600">*</span></span>
            <span className="text-[11px] text-[#6f7a6c] font-normal">Chọn một lý do bên dưới</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {PRESET_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedReason(reason);
                    setErrorMsg(null);
                  }}
                  className={`p-2.5 rounded-xl text-left text-xs transition border flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-[#e0f5ea] border-[#006e22] text-[#005116] font-bold shadow-2xs'
                      : 'bg-[#f7faf8] border-[#dfe4d9] text-[#3f4a3d] hover:bg-slate-50'
                  }`}
                >
                  <span className="leading-snug">{reason}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#006e22] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* CUSTOM REASON TEXTAREA */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#181d16] flex items-center justify-between">
            <span>Ghi chú thêm (tùy chọn):</span>
            <span className="text-[10px] text-[#6f7a6c]">{customReason.length}/200 ký tự</span>
          </label>
          <textarea
            value={customReason}
            maxLength={200}
            onChange={(e) => {
              setCustomReason(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="Chia sẻ thêm lý do cụ thể để SoulCare và Bác sĩ hiểu rõ hơn..."
            className="w-full p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder-[#6f7a6c]/60 focus:outline-none focus:ring-2 focus:ring-[#006e22] resize-none h-18"
            id="cancel-reason-textarea"
          />
        </div>

        {/* ACKNOWLEDGMENT CHECKBOX */}
        <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] cursor-pointer select-none text-xs text-[#181d16]">
          <input
            type="checkbox"
            checked={agreedPolicy}
            onChange={(e) => {
              setAgreedPolicy(e.target.checked);
              setErrorMsg(null);
            }}
            className="w-4 h-4 text-[#006e22] rounded mt-0.5 shrink-0"
            id="chk-agreed-policy"
          />
          <span className="leading-relaxed text-[11px]">
            Tôi xác nhận đã đọc và hiểu rõ <strong>quy định báo hủy trước 12 giờ</strong> của nền tảng SoulCare.
          </span>
        </label>

        {/* Error message */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#dfe4d9]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="py-2.5 px-4 rounded-2xl bg-[#f7faf8] hover:bg-[#e0f5ea] border border-[#dfe4d9] text-xs font-bold text-[#181d16] transition"
            id="btn-cancel-modal-back"
          >
            Quay lại / Giữ lịch
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || (!selectedReason && !customReason.trim()) || !agreedPolicy}
            className="py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
            id="btn-confirm-cancel-appointment"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy lịch'}
          </button>
        </div>
      </div>
    </div>
  );
};
