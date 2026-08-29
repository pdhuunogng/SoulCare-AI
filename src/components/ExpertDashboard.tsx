import React, { useState } from 'react';
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
  Award,
  Zap,
  Check,
  RefreshCw,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import confetti from 'canvas-confetti';

interface ExpertDashboardProps {
  expertProfile: ExpertProfile;
  appointments: Appointment[];
  onUpdateAppointmentRecap: (appointmentId: string, recapText: string) => void;
  onLaunchPreSession: (appointment: Appointment) => void;
}

export const ExpertDashboard: React.FC<ExpertDashboardProps> = ({
  expertProfile,
  appointments,
  onUpdateAppointmentRecap,
  onLaunchPreSession,
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'recaps' | 'slots'>('sessions');

  // Filter for sessions tab
  const [sessionFilter, setSessionFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  // Active expanded recap writing state per appointment ID
  const [activeRecapAptId, setActiveRecapAptId] = useState<string | null>(null);
  const [rawNotesMap, setRawNotesMap] = useState<Record<string, string>>({});
  const [generatedRecapMap, setGeneratedRecapMap] = useState<Record<string, string>>({});
  const [isGeneratingMap, setIsGeneratingMap] = useState<Record<string, boolean>>({});

  // Slots Configurator state
  const [slots, setSlots] = useState<AvailableSlot[]>(expertProfile.availableSlots);
  const [newDay, setNewDay] = useState('T3');
  const [newTime, setNewTime] = useState('19:00 - 20:00');

  // Separate pending recaps vs completed recaps
  const pendingRecapAppointments = appointments.filter(
    (apt) => !apt.doctorRecap || !apt.doctorRecap.isApproved || !apt.doctorRecap.formattedRecap
  );
  const completedRecapAppointments = appointments.filter(
    (apt) => apt.doctorRecap && apt.doctorRecap.isApproved && apt.doctorRecap.formattedRecap
  );

  const totalRecapSessions = appointments.length;
  const completedRecapCount = completedRecapAppointments.length;
  const completionPercentage = totalRecapSessions > 0
    ? Math.round((completedRecapCount / totalRecapSessions) * 100)
    : 100;

  const handleGenerateAIRecap = async (apt: Appointment) => {
    const rawDoctorNotes = rawNotesMap[apt.id] || '';
    if (!rawDoctorNotes.trim()) return;

    setIsGeneratingMap((prev) => ({ ...prev, [apt.id]: true }));

    try {
      const res = await fetch('/api/expert-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawDoctorNotes,
          userName: apt.userName,
          expertName: expertProfile.name,
        }),
      });

      const data = await res.json();
      const finalRecap = data.recap || 'Bản recap đã được khởi tạo.';
      setGeneratedRecapMap((prev) => ({ ...prev, [apt.id]: finalRecap }));
      audioSynth.playChime(528, 1);
    } catch {
      const defaultRecap = `Chào ${apt.userName}, cảm ơn bạn đã đồng hành cùng ${expertProfile.name} trong buổi tư vấn hôm nay:

1. 🌟 Đánh giá & Lắng nghe:
- Dựa trên chia sẻ, bạn đang trải qua áp lực căng thẳng và chất lượng giấc ngủ cần được chăm sóc thêm.
- Ghi nhận tiến triển tích cực khi bạn đã chủ động nhận diện cảm xúc của mình.

2. 🛠️ Lời khuyên & Bài tập nhỏ:
- Thực hành bài tập thở 4-7-8 trước khi đi ngủ 15 phút (4-6 chu kỳ).
- Ghi nhật ký cảm xúc 3 điều biết ơn vào mỗi buổi tối.

3. 📅 Lời nhắn từ Chuyên gia:
- Hãy tự hào vì bạn đã can đảm lắng nghe bản thân. Hẹn gặp lại bạn ở buổi tiếp theo!`;

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
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Collapse this recap card
    setActiveRecapAptId(null);
  };

  const handleQuickTemplate = (aptId: string, templateType: 'stress' | 'sleep' | 'relationship') => {
    const templates = {
      stress: 'Bệnh nhân căng thẳng cao do áp lực KPI và deadline, xuất hiện đau mỏi vai gáy. Đã hướng dẫn kỹ thuật thả lỏng cơ Jacobson và ngắt kết nối màn hình sau 21h. Hẹn tái khám sau 1 tuần.',
      sleep: 'Bệnh nhân khó vào giấc, hay giật mình lúc 2-3h sáng kèm hồi hộp. Đã dặn tập thở 4-7-8, uống trà hoa cúc ấm và ngâm chân thảo mộc.',
      relationship: 'Khủng hoảng mất kết nối sau xung đột tình cảm, cảm giác cô đơn và tự trách. Đã hướng dẫn bài tập viết thư xả cảm xúc không gửi và thiết lập ranh giới lành mạnh.',
    };

    setRawNotesMap((prev) => ({
      ...prev,
      [aptId]: templates[templateType],
    }));
  };

  const handleAddSlot = () => {
    const newSlot: AvailableSlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: newDay,
      dateStr: '22/08/2026',
      time: newTime,
      isBooked: false,
    };
    setSlots([...slots, newSlot]);
    audioSynth.playChime(440, 0.5);
  };

  const handleDeleteSlot = (slotId: string) => {
    setSlots(slots.filter((s) => s.id !== slotId));
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (sessionFilter === 'upcoming') return apt.status === 'upcoming';
    if (sessionFilter === 'completed') return apt.status === 'completed';
    return true;
  });

  return (
    <div className="p-4 space-y-4 pb-24 text-[#181d16] font-sans animate-in fade-in">
      {/* Header Chuyên Gia */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#ffffff] to-[#e8f7ee] border border-[#67c76c]/30 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={expertProfile.avatar}
                alt={expertProfile.name}
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-[#006e22]/40 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#006e22] border-2 border-white rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#181d16] tracking-tight">
                  {expertProfile.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#006e22] text-white text-[10px] font-bold shadow-2xs">
                  Bác sĩ Chuyên khoa
                </span>
              </div>
              <p className="text-xs text-[#4a5548] mt-0.5 font-medium">{expertProfile.title}</p>
            </div>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#dfe4d9]/70 text-center">
          <div className="p-2 rounded-2xl bg-[#ffffff]/80 border border-[#dfe4d9]">
            <span className="text-[10px] text-[#6f7a6c] block">Tổng Ca Khám</span>
            <span className="text-sm font-extrabold text-[#181d16]">{appointments.length}</span>
          </div>
          <div className="p-2 rounded-2xl bg-[#ffffff]/80 border border-[#dfe4d9]">
            <span className="text-[10px] text-[#6f7a6c] block">Chưa Recap</span>
            <span className={`text-sm font-extrabold ${pendingRecapAppointments.length > 0 ? 'text-[#ba1a1a]' : 'text-[#006e22]'}`}>
              {pendingRecapAppointments.length}
            </span>
          </div>
          <div className="p-2 rounded-2xl bg-[#ffffff]/80 border border-[#dfe4d9]">
            <span className="text-[10px] text-[#6f7a6c] block">Đã Gửi Recap</span>
            <span className="text-sm font-extrabold text-[#006e22]">{completedRecapCount}</span>
          </div>
        </div>
      </div>

      {/* Main Subtabs */}
      <div className="flex p-1 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] text-xs shadow-2xs">
        <button
          type="button"
          onClick={() => {
            audioSynth.playChime(520, 0.1);
            setActiveTab('sessions');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'sessions'
              ? 'bg-[#006e22] text-white shadow-2xs'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Ca Khám ({appointments.length})
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
          Viết Recap
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
            setActiveTab('slots');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'slots'
              ? 'bg-[#006e22] text-white shadow-2xs'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Lịch Rảnh ({slots.length})
        </button>
      </div>

      {/* TAB 1: SESSIONS MANAGEMENT */}
      {activeTab === 'sessions' && (
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
            <div className="p-8 text-center bg-white rounded-3xl border border-[#dfe4d9] space-y-2">
              <Calendar className="w-8 h-8 text-[#6f7a6c] mx-auto opacity-50" />
              <p className="text-xs text-[#6f7a6c]">Không tìm thấy ca tư vấn nào trong mục này.</p>
            </div>
          ) : (
            filteredAppointments.map((apt) => {
              const hasRecap = apt.doctorRecap && apt.doctorRecap.isApproved;
              return (
                <div
                  key={apt.id}
                  className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs hover:border-[#67c76c]/60 transition"
                >
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
                          <CheckCircle2 className="w-2.5 h-2.5" /> Đã gửi recap
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> Chưa có recap
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pre-session User Notes */}
                  {apt.userNotes && (
                    <div className="p-2.5 bg-[#f7faf8] rounded-xl border border-[#dfe4d9] text-[11px] text-[#3f4a3d]">
                      <strong className="text-[#181d16]">Vấn đề của người dùng:</strong> "{apt.userNotes}"
                    </div>
                  )}

                  {/* Briefing summary */}
                  {apt.preSessionBriefing && (
                    <p className="text-[10px] text-[#6f7a6c] bg-white p-2 rounded-lg border border-dashed border-[#dfe4d9]">
                      {apt.preSessionBriefing}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#dfe4d9]">
                    <button
                      type="button"
                      onClick={() => onLaunchPreSession(apt)}
                      className="py-2.5 px-3 rounded-full bg-[#006e22] hover:bg-[#005116] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-2xs transition"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Vào Phòng & Briefing
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveRecapAptId(apt.id);
                        setActiveTab('recaps');
                      }}
                      className={`py-2.5 px-3 rounded-full text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                        hasRecap
                          ? 'bg-[#f7faf8] text-[#4a5548] border-[#dfe4d9] hover:bg-[#f0f5ea]'
                          : 'bg-[#e0f5ea] text-[#005116] border-[#67c76c]/40 font-bold hover:bg-[#d0f0dc]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#006e22]" />
                      {hasRecap ? 'Xem / Sửa Recap' : 'Viết Recap Ngay'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: RECAP COMPLETION QUEUE FOR ALL SESSIONS */}
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
                ? `Hiện có ${pendingRecapAppointments.length} ca tư vấn đã hoàn thành cần bạn gửi bản đúc kết và lời khuyên y khoa.`
                : 'Tuyệt vời! Bạn đã hoàn thành và gửi bản recap cho 100% tất cả các ca tư vấn.'}
            </p>
          </div>

          {/* SECTION 1: PENDING RECAPS - SHOWN DIRECTLY WITHOUT DROPDOWN */}
          {pendingRecapAppointments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#181d16] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Các ca CHƯA viết recap ({pendingRecapAppointments.length})</span>
                </h4>
                <span className="text-[10px] text-[#6f7a6c] font-medium">Bắt buộc hoàn thành</span>
              </div>

              {pendingRecapAppointments.map((apt, idx) => {
                const isExpanded = activeRecapAptId === apt.id || activeRecapAptId === null && idx === 0;
                const rawNote = rawNotesMap[apt.id] || '';
                const generatedRecap = generatedRecapMap[apt.id] || '';
                const isGenerating = isGeneratingMap[apt.id] || false;

                return (
                  <div
                    key={apt.id}
                    className={`rounded-3xl bg-white border transition-all duration-200 overflow-hidden shadow-2xs ${
                      isExpanded
                        ? 'border-[#006e22] ring-2 ring-[#67c76c]/30'
                        : 'border-[#dfe4d9] hover:border-[#67c76c]/60'
                    }`}
                  >
                    {/* Header bar of each pending appointment */}
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
                          Cần Recap
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
                            Gợi ý ghi chú nhanh (Bác sĩ chọn mẫu hoặc tự nhập):
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickTemplate(apt.id, 'stress')}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e0f5ea] border border-[#dfe4d9] text-[10px] font-medium text-[#006e22] transition"
                            >
                              ⚡ Áp lực & Căng thẳng
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
                              onClick={() => handleQuickTemplate(apt.id, 'relationship')}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#e0f5ea] border border-[#dfe4d9] text-[10px] font-medium text-[#006e22] transition"
                            >
                              💔 Khủng hoảng tình cảm
                            </button>
                          </div>
                        </div>

                        {/* Doctor Raw Notes Input */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#181d16]">
                            Ghi chú chẩn đoán thô của Bác sĩ:
                          </label>
                          <textarea
                            rows={3}
                            value={rawNote}
                            onChange={(e) =>
                              setRawNotesMap((prev) => ({ ...prev, [apt.id]: e.target.value }))
                            }
                            placeholder="VD: Bệnh nhân mất ngủ 3 tuần do thi cử, tim đập nhanh, đã dặn thở 4-7-8, hẹn gặp lại tuần sau..."
                            className="w-full p-3 rounded-2xl bg-white border border-[#dfe4d9] text-xs text-[#181d16] placeholder-[#6f7a6c] focus:outline-none focus:ring-2 focus:ring-[#006e22] resize-none leading-relaxed"
                          />
                        </div>

                        {/* Generate AI Recap Button */}
                        <button
                          type="button"
                          disabled={!rawNote.trim() || isGenerating}
                          onClick={() => handleGenerateAIRecap(apt)}
                          className="w-full py-2.5 rounded-full bg-[#006e22] hover:bg-[#005116] disabled:opacity-40 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
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
                              rows={7}
                              value={generatedRecap}
                              onChange={(e) =>
                                setGeneratedRecapMap((prev) => ({ ...prev, [apt.id]: e.target.value }))
                              }
                              className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[11px] text-[#181d16] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#006e22] resize-none font-sans"
                            />

                            <button
                              type="button"
                              onClick={() => handleSendRecapToUser(apt)}
                              className="w-full py-3 rounded-full bg-gradient-to-r from-[#006e22] to-[#005116] hover:opacity-95 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
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

      {/* TAB 3: AVAILABLE SLOTS CONFIGURATOR */}
      {activeTab === 'slots' && (
        <div className="space-y-4">
          {/* Add slot form */}
          <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold text-[#181d16] uppercase tracking-wider">
              Mở Thêm Khung Giờ Rảnh Nhận Bệnh Nhân:
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
              Lưu Khung Giờ Mới Vào Hệ Thống
            </button>
          </div>

          {/* Current Slots List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#181d16]">
              Các khung giờ đang mở nhận tư vấn ({slots.length}):
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
                    className="text-[#6f7a6c] hover:text-[#ba1a1a] p-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

