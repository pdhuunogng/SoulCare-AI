import React, { useState, useMemo } from 'react';
import { ExpertProfile, AvailableSlot, Appointment } from '../types';
import { INITIAL_EXPERTS } from '../data/initialData';
import {
  Video,
  MapPin,
  Calendar,
  Clock,
  Star,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Check,
  UserCheck,
  CalendarX,
  Search,
  Award,
  Building2,
  FileCheck,
  Globe2,
  Lock,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import confetti from 'canvas-confetti';
import { CarePlansModal } from './CarePlansModal';
import { GoogleMapsClinicFinder } from './GoogleMapsClinicFinder';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { isPastAppointment, filterUpcomingSlots } from '../utils/dateUtils';

interface BookingViewProps {
  onBookAppointment: (appointment: Appointment) => void;
  onCancelAppointment?: (appointmentId: string, reason: string) => void;
  onOpenReviewModal: (expert: ExpertProfile) => void;
  onOpenPreSession: (appointment: Appointment) => void;
  existingAppointments: Appointment[];
  userSymptoms?: string;
  userQuizRadar?: string;
}

const getDoctorFallbackAvatar = (name: string) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23006e22"/><text x="50%" y="55%" font-family="Arial,sans-serif" font-size="34" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
};

const ALL_SPECIALTIES = [
  'Tất cả',
  '#TrầmCảm',
  '#LoÂu',
  '#MấtNgủ',
  '#Burnout',
  '#MốiQuanHệ',
  '#ÁpLựcWorkplace',
  '#ÁpLựcHọcĐường',
];

