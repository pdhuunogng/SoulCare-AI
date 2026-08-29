import React, { useState } from 'react';
import {
  UserRole,
  QuizResult,
  MoodEntry,
  UserChallengeProgress,
  Appointment,
  SOSBuddy,
  ExpertProfile,
} from './types';
import {
  INITIAL_MOOD_MAP,
  INITIAL_MOOD_HISTORY,
  INITIAL_CHALLENGES,
  INITIAL_EXPERTS,
  DEFAULT_SOS_BUDDY,
  MOCK_APPOINTMENTS,
} from './data/initialData';
import { DeviceFrame } from './components/DeviceFrame';
import { HomeDashboardView } from './components/HomeDashboardView';
import { ChatbotView } from './components/ChatbotView';
import { HealingHubView } from './components/HealingHubView';
import { BookingView } from './components/BookingView';
import { ProfileView } from './components/ProfileView';
import { ExpertDashboard } from './components/ExpertDashboard';
import { EmotionOrbChatbot } from './components/EmotionOrbChatbot';
import { QuizModal } from './components/QuizModal';
import { SosModal } from './components/SosModal';
import { PreSessionModal } from './components/PreSessionModal';
import { ReviewModal } from './components/ReviewModal';
import { CarePlansModal } from './components/CarePlansModal';
import { OrbThemeColor } from './components/CrystalGlassOrb';
import { DraggableVerticalFloat } from './components/DraggableVerticalFloat';
import { isPastAppointment } from './utils/dateUtils';
import {
  ShieldAlert,
} from 'lucide-react';
import { audioSynth } from './utils/audioSynth';

