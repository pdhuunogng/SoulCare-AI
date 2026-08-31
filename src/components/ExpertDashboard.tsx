import React, { useState, useMemo } from 'react';
import { Appointment, ExpertProfile, AvailableSlot } from '../types';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Sparkles,
  CheckCircle2,
  Send,
  Plus,
  Trash2,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Heart,
  Smile,
  Frown,
  Meh,
  Download,
  CalendarPlus,
  RefreshCw,
  Check,
  Zap,
  Info,
  CalendarX,
  Stethoscope,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import confetti from 'canvas-confetti';
import { getGoogleCalendarUrl, downloadIcsCalendarFile } from '../utils/calendarSync';
import { sortAppointmentsByUpcoming } from '../utils/dateUtils';

interface ExpertDashboardProps {
  expertProfile: ExpertProfile;
  appointments: Appointment[];
  onUpdateAppointmentRecap: (appointmentId: string, recapText: string) => void;
  onCompleteAppointment?: (appointmentId: string) => void;
  onLaunchPreSession: (appointment: Appointment) => void;
  onAddAppointment?: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
  currentUserName?: string;
  currentUserEmail?: string;
}

interface PatientAssessmentContext {
  depressionPct: number;
  anxietyPct: number;
  stressPct: number;
  sleepPct: number;
  moodTimeline: { day: string; emotion: string; note: string; color: string }[];
  primaryConcern: string;
}