export const BookingView: React.FC<BookingViewProps> = ({
  onBookAppointment,
  onCancelAppointment,
  onOpenReviewModal,
  onOpenPreSession,
  existingAppointments,
  userSymptoms,
  userQuizRadar,
}) => {
  const [mainChannel, setMainChannel] = useState<'online' | 'offline'>('online');
  const [isCarePlansOpen, setIsCarePlansOpen] = useState(false);

  // Online Sub-tabs: 'expert-first' vs 'schedule-first'
  const [onlineTab, setOnlineTab] = useState<'expert-first' | 'schedule-first'>('expert-first');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tất cả');

  // Selected Expert for detail view
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);

  // Selected Slot for Booking Confirmation
  const [selectedSlot, setSelectedSlot] = useState<{ expert: ExpertProfile; slot: AvailableSlot } | null>(null);
  const [userBookingNote, setUserBookingNote] = useState('');
  const [isBookedSuccess, setIsBookedSuccess] = useState<Appointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  // Valid upcoming appointments only (past or cancelled appointments are removed)
  const validUpcomingAppointments = useMemo(() => {
    return existingAppointments.filter((apt) => apt.status === 'upcoming' && !isPastAppointment(apt));
  }, [existingAppointments]);

  // Filtered experts list
  const filteredExperts = useMemo(() => {
    return INITIAL_EXPERTS.filter((exp) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.hospitalAffiliation && exp.hospitalAffiliation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exp.licenseNumber && exp.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        exp.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSpecialty =
        selectedSpecialty === 'Tất cả' ||
        exp.specialties.includes(selectedSpecialty);

      return matchSearch && matchSpecialty;
    });
  }, [searchTerm, selectedSpecialty]);

  // Generate dynamic 7 upcoming days starting today
  const upcomingDaysList = useMemo(() => {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const fullDayNames: Record<string, string> = {
      CN: 'Chủ Nhật',
      T2: 'Thứ 2',
      T3: 'Thứ 3',
      T4: 'Thứ 4',
      T5: 'Thứ 5',
      T6: 'Thứ 6',
      T7: 'Thứ 7',
    };
    const list = [];
    const now = new Date();
    for (let i = 0; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dayId = dayNames[d.getDay()];
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
      const fullDateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      const label =
        i === 0
          ? `Hôm nay (${dateStr})`
          : i === 1
          ? `Ngày mai (${dateStr})`
          : `${fullDayNames[dayId]} (${dateStr})`;
      list.push({ id: dayId, dateStr: fullDateStr, label, shortDate: dateStr });
    }
    return list;
  }, []);

  // Filter for Schedule-first (default to today's day)
  const [filterDay, setFilterDay] = useState<string>(() => {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayNames[new Date().getDay()];
  });

  const handleConfirmBooking = () => {
    if (!selectedSlot) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      type: 'online',
      userId: 'usr-current',
      userName: 'Thanh Hà',
      expertId: selectedSlot.expert.id,
      expertName: selectedSlot.expert.name,
      expertTitle: selectedSlot.expert.title,
      expertAvatar: selectedSlot.expert.avatar,
      dateStr: selectedSlot.slot.dateStr,
      timeSlot: selectedSlot.slot.time,
      googleMeetLink: `https://meet.google.com/air-rise-${Math.random().toString(36).substring(2, 7)}`,
      googleCalendarSynced: true,
      status: 'upcoming',
      userNotes: userBookingNote || 'Tôi muốn tư vấn về áp lực tâm lý và cải thiện giấc ngủ.',
      hasUserReviewed: false,
    };

    onBookAppointment(newApt);
    setIsBookedSuccess(newApt);
    setSelectedSlot(null);
    audioSynth.playChime(528, 1.2);

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 space-y-5 pb-24 text-[#181d16] font-sans animate-in fade-in">
      {/* Top Banner */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0f5ea] text-[#006e22] text-[11px] font-bold border border-[#67c76c]/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Hồ Sơ Chuyên Gia Y Khoa Đã Xác Thực 100%</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#181d16] tracking-tight">
            Đặt Lịch Tư Vấn Tâm Lý
          </h2>
          <button
            type="button"
            onClick={() => setIsCarePlansOpen(true)}
            className="text-[11px] font-bold text-[#006e22] bg-[#e0f5ea] hover:bg-[#006e22] hover:text-white px-3 py-1.5 rounded-full border border-[#67c76c]/40 transition flex items-center gap-1 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gói Đồng Hành</span>
          </button>
        </div>
      </div>

      {/* Primary Channel Selector: Online vs Offline */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setMainChannel('online');
            setIsBookedSuccess(null);
          }}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            mainChannel === 'online'
              ? 'bg-[#006e22] text-white shadow-sm'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Tư Vấn Trực Tuyến</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainChannel('offline');
            setIsBookedSuccess(null);
          }}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            mainChannel === 'offline'
              ? 'bg-[#006e22] text-white shadow-sm'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Khám Trực Tiếp</span>
        </button>
      </div>

      {/* SUCCESS CONFIRMATION MODAL/CARD */}
      {isBookedSuccess && (
        <div className="p-5 rounded-3xl bg-[#e0f5ea] border border-[#67c76c]/50 space-y-3 animate-in zoom-in-95 shadow-sm">
          <div className="flex items-center gap-2 text-[#006e22] font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            Đặt Lịch Tư Vấn Thành Công (0đ Buổi Đầu)!
          </div>
          <div className="p-3 bg-[#ffffff] rounded-2xl border border-[#dfe4d9] text-xs space-y-1.5 text-[#181d16]">
            <p>
              <strong>Chuyên gia:</strong> {isBookedSuccess.expertName}
            </p>
            <p>
              <strong>Thời gian:</strong> {isBookedSuccess.dateStr} ({isBookedSuccess.timeSlot})
            </p>
            <p className="text-[#006e22] font-mono text-[11px] flex items-center gap-1">
              <Video className="w-3.5 h-3.5" />
              <span>Link Meet: {isBookedSuccess.googleMeetLink}</span>
            </p>
            <p className="text-blue-600 text-[11px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Đã tự động thêm vào Google Calendar</span>
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenPreSession(isBookedSuccess)}
              className="flex-1 py-2.5 rounded-full bg-[#006e22] hover:bg-[#005116] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              Vào Màn Hình Chuẩn Bị (Pre-session)
            </button>
            <button
              type="button"
              onClick={() => setIsBookedSuccess(null)}
              className="py-2.5 px-4 rounded-full bg-[#ffffff] hover:bg-slate-50 border border-[#dfe4d9] text-xs text-[#6f7a6c] font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MY BOOKED APPOINTMENTS SUMMARY SECTION (Only active upcoming future appointments) */}
      {validUpcomingAppointments.length > 0 && (
        <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#181d16] flex items-center gap-1.5 uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5 text-[#006e22]" />
              <span>Lịch Hẹn Của Bạn ({validUpcomingAppointments.length})</span>
            </h3>
            <span className="text-[10px] text-[#006e22] bg-[#e0f5ea] px-2 py-0.5 rounded-full font-semibold">
              Đồng bộ Google Calendar
            </span>
          </div>

          {/* 12h cancellation policy banner */}
          <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">Quy định đổi/hủy lịch:</span> Vui lòng thông báo hủy trước <strong>ít nhất 12 giờ</strong> để nhường suất tư vấn 0đ cho người cần hỗ trợ khẩn cấp.
            </div>
          </div>

          <div className="space-y-2">
            {validUpcomingAppointments.map((apt) => {
              return (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-2xl border transition space-y-2.5 bg-[#f7faf8] border-[#67c76c]/40 ring-1 ring-[#67c76c]/20"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={apt.expertAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
                      alt={apt.expertName}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getDoctorFallbackAvatar(apt.expertName);
                      }}
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-[#dfe4d9] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold truncate text-[#181d16]">
                          {apt.expertName}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 bg-[#e0f5ea] text-[#006e22]">
                          Sắp diễn ra
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6f7a6c]">{apt.expertTitle}</p>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#006e22] mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {apt.dateStr} • {apt.timeSlot}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Appointment */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-[#dfe4d9]/60">
                    <button
                      type="button"
                      onClick={() => onOpenPreSession(apt)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#e0f5ea] hover:bg-[#006e22] text-[#006e22] hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Chuẩn Bị</span>
                    </button>
                    {apt.googleMeetLink && (
                      <a
                        href={apt.googleMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-xl bg-[#006e22] hover:bg-[#005116] text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Vào Meet</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setAppointmentToCancel(apt)}
                      className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-[#dfe4d9] hover:border-rose-300 text-slate-600 hover:text-rose-600 text-xs font-semibold transition flex items-center justify-center gap-1"
                      title="Hủy lịch hẹn (Quy định trước 12h)"
                    >
                      <CalendarX className="w-3 h-3" />
                      <span>Hủy lịch</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CHANNEL 1: ONLINE (GOOGLE MEET 1-1) */}
      {mainChannel === 'online' && !isBookedSuccess && (
        <div className="space-y-4">
          {/* Sub-toggle */}
          <div className="flex p-0.5 rounded-xl bg-[#ffffff] border border-[#dfe4d9] text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setOnlineTab('expert-first');
                setSelectedExpert(null);
              }}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
                onlineTab === 'expert-first'
                  ? 'bg-[#e0f5ea] text-[#006e22] font-bold shadow-2xs'
                  : 'text-[#6f7a6c] hover:text-[#181d16]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Theo Chuyên Gia ({INITIAL_EXPERTS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlineTab('schedule-first');
                setSelectedExpert(null);
              }}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
                onlineTab === 'schedule-first'
                  ? 'bg-[#e0f5ea] text-[#006e22] font-bold shadow-2xs'
                  : 'text-[#6f7a6c] hover:text-[#181d16]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Theo Khung Giờ Rảnh</span>
            </button>
          </div>

          {/* OPTION 1: EXPERT-FIRST FLOW */}
          {onlineTab === 'expert-first' && !selectedExpert && (
            <div className="space-y-3.5">
              {/* Doctor Account Verification Information Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#e8f7ee] to-[#f0fbf4] border border-[#67c76c]/40 shadow-2xs flex items-start gap-2.5">
                <div className="p-1.5 rounded-xl bg-[#006e22] text-white shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-xs text-[#005116]">
                  <p className="font-bold">
                    Hồ sơ Y khoa được xác thực trực tiếp từ tài khoản Bác sĩ / Chuyên gia
                  </p>
                  <p className="text-[11px] text-[#4a6551] leading-relaxed">
                    Mỗi chuyên gia đều công khai minh bạch số Chứng Chỉ Hành Nghề (CCHN), đơn vị công tác và học vị lâm sàng đã được Hội đồng Y khoa kiểm duyệt.
                  </p>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#6f7a6c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên bác sĩ, bệnh viện, CCHN, hoặc vấn đề..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] text-xs text-[#181d16] placeholder-[#6f7a6c]/60 focus:outline-none focus:ring-2 focus:ring-[#006e22] shadow-2xs"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6f7a6c] hover:text-[#181d16]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Specialty filter chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {ALL_SPECIALTIES.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSelectedSpecialty(sp)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
                        selectedSpecialty === sp
                          ? 'bg-[#006e22] text-white shadow-2xs'
                          : 'bg-[#ffffff] border border-[#dfe4d9] text-[#6f7a6c] hover:text-[#181d16]'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctors List */}
              {filteredExperts.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] text-center space-y-2">
                  <UserCheck className="w-8 h-8 text-[#6f7a6c] mx-auto opacity-50" />
                  <p className="text-xs font-bold text-[#181d16]">
                    Không tìm thấy chuyên gia phù hợp
                  </p>
                  <p className="text-[11px] text-[#6f7a6c]">
                    Vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa bộ lọc.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSpecialty('Tất cả');
                    }}
                    className="mt-2 text-xs text-[#006e22] font-bold hover:underline"
                  >
                    Xem tất cả chuyên gia
                  </button>
                </div>
              ) : (
                filteredExperts.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] hover:border-[#67c76c]/60 transition shadow-2xs space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={exp.avatar}
                          alt={exp.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getDoctorFallbackAvatar(exp.name);
                          }}
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#67c76c]/40 shadow-sm"
                        />
                        {exp.isVerified && (
                          <span
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#006e22] border-2 border-white rounded-full flex items-center justify-center shadow-xs"
                            title="Bác sĩ đã xác thực CCHN Y tế"
                          >
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-[#181d16] tracking-tight">
                                {exp.name}
                              </h4>
                              {exp.isVerified && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] text-[10px] font-bold">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Đã xác thực</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#4a5548] font-medium mt-0.5 leading-snug">
                              {exp.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{exp.rating}</span>
                            <span className="text-[#6f7a6c] text-[10px]">({exp.reviewCount})</span>
                          </div>
                        </div>

                        {/* Hospital Affiliation & CCHN Tags */}
                        <div className="space-y-1 mt-2">
                          {exp.hospitalAffiliation && (
                            <div className="flex items-center gap-1 text-[11px] text-[#3f4a3d]">
                              <Building2 className="w-3.5 h-3.5 text-[#006e22] shrink-0" />
                              <span className="truncate font-medium">{exp.hospitalAffiliation}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-[#6f7a6c] flex-wrap">
                            {exp.licenseNumber && (
                              <span className="flex items-center gap-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-700">
                                <FileCheck className="w-3 h-3 text-slate-500" />
                                <span>{exp.licenseNumber.split(' ')[0]}</span>
                              </span>
                            )}
                            {exp.yearsOfExperience && (
                              <span className="text-[#006e22] font-semibold">
                                ⏳ {exp.yearsOfExperience} năm kinh nghiệm
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Specialties Pills */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exp.specialties.slice(0, 4).map((sp) => (
                            <span
                              key={sp}
                              className="px-2 py-0.5 rounded-full bg-[#f0f5ea] text-[#006e22] text-[10px] font-medium"
                            >
                              {sp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI Summary Highlight */}
                    {exp.aiSummary && (
                      <div className="p-2.5 rounded-2xl bg-[#e0f5ea]/50 border border-[#67c76c]/30 text-[11px] text-[#005116] leading-relaxed">
                        {exp.aiSummary}
                      </div>
                    )}

                    {/* Pricing and Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#dfe4d9]/80">
                      <div className="text-[11px] flex items-center gap-1.5">
                        <span className="text-[#006e22] font-extrabold text-sm">0đ</span>
                        <span className="text-[#6f7a6c] text-[10px] font-medium">buổi đầu tiên (30 phút)</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedExpert(exp)}
                          className="px-3.5 py-1.5 rounded-full bg-[#f0f5ea] hover:bg-[#e0f5ea] text-xs font-bold text-[#006e22] transition flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Hồ sơ & Bằng cấp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedExpert(exp)}
                          className="px-4 py-1.5 rounded-full bg-[#006e22] hover:bg-[#005116] text-xs font-bold text-white shadow-sm transition flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Đặt lịch</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* DETAILED EXPERT PROFILE & AVAILABLE SLOTS VIEW */}
          {onlineTab === 'expert-first' && selectedExpert && (
            <div className="space-y-4 animate-in fade-in">
              <button
                type="button"
                onClick={() => setSelectedExpert(null)}
                className="text-xs text-[#006e22] hover:underline font-bold flex items-center gap-1"
              >
                ← Quay lại danh sách chuyên gia
              </button>

              {/* Profile Card Header */}
              <div className="p-5 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-4 shadow-2xs">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={selectedExpert.avatar}
                      alt={selectedExpert.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getDoctorFallbackAvatar(selectedExpert.name);
                      }}
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#006e22] shadow-sm"
                    />
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#006e22] border-2 border-white rounded-full flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    </span>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-extrabold text-[#181d16]">{selectedExpert.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Đã xác thực CCHN Y Tế</span>
                      </span>
                    </div>

                    <p className="text-xs text-[#4a5548] font-medium">{selectedExpert.title}</p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {selectedExpert.rating} ({selectedExpert.reviewCount} đánh giá lâm sàng)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#3f4a3d] leading-relaxed italic">
                  "{selectedExpert.introCaption || selectedExpert.bio}"
                </div>

                {/* Official Verification Details Box */}
                <div className="p-3.5 rounded-2xl bg-[#e8f7ee]/80 border border-[#67c76c]/40 space-y-2 text-xs">
                  <h5 className="font-bold text-[#005116] flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Hồ Sơ Hành Nghề & Bệnh Viện Công Tác</span>
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 text-[#181d16]">
                    {selectedExpert.licenseNumber && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#6f7a6c]">Số CCHN:</span>
                        <span className="font-mono font-bold text-[#006e22] bg-white px-2 py-0.5 rounded border border-[#67c76c]/30">
                          {selectedExpert.licenseNumber}
                        </span>
                      </div>
                    )}

                    {selectedExpert.hospitalAffiliation && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#6f7a6c]">Đơn vị:</span>
                        <span className="font-bold text-[#181d16]">
                          {selectedExpert.hospitalAffiliation}
                        </span>
                      </div>
                    )}

                    {selectedExpert.yearsOfExperience && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#6f7a6c]">Kinh nghiệm:</span>
                        <span className="font-bold text-[#006e22]">
                          {selectedExpert.yearsOfExperience} năm thực hành lâm sàng
                        </span>
                      </div>
                    )}

                    {selectedExpert.languages && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#6f7a6c]">Ngôn ngữ:</span>
                        <span className="font-medium text-[#181d16]">
                          {selectedExpert.languages.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-[#4a6551] pt-1 border-t border-[#67c76c]/30 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#006e22]" />
                    <span>Tư vấn qua Google Meet HD bảo mật mã hóa đầu cuối (E2EE), tuân thủ tiêu chuẩn y đức bảo mật thông tin thân chủ.</span>
                  </p>
                </div>

                {/* Degrees & Certifications */}
                <div className="space-y-2 text-xs">
                  <h5 className="font-bold text-[#6f7a6c] text-[11px] uppercase tracking-wide flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#006e22]" />
                    <span>Văn Bằng & Chứng Chỉ Đào Tạo:</span>
                  </h5>
                  <div className="space-y-1.5 pl-1">
                    {selectedExpert.degrees.map((deg, i) => (
                      <p key={i} className="text-[#181d16] flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#006e22] shrink-0 mt-0.5" />
                        <span>{deg}</span>
                      </p>
                    ))}
                    {selectedExpert.certifications && selectedExpert.certifications.map((cert, idx) => (
                      <p key={`cert-${idx}`} className="text-[#3f4a3d] flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{cert}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Transparent Pricing Table */}
                <div className="p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] space-y-2 text-xs">
                  <h5 className="font-bold text-[#181d16] text-[11px] uppercase">
                    Bảng Phí Tư Vấn Minh Bạch
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white border border-[#dfe4d9] flex justify-between items-center">
                      <span className="text-[#6f7a6c]">Buổi đầu (30p):</span>
                      <span className="font-bold text-[#006e22]">0đ (Miễn phí)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#dfe4d9] flex justify-between items-center">
                      <span className="text-[#6f7a6c]">Buổi đơn lẻ:</span>
                      <span className="font-bold text-[#181d16]">
                        {selectedExpert.pricing.singleSession.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Slots Section (Only future upcoming slots) */}
              <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#181d16] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#006e22]" />
                    <span>Chọn Ca Tư Vấn 0đ Khả Dụng</span>
                  </h4>
                  <span className="text-[10px] text-[#006e22] bg-[#e0f5ea] px-2 py-0.5 rounded-full font-bold">
                    30 Phút / Ca
                  </span>
                </div>

                {filterUpcomingSlots(selectedExpert.availableSlots).length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-center text-xs text-[#6f7a6c]">
                    Chuyên gia hiện chưa có ca trống mới trong những ngày tới. Vui lòng chọn chuyên gia khác.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filterUpcomingSlots(selectedExpert.availableSlots).map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot({ expert: selectedExpert, slot })}
                        className="p-3 rounded-2xl bg-[#f7faf8] hover:bg-[#e0f5ea] border border-[#dfe4d9] hover:border-[#006e22] text-left transition group shadow-2xs"
                      >
                        <span className="text-[10px] font-bold text-[#006e22] uppercase">
                          {slot.dayOfWeek} • {slot.dateStr}
                        </span>
                        <p className="text-xs font-bold text-[#181d16] group-hover:text-[#005116] mt-0.5">
                          {slot.time}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#181d16] flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Đánh Giá Từ Thân Chủ Đã Khám
                  </h4>
                  <button
                    type="button"
                    onClick={() => onOpenReviewModal(selectedExpert)}
                    className="text-xs text-[#006e22] font-bold hover:underline"
                  >
                    + Viết Đánh Giá
                  </button>
                </div>

                <div className="space-y-2.5">
                  {selectedExpert.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-[#f7faf8] rounded-2xl border border-[#dfe4d9] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#181d16]">{rev.userName}</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: Math.round(rev.rating) }).map((_, idx) => (
                            <Star key={idx} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#3f4a3d] leading-relaxed">{rev.text}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rev.tags.map((t) => (
                          <span key={t} className="text-[9px] text-[#4a6551] bg-[#e0f5ea] px-1.5 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OPTION 2: SCHEDULE-FIRST FLOW (Dynamic upcoming days) */}
          {onlineTab === 'schedule-first' && (
            <div className="space-y-4">
              {/* Date Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {upcomingDaysList.map((d) => (
                  <button
                    key={d.id + d.shortDate}
                    type="button"
                    onClick={() => setFilterDay(d.id)}
                    className={`px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                      filterDay === d.id
                        ? 'bg-[#006e22] text-white shadow-2xs'
                        : 'bg-[#ffffff] border border-[#dfe4d9] text-[#6f7a6c] hover:text-[#181d16]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Slots List for Selected Day */}
              <div className="space-y-3">
                {(() => {
                  const matchingExperts = INITIAL_EXPERTS.map((exp) => {
                    const futureSlots = filterUpcomingSlots(exp.availableSlots);
                    const matchingSlots = futureSlots.filter((s) => s.dayOfWeek === filterDay);
                    return { exp, matchingSlots };
                  }).filter(({ matchingSlots }) => matchingSlots.length > 0);

                  if (matchingExperts.length === 0) {
                    return (
                      <div className="p-8 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] text-center space-y-2">
                        <Clock className="w-8 h-8 text-[#6f7a6c] mx-auto opacity-50" />
                        <p className="text-xs font-bold text-[#181d16]">
                          Chưa có ca hẹn trống trong ngày này
                        </p>
                        <p className="text-[11px] text-[#6f7a6c]">
                          Vui lòng chọn ngày khác trong tuần hoặc chuyển sang mục "Theo Chuyên Gia".
                        </p>
                      </div>
                    );
                  }

                  return matchingExperts.map(({ exp, matchingSlots }) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={exp.avatar}
                          alt={exp.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getDoctorFallbackAvatar(exp.name);
                          }}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#67c76c]/40"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-[#181d16] truncate">{exp.name}</h4>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#e0f5ea] text-[#006e22] font-bold">
                              Verified
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6f7a6c] truncate">{exp.title}</p>
                          {exp.hospitalAffiliation && (
                            <p className="text-[10px] text-[#3f4a3d] truncate">🏥 {exp.hospitalAffiliation}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-amber-500 font-semibold shrink-0">⭐ {exp.rating}</span>
                      </div>

                      {/* Slots pills */}
                      <div className="flex flex-wrap gap-2">
                        {matchingSlots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlot({ expert: exp, slot })}
                            className="px-3 py-2 rounded-full bg-[#e0f5ea] hover:bg-[#006e22] hover:text-white text-[#006e22] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{slot.time}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHANNEL 2: OFFLINE CLINIC FINDER (GOOGLE MAPS PLATFORM INTEGRATED) */}
      {mainChannel === 'offline' && (
        <GoogleMapsClinicFinder
          userSymptoms={userSymptoms}
          userQuizRadar={userQuizRadar}
        />
      )}

      {/* BOOKING CONFIRMATION MODAL */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181d16]/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#ffffff] border border-[#dfe4d9] rounded-3xl shadow-2xl p-6 text-[#181d16] space-y-4">
            <h3 className="text-base font-bold text-[#181d16] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#006e22]" />
              Xác Nhận Đặt Lịch Tư Vấn 1-1
            </h3>

            <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs space-y-2">
              <p>
                <strong>Chuyên gia:</strong> {selectedSlot.expert.name}
              </p>
              {selectedSlot.expert.hospitalAffiliation && (
                <p>
                  <strong>Đơn vị công tác:</strong> {selectedSlot.expert.hospitalAffiliation}
                </p>
              )}
              {selectedSlot.expert.licenseNumber && (
                <p>
                  <strong>Số CCHN:</strong> {selectedSlot.expert.licenseNumber}
                </p>
              )}
              <p>
                <strong>Thời gian:</strong> {selectedSlot.slot.dayOfWeek} • {selectedSlot.slot.dateStr} ({selectedSlot.slot.time})
              </p>
              <p className="text-[#006e22] font-bold">
                <strong>Phí dịch vụ:</strong> 0đ (Áp dụng miễn phí buổi đầu tiên)
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#3f4a3d]">
                Ghi chú/Vấn đề bạn muốn chia sẻ trước (Tùy chọn):
              </label>
              <textarea
                rows={3}
                value={userBookingNote}
                onChange={(e) => setUserBookingNote(e.target.value)}
                placeholder="VD: Em thường xuyên bị khó ngủ và áp lực công việc ban đêm..."
                className="w-full p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder-[#6f7a6c]/60 focus:outline-none focus:ring-2 focus:ring-[#006e22] resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#e0f5ea] border border-[#67c76c]/30 text-[11px] text-[#005116]">
              ✓ Hệ thống tự động tạo phòng họp Google Meet bảo mật & đồng bộ Google Calendar kèm nhắc lịch trước 15 phút.
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="flex-1 py-3 rounded-full bg-[#f0f5ea] hover:bg-[#e0f5ea] text-xs font-semibold text-[#3f4a3d]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="flex-1 py-3 rounded-full bg-[#006e22] hover:bg-[#005116] text-xs font-bold text-white shadow-sm transition"
              >
                Xác Nhận Đặt Lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Care Plans Modal */}
      <CarePlansModal
        isOpen={isCarePlansOpen}
        onClose={() => setIsCarePlansOpen(false)}
        onSelectPlan={(_plan) => {
          setIsCarePlansOpen(false);
        }}
      />

      {/* Cancel Appointment Modal */}
      {appointmentToCancel && onCancelAppointment && (
        <CancelAppointmentModal
          isOpen={Boolean(appointmentToCancel)}
          onClose={() => setAppointmentToCancel(null)}
          appointment={appointmentToCancel}
          onConfirmCancel={(aptId, reason) => {
            onCancelAppointment(aptId, reason);
            setAppointmentToCancel(null);
          }}
        />
      )}
    </div>
  );
};