export default function App() {
  // OS Platform Simulation ('ios' | 'android' | 'responsive')
  const [platform, setPlatform] = useState<'ios' | 'android' | 'responsive'>('ios');

  // Role: 'user' | 'expert' | 'admin'
  const [role, setRole] = useState<UserRole>('user');

  // Navigation tab: 'home' | 'chat' | 'healing' | 'booking' | 'profile' | 'expert-dash'
  const [currentTab, setCurrentTab] = useState<'home' | 'chat' | 'healing' | 'booking' | 'profile' | 'expert-dash'>('home');

  // Orb Theme Color (Mint, Amber, Lavender, Rose, Ocean)
  const [currentOrbTheme, setCurrentOrbTheme] = useState<OrbThemeColor>('mint');

  // User Profile state
  const [userName, setUserName] = useState<string>('Thanh Hà');
  const [sosBuddy, setSosBuddy] = useState<SOSBuddy>(DEFAULT_SOS_BUDDY);

  // Quiz state
  const [quizResult, setQuizResult] = useState<QuizResult | null>({
    tier: 'tier1',
    overallSummary: 'Mức độ lo âu và căng thẳng ở ngưỡng nhẹ, chất lượng giấc ngủ cần được chú ý cải thiện.',
    depressionPct: 35,
    anxietyPct: 45,
    stressPct: 55,
    sleepPct: 60,
    timestamp: '15/08/2026',
  });
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([
    {
      tier: 'tier1',
      overallSummary: 'Mức độ lo âu và căng thẳng ở ngưỡng nhẹ.',
      depressionPct: 35,
      anxietyPct: 45,
      stressPct: 55,
      sleepPct: 60,
      timestamp: '15/08/2026',
    },
  ]);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // All Mood History (Persisted in localStorage from start of usage, never deleted)
  const [allMoodHistory, setAllMoodHistory] = useState<MoodEntry[]>(() => {
    try {
      const stored = localStorage.getItem('soulcare_all_mood_history_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_MOOD_HISTORY;
  });

  // 7-day Mood Map state (Synchronized with the most recent 7 days of allMoodHistory)
  const [moodMap, setMoodMap] = useState<MoodEntry[]>(() => allMoodHistory.slice(-7));

  // Handler to update mood map and persist to full history
  const handleUpdateMoodMap = (updated7Days: MoodEntry[]) => {
    setMoodMap(updated7Days);
    setAllMoodHistory((prev) => {
      const mapByDate = new Map<string, MoodEntry>();
      // Put existing history
      prev.forEach((entry) => mapByDate.set(entry.date, entry));
      // Overwrite/insert with updated 7 days
      updated7Days.forEach((entry) => mapByDate.set(entry.date, entry));
      const newAll = Array.from(mapByDate.values()).sort(
        (a, b) => (a.timestamp || new Date(a.date).getTime()) - (b.timestamp || new Date(b.date).getTime())
      );
      try {
        localStorage.setItem('soulcare_all_mood_history_v2', JSON.stringify(newAll));
      } catch {
        // ignore
      }
      return newAll;
    });
  };

  // Handler to update or append to the entire history
  const handleUpdateAllMoodHistory = (newHistory: MoodEntry[]) => {
    const sorted = [...newHistory].sort(
      (a, b) => (a.timestamp || new Date(a.date).getTime()) - (b.timestamp || new Date(b.date).getTime())
    );
    setAllMoodHistory(sorted);
    setMoodMap(sorted.slice(-7));
    try {
      localStorage.setItem('soulcare_all_mood_history_v2', JSON.stringify(sorted));
    } catch {
      // ignore
    }
  };

  // Challenge progress state
  const [challengeProgress, setChallengeProgress] = useState<UserChallengeProgress | null>({
    challengeId: 'ch-6',
    challengeTitle: '21 Ngày Tái Thiết Giấc Ngủ & Thư Giãn',
    currentStreak: 12,
    totalDays: 21,
    daysCompletedCount: 12,
    todayCompleted: false,
    lastCheckInDate: '2026-08-14',
  });

  // Appointments state (only valid upcoming future appointments are stored & displayed)
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    MOCK_APPOINTMENTS.filter((a) => a.status === 'upcoming' && !isPastAppointment(a))
  );

  // Modals state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isCarePlansOpen, setIsCarePlansOpen] = useState(false);
  const [preSessionAppointment, setPreSessionAppointment] = useState<Appointment | null>(null);
  const [reviewingExpert, setReviewingExpert] = useState<ExpertProfile | null>(null);

  // Handlers
  const handleCompleteQuiz = (res: QuizResult) => {
    setQuizResult(res);
    setQuizHistory((prev) => [...prev, res]);
  };

  const handleBookAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [
      newApt,
      ...prev.filter((a) => a.status === 'upcoming' && !isPastAppointment(a)),
    ]);
  };

  const handleCancelAppointment = (appointmentId: string, _reason?: string) => {
    // Xóa hoàn toàn lịch hẹn đã hủy khỏi bộ nhớ dữ liệu và giao diện
    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    // If preSessionAppointment is the cancelled one, close it
    setPreSessionAppointment((curr) => (curr?.id === appointmentId ? null : curr));
    audioSynth.playNotification();
  };

  const handleUpdateAppointmentRecap = (appointmentId: string, recapText: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              status: 'completed',
              doctorRecap: {
                formattedRecap: recapText,
                sentAt: new Date().toLocaleDateString('vi-VN'),
                isApproved: true,
              },
            }
          : a
      )
    );
  };

  const handleCheckInStreak = () => {
    if (!challengeProgress) return;
    const updated: UserChallengeProgress = {
      ...challengeProgress,
      currentStreak: challengeProgress.currentStreak + 1,
      todayCompleted: true,
      lastCheckInDate: new Date().toISOString().split('T')[0],
      daysCompletedCount: Math.min(
        challengeProgress.daysCompletedCount + 1,
        challengeProgress.totalDays
      ),
    };
    setChallengeProgress(updated);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setCurrentTab('home');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Device Frame Simulator */}
      <DeviceFrame
        platform={platform}
        onPlatformChange={setPlatform}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        role={role}
        onRoleChange={handleRoleChange}
        currentOrbTheme={currentOrbTheme}
      >
        {/* VIEW 1: HOME DASHBOARD (FOR BOTH USER AND EXPERT) */}
        {currentTab === 'home' && (
          <HomeDashboardView
            role={role}
            userName={role === 'expert' ? 'TS. BS. Nguyễn Minh Anh' : userName}
            quizResult={quizResult}
            moodMap={moodMap}
            allMoodHistory={allMoodHistory}
            onUpdateMoodMap={handleUpdateMoodMap}
            onUpdateAllMoodHistory={handleUpdateAllMoodHistory}
            challengeProgress={challengeProgress}
            onUpdateChallengeProgress={setChallengeProgress}
            upcomingAppointments={appointments}
            onOpenQuiz={() => setIsQuizOpen(true)}
            onOpenSOS={() => setIsSOSOpen(true)}
            onOpenBreathing={() => setCurrentTab('healing')}
            onOpenHealingHub={() => setCurrentTab('healing')}
            onOpenBooking={() => setCurrentTab('booking')}
            onOpenPreSession={(apt) => setPreSessionAppointment(apt)}
            onNavigateToChat={() => setIsAIChatOpen(true)}
            currentOrbTheme={currentOrbTheme}
            onChangeOrbTheme={setCurrentOrbTheme}
          />
        )}

        {/* VIEW 2: AI COMPANION CHATBOT */}
        {currentTab === 'chat' && (
          <ChatbotView
            userName={userName}
            quizResult={quizResult}
            moodMap={moodMap}
            challengeProgress={challengeProgress}
            latestAppointment={appointments[0] || null}
            sosBuddy={sosBuddy}
            onNavigateToBreathing={() => setCurrentTab('healing')}
            onNavigateToHealingHub={() => setCurrentTab('healing')}
            onNavigateToBooking={() => setCurrentTab('booking')}
            onNavigateToStreak={() => setCurrentTab('home')}
            onViewCarePlans={() => setIsCarePlansOpen(true)}
            onTriggerSOS={() => setIsSOSOpen(true)}
          />
        )}

        {/* VIEW 3: HEALING HUB */}
        {currentTab === 'healing' && (
          <HealingHubView initialBreathingOpen={false} />
        )}

        {/* VIEW 4: BOOKING / EXPERT DASHBOARD (IF ROLE IS EXPERT, LỊCH KHÁM RENDERS EXPERT DASHBOARD) */}
        {currentTab === 'booking' && (
          role === 'expert' ? (
            <ExpertDashboard
              expertProfile={INITIAL_EXPERTS[0]}
              appointments={appointments}
              onUpdateAppointmentRecap={handleUpdateAppointmentRecap}
              onLaunchPreSession={(apt) => setPreSessionAppointment(apt)}
            />
          ) : (
            <BookingView
              onBookAppointment={handleBookAppointment}
              onCancelAppointment={handleCancelAppointment}
              onOpenReviewModal={(exp) => setReviewingExpert(exp)}
              onOpenPreSession={(apt) => setPreSessionAppointment(apt)}
              existingAppointments={appointments}
              userQuizRadar={
                quizResult
                  ? `Trầm cảm ${quizResult.depressionPct}%, Lo âu ${quizResult.anxietyPct}%, Stress ${quizResult.stressPct}%, Giấc ngủ ${quizResult.sleepPct}%`
                  : undefined
              }
            />
          )
        )}

        {/* VIEW 5: PROFILE & BUSINESS SETTINGS */}
        {currentTab === 'profile' && (
          <ProfileView
            currentRole={role}
            onRoleChange={handleRoleChange}
            userName={userName}
            onUpdateUserName={setUserName}
            sosBuddy={sosBuddy}
            onUpdateSOSBuddy={setSosBuddy}
            quizHistory={quizHistory}
            challengeProgress={challengeProgress}
            onOpenQuiz={() => setIsQuizOpen(true)}
            onOpenSOS={() => setIsSOSOpen(true)}
            onCheckInStreak={handleCheckInStreak}
            onOpenBreathing={() => setCurrentTab('healing')}
            onOpenHealingHub={() => setCurrentTab('healing')}
            onNavigateToChallenge={() => setCurrentTab('home')}
            currentOrbTheme={currentOrbTheme}
            onChangeOrbTheme={setCurrentOrbTheme}
          />
        )}

        {/* VIEW 6: EXPERT DASHBOARD (FALLBACK) */}
        {currentTab === 'expert-dash' && (
          <ExpertDashboard
            expertProfile={INITIAL_EXPERTS[0]}
            appointments={appointments}
            onUpdateAppointmentRecap={handleUpdateAppointmentRecap}
            onLaunchPreSession={(apt) => setPreSessionAppointment(apt)}
          />
        )}

        {/* FLOATING GLASS EMOTION ORB & AI CHATBOT OVERLAY (QUẢ CẦU CẢM XÚC THỦY TINH NỔI STITCH) - ẨN KHI Ở TAB TRỢ LÝ AI */}
        {currentTab !== 'chat' && (
          <EmotionOrbChatbot
            userName={userName}
            quizResult={quizResult}
            moodMap={moodMap}
            challengeProgress={challengeProgress}
            latestAppointment={appointments[0] || null}
            sosBuddy={sosBuddy}
            isOpen={isAIChatOpen}
            onToggleOpen={setIsAIChatOpen}
            onNavigateToBreathing={() => setCurrentTab('healing')}
            onNavigateToHealingHub={() => setCurrentTab('healing')}
            onNavigateToBooking={() => setCurrentTab('booking')}
            onNavigateToStreak={() => setCurrentTab('home')}
            onViewCarePlans={() => setIsCarePlansOpen(true)}
            onTriggerSOS={() => setIsSOSOpen(true)}
            currentOrbTheme={currentOrbTheme}
            onChangeOrbTheme={setCurrentOrbTheme}
          />
        )}

        {/* FLOATING EMERGENCY SOS BUTTON (WITH VERTICAL DRAGGING) */}
        <DraggableVerticalFloat
          side="left"
          storageKey="soulcare_sos_float_pos_y"
          tooltip="Nút Cứu Hộ SOS Khẩn Cấp - Chạm để kích hoạt"
          onClick={() => {
            audioSynth.playChime(440, 0.5);
            setIsSOSOpen(true);
          }}
        >
          <div
            className="p-3 rounded-full bg-rose-600/95 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 border border-rose-400/60 flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-105 backdrop-blur-sm"
            title="Nút Cứu Hộ SOS Khẩn Cấp"
          >
            <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
          </div>
        </DraggableVerticalFloat>
      </DeviceFrame>

      {/* MODALS */}
      {/* 1. Multidimensional Mental Health Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onCompleteQuiz={handleCompleteQuiz}
        onTriggerSOS={() => {
          setIsQuizOpen(false);
          setIsSOSOpen(true);
        }}
      />

      {/* 2. Emergency SOS Drawer Modal */}
      <SosModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        sosBuddy={sosBuddy}
        onStartBreathing={() => {
          setIsSOSOpen(false);
          setCurrentTab('healing');
        }}
      />

      {/* 3. Care Plans Modal (Gói Đồng Hành Điều Trị) */}
      <CarePlansModal
        isOpen={isCarePlansOpen}
        onClose={() => setIsCarePlansOpen(false)}
        onSelectPlan={(plan) => {
          setIsCarePlansOpen(false);
          setCurrentTab('booking');
        }}
        userName={userName}
        recommendedPlan={appointments[0]?.status === 'completed' ? 'UNTANGLE_3S' : 'STARTER_FREE'}
      />

      {/* 4. Pre-Session Google Meet Briefing Modal */}
      {preSessionAppointment && (
        <PreSessionModal
          isOpen={!!preSessionAppointment}
          onClose={() => setPreSessionAppointment(null)}
          appointment={preSessionAppointment}
          role={role}
          onCancelAppointment={handleCancelAppointment}
        />
      )}

      {/* 5. Expert Review Modal */}
      {reviewingExpert && (
        <ReviewModal
          isOpen={!!reviewingExpert}
          onClose={() => setReviewingExpert(null)}
          expert={reviewingExpert}
          onSubmitReview={(rev) => {
            console.log('Review submitted:', rev);
          }}
        />
      )}
    </div>
  );
}