export const ExpertDashboard: React.FC<ExpertDashboardProps> = ({
  expertProfile,
  appointments,
  onUpdateAppointmentRecap,
  onCompleteAppointment,
  onLaunchPreSession,
  onAddAppointment,
  onDeleteAppointment,
  currentUserName,
  currentUserEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'recaps' | 'schedule'>('briefing');

  // Filter for sessions tab
  const [sessionFilter, setSessionFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  // Expanded clinical dossier modal or card
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [aiBriefingMap, setAiBriefingMap] = useState<Record<string, string>>({});
  const [isLoadingBriefingMap, setIsLoadingBriefingMap] = useState<Record<string, boolean>>({});

  // Active expanded recap writing state per appointment ID
  const [activeRecapAptId, setActiveRecapAptId] = useState<string | null>(null);
  const [rawNotesMap, setRawNotesMap] = useState<Record<string, string>>({});
  const [generatedRecapMap, setGeneratedRecapMap] = useState<Record<string, string>>({});
  const [selectedPlanMap, setSelectedPlanMap] = useState<Record<string, string>>({});
  const [isGeneratingMap, setIsGeneratingMap] = useState<Record<string, boolean>>({});

  // Slots & Schedule Creator state
  const [slots, setSlots] = useState<AvailableSlot[]>(expertProfile.availableSlots || [
    { id: 'slot-1', dayOfWeek: 'T2', dateStr: 'Hôm nay', time: '19:00 - 20:00', isBooked: false },
    { id: 'slot-2', dayOfWeek: 'T3', dateStr: 'Ngày mai', time: '20:30 - 21:30', isBooked: false },
    { id: 'slot-3', dayOfWeek: 'T5', dateStr: 'Thứ 5', time: '18:00 - 19:00', isBooked: false },
    { id: 'slot-4', dayOfWeek: 'T7', dateStr: 'Thứ 7', time: '09:00 - 10:00', isBooked: false },
  ]);

  // Form for direct scheduling
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [patientNameInput, setPatientNameInput] = useState('');
  const [appointmentDateInput, setAppointmentDateInput] = useState(
    new Date(Date.now() + 86400000).toLocaleDateString('vi-VN')
  );
  const [appointmentTimeInput, setAppointmentTimeInput] = useState('19:00 - 20:00');
  const [sessionTypeInput, setSessionTypeInput] = useState<'free' | 'untangle' | 'transform'>('free');
  const [customMeetUrlInput, setCustomMeetUrlInput] = useState(
    `https://meet.google.com/air-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`
  );
  const [sessionNotesInput, setSessionNotesInput] = useState('');

  // Form for available slot
  const [newDay, setNewDay] = useState('T3');
  const [newTime, setNewTime] = useState('19:00 - 20:00');

  // Deletion confirmation modal
  const [deletingAptId, setDeletingAptId] = useState<string | null>(null);

  // Mock patient clinical data generator for realistic clinical context
  const getPatientClinicalData = (apt: Appointment): PatientAssessmentContext => {
    // Determine context deterministically based on appointment
    const isSleepFocus = (apt.userNotes || '').toLowerCase().includes('ngủ') || apt.id.endsWith('1');
    const isStressFocus = (apt.userNotes || '').toLowerCase().includes('công việc') || (apt.userNotes || '').toLowerCase().includes('áp lực');

    if (isSleepFocus) {
      return {
        depressionPct: 55,
        anxietyPct: 65,
        stressPct: 70,
        sleepPct: 85,
        primaryConcern: 'Mất ngủ kéo dài, thức giấc giữa đêm và hồi hộp khi chuẩn bị ngủ',
        moodTimeline: [
          { day: 'T2', emotion: 'Mệt mỏi', note: 'Chỉ ngủ được 3 tiếng, dậy uể oải', color: '#ba1a1a' },
          { day: 'T3', emotion: 'Căng thẳng', note: 'Cố uống cafe để tỉnh táo làm việc', color: '#d97706' },
          { day: 'T4', emotion: 'Bối rối', note: 'Tim đập nhanh lúc 2h sáng', color: '#9333ea' },
          { day: 'T5', emotion: 'Mệt mỏi', note: 'Đau đầu và mỏi cơ vai gáy', color: '#ba1a1a' },
          { day: 'T6', emotion: 'Ổn định', note: 'Tập thở 4-7-8 dễ ngủ hơn một chút', color: '#006e22' },
          { day: 'T7', emotion: 'Tươi vui', note: 'Đi bộ công viên buổi sáng', color: '#059669' },
          { day: 'CN', emotion: 'Ổn định', note: 'Chuẩn bị tâm lý cho tuần mới', color: '#006e22' },
        ],
      };
    }

    if (isStressFocus) {
      return {
        depressionPct: 60,
        anxietyPct: 80,
        stressPct: 85,
        sleepPct: 65,
        primaryConcern: 'Áp lực KPI công sở, quá tải deadline, xuất hiện triệu chứng kiệt sức (burnout)',
        moodTimeline: [
          { day: 'T2', emotion: 'Căng thẳng', note: 'Họp đầu tuần áp lực doanh số', color: '#d97706' },
          { day: 'T3', emotion: 'Căng thẳng', note: 'Tăng ca đến 21h, ăn uống thất thường', color: '#d97706' },
          { day: 'T4', emotion: 'Mệt mỏi', note: 'Kiệt sức, không muốn nói chuyện với ai', color: '#ba1a1a' },
          { day: 'T5', emotion: 'Bối rối', note: 'Mất tập trung khi làm báo cáo', color: '#9333ea' },
          { day: 'T6', emotion: 'Ổn định', note: 'Hoàn thành bớt việc tồn đọng', color: '#006e22' },
          { day: 'T7', emotion: 'Ổn định', note: 'Ngủ bù và nghe âm thanh sóng não', color: '#006e22' },
          { day: 'CN', emotion: 'Căng thẳng', note: 'Lo lắng nghĩ về sáng thứ Hai', color: '#d97706' },
        ],
      };
    }

    return {
      depressionPct: 45,
      anxietyPct: 55,
      stressPct: 60,
      sleepPct: 60,
      primaryConcern: 'Khủng hoảng mất cân bằng cảm xúc và tìm kiếm phương pháp tự chữa lành',
      moodTimeline: [
        { day: 'T2', emotion: 'Ổn định', note: 'Bắt đầu tuần mới nhẹ nhàng', color: '#006e22' },
        { day: 'T3', emotion: 'Mệt mỏi', note: 'Công việc nhiều việc đột xuất', color: '#ba1a1a' },
        { day: 'T4', emotion: 'Căng thẳng', note: 'Tranh luận nhỏ với đồng nghiệp', color: '#d97706' },
        { day: 'T5', emotion: 'Ổn định', note: 'Dành 15 phút thiền buổi trưa', color: '#006e22' },
        { day: 'T6', emotion: 'Tươi vui', note: 'Uống trà chiều cùng bạn bè', color: '#059669' },
        { day: 'T7', emotion: 'Tươi vui', note: 'Nấu ăn gia đình', color: '#059669' },
        { day: 'CN', emotion: 'Ổn định', note: 'Đọc sách và viết nhật ký', color: '#006e22' },
      ],
    };
  };

  // Generate Real-time AI Briefing for the Doctor
  const handleFetchAiBriefing = async (apt: Appointment) => {
    setIsLoadingBriefingMap((prev) => ({ ...prev, [apt.id]: true }));
    const context = getPatientClinicalData(apt);

    try {
      const res = await fetch('/api/patient-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: apt.userName,
          quizScores: {
            depressionPct: context.depressionPct,
            anxietyPct: context.anxietyPct,
            stressPct: context.stressPct,
            sleepPct: context.sleepPct,
          },
          moodHistory: context.moodTimeline.map((m) => `${m.day}: ${m.emotion} (${m.note})`).join('; '),
          userNotes: apt.userNotes || context.primaryConcern,
        }),
      });

      const data = await res.json();
      if (data.briefing) {
        setAiBriefingMap((prev) => ({ ...prev, [apt.id]: data.briefing }));
        audioSynth.playChime(528, 0.6);
      }
    } catch {
      // Fallback structured briefing
      const fallbackBriefing = `📌 TỔNG HỢP Y KHOA NHANH TỪ AI (Bệnh nhân: ${apt.userName}):
• Chỉ số trọng tâm: Căng thẳng PSS-10: ${context.stressPct}% | Khí sắc PHQ-9: ${context.depressionPct}% | Giấc ngủ PSQI: ${context.sleepPct}%
• Xu hướng cảm xúc 7 ngày: Bệnh nhân có biến động cảm xúc giữa tuần, ghi nhận mệt mỏi và lo âu vào các ngày làm việc.
• Lời nhắn tiền tư vấn: "${apt.userNotes || context.primaryConcern}"
• 3 Câu hỏi lâm sàng gợi ý mở đầu:
  1. "Tuần qua bạn thấy cơ thể và chất lượng giấc ngủ của mình phản hồi thế nào sau những giờ làm việc?"
  2. "Khoảnh khắc nào trong ngày khiến bạn cảm thấy năng lượng bị sụt giảm nhiều nhất?"
  3. "Hôm nay bạn mong muốn chúng ta cùng nhau tháo gỡ nút thắt nào đầu tiên?"
• Khung can thiệp khuyến nghị: Liệu pháp Nhận thức Hành vi (CBT) tập trung vào nhận diện tự thoại tiêu cực và hướng dẫn thở 4-7-8.`;

      setAiBriefingMap((prev) => ({ ...prev, [apt.id]: fallbackBriefing }));
    } finally {
      setIsLoadingBriefingMap((prev) => ({ ...prev, [apt.id]: false }));
    }
  };

  // Separate pending recaps vs completed recaps
  // Only COMPLETED sessions need a recap! Upcoming appointments have not finished yet.
  const pendingRecapAppointments = useMemo(() => {
    return appointments.filter(
      (apt) => apt.status === 'completed' && (!apt.doctorRecap || !apt.doctorRecap.isApproved || !apt.doctorRecap.formattedRecap)
    );
  }, [appointments]);

  const completedRecapAppointments = useMemo(() => {
    return appointments.filter(
      (apt) => apt.doctorRecap && apt.doctorRecap.isApproved && apt.doctorRecap.formattedRecap
    );
  }, [appointments]);

  const totalFinishedSessions = appointments.filter((a) => a.status === 'completed').length;
  const totalRecapSessions = totalFinishedSessions > 0 ? totalFinishedSessions : appointments.length;
  const completedRecapCount = completedRecapAppointments.length;
  const completionPercentage = totalRecapSessions > 0
    ? Math.round((completedRecapCount / totalRecapSessions) * 100)
    : 100;

  // AI Recap Generation for Expert
  const handleGenerateAIRecap = async (apt: Appointment) => {
    const rawDoctorNotes = rawNotesMap[apt.id] || '';
    if (!rawDoctorNotes.trim()) return;

    setIsGeneratingMap((prev) => ({ ...prev, [apt.id]: true }));
    const context = getPatientClinicalData(apt);
    const selectedPlan = selectedPlanMap[apt.id] || 'UNTANGLE_3S';

    try {
      const res = await fetch('/api/expert-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawDoctorNotes,
          userName: apt.userName,
          expertName: expertProfile.name,
          patientContext: {
            quizRadar: `Căng thẳng ${context.stressPct}%, Lo âu ${context.anxietyPct}%, Giấc ngủ ${context.sleepPct}%`,
            moodHistory: context.moodTimeline.map((m) => m.emotion).join(', '),
            userNotes: apt.userNotes || '',
            recommendedPlan: selectedPlan,
          },
        }),
      });

      const data = await res.json();
      const finalRecap = data.recap || 'Bản recap đã được khởi tạo.';
      setGeneratedRecapMap((prev) => ({ ...prev, [apt.id]: finalRecap }));
      audioSynth.playChime(528, 1);
    } catch {
      const defaultRecap = `Chào ${apt.userName}, cảm ơn bạn đã dành thời gian chia sẻ cùng Chuyên gia ${expertProfile.name} trong buổi tư vấn hôm nay:

1. 🌟 Đánh giá & Lắng nghe:
- ${rawDoctorNotes || 'Ghi nhận bạn đang trải qua áp lực căng thẳng và chất lượng giấc ngủ cần được chăm sóc thêm.'}
- Bạn đã rất dũng cảm và chủ động nhận diện cảm xúc của mình.

2. 🛠️ Lời khuyên & Bài tập về nhà tuần này:
- Thực hành bài tập hít thở 4-7-8 trước khi đi ngủ 15 phút (3-5 phút/lần).
- Ghi lại 3 điều tích cực nhỏ trong Emotional Diary mỗi tối.
- Cho phép bản thân nghỉ ngơi 10-15 phút giữa các ca làm việc.

3. 📅 Lời nhắn từ Chuyên gia & Lộ trình đề xuất:
- Khuyến nghị tiếp tục theo dõi qua Gói Đồng Hành Tháo Gỡ (3 buổi) để định hình lại thói quen thư giãn sâu.
- Hãy tiến từng bước nhỏ và lắng nghe cơ thể mình nhé! Hẹn gặp lại bạn.`;

      setGeneratedRecapMap((prev) => ({ ...prev, [apt.id]: defaultRecap }));
    } finally {
      setIsGeneratingMap((prev) => ({ ...prev, [apt.id]: false }));
    }
  };

  const handleSendRecapToUser = (apt: Appointment) => {
    const textToSend = generatedRecapMap[apt.id] || rawNotesMap[apt.id];
    if (!textToSend) return;

    onUpdateAppointmentRecap(apt.id, textToSend);
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

    setActiveRecapAptId(null);
  };

  const handleQuickTemplate = (aptId: string, templateType: 'stress' | 'sleep' | 'relationship' | 'burnout' | 'progress') => {
    const templates = {
      stress: 'Bệnh nhân căng thẳng PSS-10 cao do áp lực KPI và deadline dồn dập, xuất hiện đau mỏi vai gáy. Đã hướng dẫn kỹ thuật thả lỏng cơ Jacobson và ngắt kết nối màn hình sau 21h30. Đề xuất theo dõi tiếp sau 1 tuần.',
      sleep: 'Bệnh nhân khó vào giấc (mất ngủ dạng khởi phát), hay giật mình lúc 2-3h sáng kèm hồi hộp. Đã dặn tập thở 4-7-8, uống trà hoa cúc ấm và ngâm chân thảo mộc.',
      relationship: 'Khủng hoảng mất kết nối sau xung đột tình cảm, cảm giác cô đơn và tự trách. Đã hướng dẫn bài tập viết thư xả cảm xúc không gửi và thiết lập ranh giới lành mạnh.',
      burnout: 'Hội chứng kiệt sức công sở, suy giảm động lực làm việc và mất năng lượng. Hướng dẫn kỹ thuật phân bổ vi nghỉ (micro-breaks) và phân định ranh giới công việc - cá nhân.',
      progress: 'Bệnh nhân có tiến triển rất tích cực sau 1 tuần thực hành bài tập thở và nhật ký cảm xúc. Giấc ngủ đã sâu hơn, tinh thần ổn định. Duy trì lịch sinh hoạt hiện tại.',
    };

    setRawNotesMap((prev) => ({
      ...prev,
      [aptId]: templates[templateType],
    }));
  };

  // Schedule new appointment directly
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientNameInput.trim()) return;

    const newApt: Appointment = {
      id: `apt-expert-${Date.now()}`,
      userId: `patient_${Date.now()}`,
      userName: patientNameInput.trim(),
      type: 'online',
      expertId: expertProfile.id,
      expertName: expertProfile.name,
      expertTitle: expertProfile.title,
      expertAvatar: expertProfile.avatar,
      dateStr: appointmentDateInput,
      timeSlot: appointmentTimeInput,
      googleMeetLink: customMeetUrlInput || 'https://meet.google.com/air-rise-taman',
      googleCalendarSynced: false,
      status: 'upcoming',
      userNotes: sessionNotesInput.trim() || 'Lịch tư vấn 1-1 được chỉ định bởi Chuyên gia',
    };

    if (onAddAppointment) {
      onAddAppointment(newApt);
    }
    audioSynth.playChime(660, 0.7);

    // Reset form
    setPatientNameInput('');
    setSessionNotesInput('');
    setIsSchedulingOpen(false);

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  // Delete appointment
  const handleConfirmDelete = (aptId: string) => {
    if (onDeleteAppointment) {
      onDeleteAppointment(aptId);
      audioSynth.playNotification();
    }
    setDeletingAptId(null);
  };

  // Slots management
  const handleAddSlot = () => {
    const newSlot: AvailableSlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: newDay,
      dateStr: 'Lặp lại hàng tuần',
      time: newTime,
      isBooked: false,
    };
    setSlots([...slots, newSlot]);
    audioSynth.playChime(440, 0.5);
  };

  const handleDeleteSlot = (slotId: string) => {
    setSlots(slots.filter((s) => s.id !== slotId));
    audioSynth.playNotification();
  };

  const filteredAppointments = useMemo(() => {
    const list = appointments.filter((apt) => {
      if (sessionFilter === 'upcoming') return apt.status === 'upcoming';
      if (sessionFilter === 'completed') return apt.status === 'completed';
      return true;
    });
    return sortAppointmentsByUpcoming(list);
  }, [appointments, sessionFilter]);

  return (
    <div className="p-4 space-y-4 pb-28 text-[#181d16] font-sans animate-in fade-in">
      {/* Header Lịch Khám & Nút Thao Tác (Đã lược bỏ profile chuyên gia) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-lg font-bold text-[#181d16] tracking-tight">
            Lịch Khám & Quản Lý Ca
          </h2>
          <p className="text-xs text-[#6f7a6c]">
            {appointments.length} ca tư vấn • {pendingRecapAppointments.length > 0 ? `${pendingRecapAppointments.length} ca chờ recap` : 'Đã hoàn tất recap'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            audioSynth.playChime(520, 0.2);
            setIsSchedulingOpen(true);
          }}
          className="py-2 px-3.5 rounded-2xl bg-[#006e22] hover:bg-[#005116] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>+ Lên Lịch Ca Mới</span>
        </button>
      </div>

      {/* 3 Main Functional Tabs for Expert */}
      <div className="flex p-1 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] text-xs shadow-2xs">
        <button
          type="button"
          onClick={() => {
            audioSynth.playChime(520, 0.1);
            setActiveTab('briefing');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'briefing'
              ? 'bg-[#006e22] text-white shadow-2xs'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Theo Dõi & AI Briefing ({appointments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioSynth.playChime(520, 0.1);
            setActiveTab('recaps');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 relative ${
            activeTab === 'recaps'
              ? 'bg-[#006e22] text-white shadow-2xs'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Viết Recap</span>
          {pendingRecapAppointments.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
              activeTab === 'recaps' ? 'bg-white text-[#006e22]' : 'bg-rose-500 text-white'
            }`}>
              {pendingRecapAppointments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            audioSynth.playChime(520, 0.1);
            setActiveTab('schedule');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'schedule'
              ? 'bg-[#006e22] text-white shadow-2xs'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Lên Lịch & Xóa Lịch</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: THEO DÕI THÔNG TIN QUIZ, NHẬT KÝ & TỔNG HỢP AI BRIEFING TRƯỚC HẸN */}
      {/* ========================================================================= */}
      {activeTab === 'briefing' && (
        <div className="space-y-3">
          {/* Quick Filter Pill */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setSessionFilter('all')}
              className={`px-3 py-1 rounded-full font-medium transition ${
                sessionFilter === 'all'
                  ? 'bg-[#181d16] text-white'
                  : 'bg-[#ffffff] text-[#6f7a6c] border border-[#dfe4d9]'
              }`}
            >
              Tất cả ({appointments.length})
            </button>
            <button
              type="button"
              onClick={() => setSessionFilter('upcoming')}
              className={`px-3 py-1 rounded-full font-medium transition ${
                sessionFilter === 'upcoming'
                  ? 'bg-[#006e22] text-white'
                  : 'bg-[#ffffff] text-[#6f7a6c] border border-[#dfe4d9]'
              }`}
            >
              Sắp tới ({appointments.filter((a) => a.status === 'upcoming').length})
            </button>
            <button
              type="button"
              onClick={() => setSessionFilter('completed')}
              className={`px-3 py-1 rounded-full font-medium transition ${
                sessionFilter === 'completed'
                  ? 'bg-[#006e22] text-white'
                  : 'bg-[#ffffff] text-[#6f7a6c] border border-[#dfe4d9]'
              }`}
            >
              Đã xong ({appointments.filter((a) => a.status === 'completed').length})
            </button>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#dfe4d9] space-y-3">
              <Calendar className="w-8 h-8 text-[#6f7a6c] mx-auto opacity-50" />
              <p className="text-xs text-[#6f7a6c]">Chưa có ca tư vấn nào trong danh mục này.</p>
              <button
                type="button"
                onClick={() => setIsSchedulingOpen(true)}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full bg-[#006e22] text-white text-xs font-bold shadow-xs hover:bg-[#005116] transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Lên Lịch Hẹn Ngay
              </button>
            </div>
          ) : (
            filteredAppointments.map((apt) => {
              const clinicalData = getPatientClinicalData(apt);
              const isExpanded = expandedAptId === apt.id;
              const hasRecap = apt.doctorRecap && apt.doctorRecap.isApproved;
              const briefingText = aiBriefingMap[apt.id];
              const isLoadingBriefing = isLoadingBriefingMap[apt.id] || false;

              return (
                <div
                  key={apt.id}
                  className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3.5 shadow-2xs hover:border-[#67c76c]/60 transition"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#006e22]" />
                        <h4 className="text-sm font-bold text-[#181d16]">Bệnh nhân: {apt.userName}</h4>
                      </div>
                      <p className="text-xs text-[#6f7a6c] mt-0.5">
                        Thời gian: <strong className="text-[#006e22]">{apt.dateStr} ({apt.timeSlot})</strong>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] font-bold border border-[#67c76c]/30">
                        Google Meet 1-1
                      </span>
                      {hasRecap ? (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Đã có Recap
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> Chưa có Recap
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Patient initial notes */}
                  {apt.userNotes && (
                    <div className="p-2.5 bg-[#f7faf8] rounded-xl border border-[#dfe4d9] text-[11px] text-[#3f4a3d]">
                      <strong className="text-[#181d16]">Vấn đề của người dùng:</strong> "{apt.userNotes}"
                    </div>
                  )}

                  {/* CLINICAL DOSSIER & AI BRIEFING (ACCORDION TOGGLE) */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        audioSynth.playChime(440, 0.1);
                        if (!isExpanded && !briefingText) {
                          handleFetchAiBriefing(apt);
                        }
                        setExpandedAptId(isExpanded ? null : apt.id);
                      }}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between transition text-xs font-bold ${
                        isExpanded
                          ? 'bg-[#e0f5ea] text-[#005116] border border-[#67c76c]/40'
                          : 'bg-[#f7faf8] text-[#181d16] border border-[#dfe4d9] hover:bg-[#eef5e8]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#006e22]" />
                        <span>Xem Hồ Sơ Quiz, Nhật Ký & AI Briefing Y Khoa</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#006e22]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#6f7a6c]" />
                      )}
                    </button>

                    {/* EXPANDED DOSSIER BODY */}
                    {isExpanded && (
                      <div className="p-4 rounded-2xl bg-[#fcfdfa] border border-[#67c76c]/30 space-y-4 animate-in fade-in">
                        {/* 1. QUIZ RADAR 4-DIMENSION METRICS */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-extrabold text-[#181d16] flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-[#006e22]" />
                              <span>Chỉ Số Tầm Soát 4 Chiều (Quiz Radar):</span>
                            </h5>
                            <span className="text-[10px] text-[#6f7a6c]">Đo lường lâm sàng</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Trầm cảm PHQ-9 */}
                            <div className="p-2.5 rounded-xl bg-white border border-[#dfe4d9] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-[#4a5548]">Khí sắc (PHQ-9)</span>
                                <span className="font-extrabold text-[#181d16]">{clinicalData.depressionPct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#dfe4d9] overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${clinicalData.depressionPct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-[#6f7a6c]">
                                {clinicalData.depressionPct >= 70 ? 'Mức độ cao' : clinicalData.depressionPct >= 40 ? 'Mức độ vừa' : 'Bình thường'}
                              </span>
                            </div>

                            {/* Lo âu GAD-7 */}
                            <div className="p-2.5 rounded-xl bg-white border border-[#dfe4d9] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-[#4a5548]">Lo âu (GAD-7)</span>
                                <span className="font-extrabold text-[#181d16]">{clinicalData.anxietyPct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#dfe4d9] overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${clinicalData.anxietyPct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-[#6f7a6c]">
                                {clinicalData.anxietyPct >= 70 ? 'Cảnh báo lo âu' : 'Mức độ kiểm soát'}
                              </span>
                            </div>

                            {/* Căng thẳng PSS-10 */}
                            <div className="p-2.5 rounded-xl bg-white border border-[#dfe4d9] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-[#4a5548]">Stress (PSS-10)</span>
                                <span className="font-extrabold text-[#181d16]">{clinicalData.stressPct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#dfe4d9] overflow-hidden">
                                <div
                                  className="h-full bg-orange-500 rounded-full"
                                  style={{ width: `${clinicalData.stressPct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-[#6f7a6c]">
                                {clinicalData.stressPct >= 70 ? 'Căng thẳng cao' : 'Vừa phải'}
                              </span>
                            </div>

                            {/* Giấc ngủ PSQI */}
                            <div className="p-2.5 rounded-xl bg-white border border-[#dfe4d9] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-[#4a5548]">Giấc ngủ (PSQI)</span>
                                <span className="font-extrabold text-[#181d16]">{clinicalData.sleepPct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#dfe4d9] overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${clinicalData.sleepPct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-[#6f7a6c]">
                                {clinicalData.sleepPct >= 70 ? 'Rối loạn giấc ngủ' : 'Ổn định'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. 7-DAY MOOD & JOURNAL TIMELINE */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-extrabold text-[#181d16] flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-[#ba1a1a]" />
                            <span>Diễn Biến Cảm Xúc 7 Ngày Gần Nhất:</span>
                          </h5>
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {clinicalData.moodTimeline.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 rounded-xl bg-white border border-[#dfe4d9] space-y-1"
                                title={`${item.day}: ${item.emotion} - "${item.note}"`}
                              >
                                <span className="text-[10px] font-bold text-[#6f7a6c]">{item.day}</span>
                                <div
                                  className="w-3 h-3 rounded-full mx-auto"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-[9px] font-medium text-[#181d16] block truncate">
                                  {item.emotion}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. AI PRE-SESSION BRIEFING SUMMARY */}
                        <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-[#67c76c]/40">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#006e22]">
                              <Sparkles className="w-4 h-4" />
                              <span>AI Patient Briefing (Đọc trong 30 giây trước khi vào Meet)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleFetchAiBriefing(apt)}
                              disabled={isLoadingBriefing}
                              className="text-[10px] text-[#006e22] hover:underline flex items-center gap-1 font-semibold"
                            >
                              <RefreshCw className={`w-3 h-3 ${isLoadingBriefing ? 'animate-spin' : ''}`} />
                              Tạo Lại
                            </button>
                          </div>

                          {isLoadingBriefing ? (
                            <div className="p-4 text-center text-xs text-[#6f7a6c] space-y-1">
                              <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[#006e22]" />
                              <p>AI đang phân tích dữ liệu lâm sàng và sinh briefing...</p>
                            </div>
                          ) : briefingText ? (
                            <div className="p-3 bg-[#f7faf8] rounded-xl text-[11px] text-[#181d16] leading-relaxed whitespace-pre-line border border-[#dfe4d9]">
                              {briefingText}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleFetchAiBriefing(apt)}
                              className="w-full py-2.5 rounded-xl bg-[#006e22] hover:bg-[#005116] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                              Kích Hoạt AI Tóm Tắt Briefing Y Khoa
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#dfe4d9]">
                    {/* Launch Google Meet (Upcoming only) */}
                    {apt.status === 'upcoming' && (
                      <button
                        type="button"
                        onClick={() => onLaunchPreSession(apt)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#006e22] hover:bg-[#005116] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Vào Meet & Briefing</span>
                      </button>
                    )}

                    {/* Google Calendar Link */}
                    <a
                      href={getGoogleCalendarUrl(apt)}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-xs font-bold text-white flex items-center justify-center gap-1 shadow-2xs transition"
                      title="Mở trên Google Calendar của Chuyên gia"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Google Lịch</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                    </a>

                    {/* Upcoming session: Option to finish and transition to recap */}
                    {apt.status === 'upcoming' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onCompleteAppointment) {
                            onCompleteAppointment(apt.id);
                          }
                          setActiveRecapAptId(apt.id);
                          setActiveTab('recaps');
                          audioSynth.playChime(528, 0.5);
                        }}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold border border-[#67c76c]/40 bg-[#e0f5ea] text-[#005116] hover:bg-[#d0f0dc] flex items-center justify-center gap-1.5 transition active:scale-95"
                        title="Đánh dấu đã hoàn thành buổi tư vấn và mở biểu mẫu viết Recap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#006e22]" />
                        <span>Kết thúc ca & Viết Recap</span>
                      </button>
                    )}

                    {/* Completed session: View or Write Recap */}
                    {apt.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRecapAptId(apt.id);
                          setActiveTab('recaps');
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                          hasRecap
                            ? 'bg-[#f7faf8] text-[#4a5548] border-[#dfe4d9] hover:bg-[#f0f5ea]'
                            : 'bg-amber-100 text-amber-900 border-amber-300 font-bold hover:bg-amber-200'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#006e22]" />
                        <span>{hasRecap ? 'Xem Recap' : 'Viết Recap Ngay (Chưa gửi)'}</span>
                      </button>
                    )}

                    {/* Delete / Cancel button */}
                    <button
                      type="button"
                      onClick={() => setDeletingAptId(apt.id)}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                      title="Xóa / Hủy lịch hẹn này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VIẾT RECAP CHO KHÁCH HÀNG (DOCTOR RECAP & CARE PLAN PRESCRIPTION) */}
      {/* ========================================================================= */}
      {activeTab === 'recaps' && (
        <div className="space-y-4">
          {/* Progress Tracker Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#ffffff] to-[#e8f7ee] border border-[#67c76c]/40 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#006e22]" />
                <h3 className="text-xs font-bold text-[#181d16]">
                  Tiến Độ Hoàn Thành Recap Cho Bệnh Nhân
                </h3>
              </div>
              <span className="text-xs font-extrabold text-[#006e22]">
                {completedRecapCount} / {totalRecapSessions} ca ({completionPercentage}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#dfe4d9] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#67c76c] to-[#006e22] transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <p className="text-[11px] text-[#4a5548] leading-relaxed">
              {pendingRecapAppointments.length > 0
                ? `Hiện có ${pendingRecapAppointments.length} ca tư vấn cần bạn đúc kết và gửi bản Recap kèm đề xuất Gói Đồng Hành.`
                : 'Tuyệt vời! Bạn đã hoàn thành và gửi bản recap cho tất cả các ca tư vấn.'}
            </p>
          </div>

          {/* SECTION 1: PENDING RECAPS */}
          {pendingRecapAppointments.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#181d16] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Các ca vừa kết thúc CẦN viết recap ({pendingRecapAppointments.length})</span>
                </h4>
                <span className="text-[10px] text-[#6f7a6c] font-medium">Bắt buộc gửi sau khi kết thúc ca</span>
              </div>

              {pendingRecapAppointments.map((apt, idx) => {
                const isExpanded = activeRecapAptId === apt.id || (activeRecapAptId === null && idx === 0);
                const rawNote = rawNotesMap[apt.id] || '';
                const generatedRecap = generatedRecapMap[apt.id] || '';
                const isGenerating = isGeneratingMap[apt.id] || false;
                const selectedPlan = selectedPlanMap[apt.id] || 'UNTANGLE_3S';

                return (
                  <div
                    key={apt.id}
                    className={`rounded-3xl bg-white border transition-all duration-200 overflow-hidden shadow-2xs ${
                      isExpanded
                        ? 'border-[#006e22] ring-2 ring-[#67c76c]/30'
                        : 'border-[#dfe4d9] hover:border-[#67c76c]/60'
                    }`}
                  >
                    {/* Header bar of pending appointment */}
                    <div
                      onClick={() => setActiveRecapAptId(isExpanded ? null : apt.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#f6fbf0] transition select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 font-bold flex items-center justify-center text-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-[#181d16]">
                            Bệnh nhân: {apt.userName}
                          </h5>
                          <p className="text-[10px] text-[#6f7a6c]">
                            {apt.dateStr} • Khung giờ: {apt.timeSlot}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                          Cần Viết Recap
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#6f7a6c]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#6f7a6c]" />
                        )}
                      </div>
                    </div>

                    {/* Expandable Recap Workspace */}
                    {isExpanded && (
                      <div className="p-4 pt-0 space-y-3.5 border-t border-[#dfe4d9] animate-in fade-in bg-[#fcfdfa]">
                        {/* Patient Background note */}
                        {apt.userNotes && (
                          <div className="p-2.5 bg-white rounded-xl border border-[#dfe4d9] text-[11px] text-[#4a5548] mt-3">
                            <strong className="text-[#181d16]">Vấn đề của người dùng:</strong> "{apt.userNotes}"
                          </div>
                        )}

                        {/* Quick Template Chips */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#6f7a6c] uppercase tracking-wider block">
                            Mẫu ghi chú chẩn đoán nhanh (Chọn để điền tự động):
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickTemplate(apt.id, 'stress')}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e0f5ea] border border-[#dfe4d9] text-[10px] font-medium text-[#006e22] transition"
                            >
                              ⚡ Áp lực & Stress
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickTemplate(apt.id, 'sleep')}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e0f5ea] border border-[#dfe4d9] text-[10px] font-medium text-[#006e22] transition"
                            >
                              🌙 Rối loạn giấc ngủ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickTemplate(apt.id, 'burnout')}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e0f5ea] border border-[#dfe4d9] text-[10px] font-medium text-[#006e22] transition"
                            >
                              💼 Kiệt sức công sở
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickTemplate(apt.id, 'relationship')}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e0f5ea] border border-[#dfe4d9] text-[10px] font-medium text-[#006e22] transition"
                            >
                              💔 Khủng hoảng tình cảm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickTemplate(apt.id, 'progress')}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e0f5ea] border border-[#dfe4d9] text-[10px] font-medium text-[#006e22] transition"
                            >
                              🌿 Tiến triển tích cực
                            </button>
                          </div>
                        </div>

                        {/* Doctor Raw Notes Input */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#181d16]">
                            Ghi chú chẩn đoán thô của Chuyên gia:
                          </label>
                          <textarea
                            rows={3}
                            value={rawNote}
                            onChange={(e) =>
                              setRawNotesMap((prev) => ({ ...prev, [apt.id]: e.target.value }))
                            }
                            placeholder="VD: Bệnh nhân mất ngủ 3 tuần do thi cử/công việc, tim đập nhanh, đã dặn tập thở 4-7-8, đề xuất theo dõi tiếp sau 1 tuần..."
                            className="w-full p-3 rounded-2xl bg-white border border-[#dfe4d9] text-xs text-[#181d16] placeholder-[#6f7a6c] focus:outline-none focus:ring-2 focus:ring-[#006e22] resize-none leading-relaxed"
                          />
                        </div>

                        {/* Care Plan Recommendation Selector */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#181d16]">
                            Chỉ định Gói Đồng Hành Đề Xuất Cho Bệnh Nhân:
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setSelectedPlanMap((prev) => ({ ...prev, [apt.id]: 'STARTER_FREE' }))}
                              className={`p-2 rounded-xl text-[11px] font-bold border transition text-center ${
                                selectedPlan === 'STARTER_FREE'
                                  ? 'bg-[#006e22] text-white border-[#006e22]'
                                  : 'bg-white text-[#4a5548] border-[#dfe4d9]'
                              }`}
                            >
                              Tầm Soát (0đ)
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedPlanMap((prev) => ({ ...prev, [apt.id]: 'UNTANGLE_3S' }))}
                              className={`p-2 rounded-xl text-[11px] font-bold border transition text-center ${
                                selectedPlan === 'UNTANGLE_3S'
                                  ? 'bg-[#006e22] text-white border-[#006e22]'
                                  : 'bg-white text-[#4a5548] border-[#dfe4d9]'
                              }`}
                            >
                              Gói Gỡ Rối (3B)
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedPlanMap((prev) => ({ ...prev, [apt.id]: 'TRANSFORM_5S' }))}
                              className={`p-2 rounded-xl text-[11px] font-bold border transition text-center ${
                                selectedPlan === 'TRANSFORM_5S'
                                  ? 'bg-[#006e22] text-white border-[#006e22]'
                                  : 'bg-white text-[#4a5548] border-[#dfe4d9]'
                              }`}
                            >
                              Tái Thiết (5-10B)
                            </button>
                          </div>
                        </div>

                        {/* Generate AI Recap Button */}
                        <button
                          type="button"
                          disabled={!rawNote.trim() || isGenerating}
                          onClick={() => handleGenerateAIRecap(apt)}
                          className="w-full py-3 rounded-full bg-[#006e22] hover:bg-[#005116] disabled:opacity-40 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                          {isGenerating
                            ? 'AI Thư Ký Đang Chuẩn Hóa Bản Recap...'
                            : 'Nhờ AI Thư Ký Tạo Bản Recap 3 Phần Chuẩn Y Khoa'}
                        </button>

                        {/* Generated Preview & Send Area */}
                        {generatedRecap && (
                          <div className="space-y-2.5 p-3.5 rounded-2xl bg-white border border-[#67c76c]/50 animate-in zoom-in-95 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#006e22] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Bản Recap Chuẩn Hóa Sẽ Gửi Cho {apt.userName}
                              </span>
                            </div>

                            <textarea
                              rows={8}
                              value={generatedRecap}
                              onChange={(e) =>
                                setGeneratedRecapMap((prev) => ({ ...prev, [apt.id]: e.target.value }))
                              }
                              className="w-full p-3 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[11px] text-[#181d16] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#006e22] resize-none font-sans"
                            />

                            <button
                              type="button"
                              onClick={() => handleSendRecapToUser(apt)}
                              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#006e22] to-[#005116] hover:opacity-95 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Phê Duyệt & Gửi Recap Cho {apt.userName}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] text-center space-y-2.5 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-[#e0f5ea] text-[#006e22] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-[#181d16]">
                Hiện không có ca khám nào vừa kết thúc cần viết recap
              </h4>
              <p className="text-[11px] text-[#6f7a6c] max-w-md mx-auto leading-relaxed">
                Khi một ca tư vấn sắp tới kết thúc (hoặc được chọn "Kết thúc ca & Viết Recap"), ca khám sẽ tự động xuất hiện tại đây để bạn soạn thảo bản tóm tắt y khoa và kê đơn Gói Đồng Hành.
              </p>
            </div>
          )}

          {/* SECTION 2: COMPLETED RECAPS ARCHIVE */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#181d16] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#006e22]" />
                <span>Các ca ĐÃ hoàn thành recap ({completedRecapAppointments.length})</span>
              </h4>
            </div>

            {completedRecapAppointments.length === 0 ? (
              <div className="p-4 text-center bg-white rounded-2xl border border-dashed border-[#dfe4d9] text-xs text-[#6f7a6c]">
                Chưa có ca nào được gửi bản recap. Hãy hoàn thành các ca ở danh sách phía trên.
              </div>
            ) : (
              completedRecapAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-3xl bg-white border border-[#dfe4d9] space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#006e22]" />
                        <h5 className="text-xs font-bold text-[#181d16]">Bệnh nhân: {apt.userName}</h5>
                      </div>
                      <p className="text-[10px] text-[#6f7a6c] mt-0.5">
                        Ngày khám: {apt.dateStr} ({apt.timeSlot}) • Đã gửi lúc:{' '}
                        {apt.doctorRecap?.sentAt || 'Hôm nay'}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã Gửi Thành Công
                    </span>
                  </div>

                  {/* Sent content snippet */}
                  <div className="p-3 bg-[#f7faf8] rounded-2xl border border-[#dfe4d9] text-[11px] text-[#4a5548] leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto no-scrollbar">
                    {apt.doctorRecap?.formattedRecap}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LÊN LỊCH & XÓA LỊCH (SCHEDULE & AVAILABLE SLOTS CONFIGURATOR)       */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Quick Action Buttons Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-[#181d16] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#006e22]" />
              <span>Quản Lý Lịch Hẹn & Khung Giờ Khám</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsSchedulingOpen(!isSchedulingOpen)}
              className="py-1.5 px-3 rounded-xl bg-[#006e22] text-white text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-[#005116] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSchedulingOpen ? 'Đóng Form' : 'Lên Lịch Mới'}</span>
            </button>
          </div>

          {/* 1. FORM LÊN LỊCH CA KHÁM MỚI TRỰC TIẾP */}
          {isSchedulingOpen && (
            <form
              onSubmit={handleCreateAppointment}
              className="p-4 rounded-3xl bg-white border-2 border-[#006e22] space-y-3 shadow-md animate-in zoom-in-95"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#dfe4d9]">
                <h5 className="text-xs font-bold text-[#006e22] flex items-center gap-1.5">
                  <CalendarPlus className="w-4 h-4" />
                  <span>Lên Lịch Ca Tư Vấn Cho Bệnh Nhân:</span>
                </h5>
                <span className="text-[10px] text-[#6f7a6c]">Tự động đồng bộ</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-[#181d16]">Tên Bệnh Nhân / Khách Hàng:</label>
                  <input
                    type="text"
                    required
                    value={patientNameInput}
                    onChange={(e) => setPatientNameInput(e.target.value)}
                    placeholder="VD: Nguyễn Văn An / Trần Thị Mai"
                    className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] mt-1 text-xs focus:ring-2 focus:ring-[#006e22]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#181d16]">Ngày Khám:</label>
                    <input
                      type="text"
                      required
                      value={appointmentDateInput}
                      onChange={(e) => setAppointmentDateInput(e.target.value)}
                      placeholder="VD: 25/08/2026"
                      className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#181d16]">Khung Giờ:</label>
                    <input
                      type="text"
                      required
                      value={appointmentTimeInput}
                      onChange={(e) => setAppointmentTimeInput(e.target.value)}
                      placeholder="VD: 19:00 - 20:00"
                      className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] mt-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#181d16]">Loại Hình Tư Vấn:</label>
                  <select
                    value={sessionTypeInput}
                    onChange={(e) => setSessionTypeInput(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] mt-1 text-xs"
                  >
                    <option value="free">Buổi Khởi Đầu (Tầm Soát 1-1 Miễn Phí 0đ)</option>
                    <option value="untangle">Gói Đồng Hành Tháo Gỡ (3 Buổi Chuyên Sâu)</option>
                    <option value="transform">Gói Chuyển Hóa & Tái Thiết (5-10 Buổi)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#181d16]">Link Google Meet 1-1:</label>
                  <input
                    type="text"
                    value={customMeetUrlInput}
                    onChange={(e) => setCustomMeetUrlInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#181d16]">Ghi chú ban đầu:</label>
                  <input
                    type="text"
                    value={sessionNotesInput}
                    onChange={(e) => setSessionNotesInput(e.target.value)}
                    placeholder="VD: Khó ngủ, áp lực công việc, cần tham vấn CBT"
                    className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSchedulingOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#f7faf8] hover:bg-[#dfe4d9] text-xs font-bold text-[#4a5548] transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-[#006e22] hover:bg-[#005116] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Lên Lịch & Lưu Hệ Thống</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. DANH SÁCH LỊCH HẸN HIỆN CÓ ĐỂ QUẢN LÝ / XÓA LỊCH */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#181d16] flex items-center justify-between">
              <span>Danh Sách Lịch Hẹn Đang Có ({appointments.length}):</span>
              <span className="text-[10px] text-[#6f7a6c]">Nhấn nút xóa để hủy lịch</span>
            </h4>

            {appointments.length === 0 ? (
              <div className="p-4 text-center bg-white rounded-2xl border border-dashed border-[#dfe4d9] text-xs text-[#6f7a6c]">
                Hiện chưa có lịch hẹn nào. Chuyên gia có thể bấm "+ Lên Lịch Mới" ở trên.
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#dfe4d9] flex items-center justify-between shadow-2xs hover:border-[#67c76c]/50 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#181d16]">{apt.userName}</span>
                        <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                          apt.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {apt.status === 'completed' ? 'Đã khám' : 'Sắp tới'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6f7a6c]">
                        {apt.dateStr} • Khung giờ: <strong className="text-[#006e22]">{apt.timeSlot}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={getGoogleCalendarUrl(apt)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition"
                        title="Đồng bộ Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => downloadIcsCalendarFile(apt)}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition"
                        title="Tải file .ics iCal/Outlook"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingAptId(apt.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                        title="Xóa / Hủy lịch hẹn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. QUẢN LÝ KHUNG GIỜ RẢNH (AVAILABLE SLOTS) */}
          <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold text-[#181d16] uppercase tracking-wider">
              Mở Thêm Khung Giờ Rảnh Nhận Bệnh Nhân Mới:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-[#6f7a6c]">Thứ trong tuần:</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] mt-1 text-xs"
                >
                  <option value="T2">Thứ 2</option>
                  <option value="T3">Thứ 3</option>
                  <option value="T4">Thứ 4</option>
                  <option value="T5">Thứ 5</option>
                  <option value="T6">Thứ 6</option>
                  <option value="T7">Thứ 7</option>
                  <option value="CN">Chủ Nhật</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#6f7a6c]">Khung giờ:</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="19:00 - 20:00"
                  className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] mt-1 text-xs"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSlot}
              className="w-full py-2.5 rounded-full bg-[#006e22] hover:bg-[#005116] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Lưu Khung Giờ Rảnh Mới Vào Hệ Thống
            </button>
          </div>

          {/* Current Slots List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#181d16]">
              Các khung giờ đang mở nhận đặt ({slots.length}):
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-3 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#006e22]">{slot.dayOfWeek}</span>
                    <p className="text-xs font-bold text-[#181d16]">{slot.time}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="text-[#6f7a6c] hover:text-[#ba1a1a] p-1.5 rounded-lg hover:bg-rose-50 transition"
                    title="Xóa khung giờ này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA LỊCH HẸN */}
      {deletingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#dfe4d9] shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <CalendarX className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-[#181d16]">Xác Nhận Xóa Lịch Hẹn</h4>
              <p className="text-xs text-[#6f7a6c]">
                Bạn có chắc chắn muốn xóa ca tư vấn này khỏi hệ thống không? Dữ liệu lịch hẹn sẽ được gỡ bỏ hoàn toàn.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAptId(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#f7faf8] hover:bg-[#dfe4d9] text-xs font-bold text-[#4a5548] transition"
              >
                Giữ Lại
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deletingAptId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
