import React, { useState, useEffect } from 'react';
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
  Home,
  Headphones,
  Calendar,
  MessageCircle,
  User,
} from 'lucide-react';
import { audioSynth } from './utils/audioSynth';
import { useFirebase } from './context/FirebaseContext';
import { AuthModal } from './components/AuthModal';
import { AuthGateView } from './components/AuthGateView';
import {
  saveMoodLog,
  subscribeMoodLogs,
  saveQuizResult,
  subscribeQuizResults,
  saveChallengeProgress,
  subscribeChallengeProgress,
  subscribeUserChallenges,
  saveAppointment,
  deleteAppointment,
  subscribeUserAppointments,
  subscribeAllAppointments,
  syncUserProfile,
  subscribeUserProfile,
} from './services/firestoreService';

export default function App() {
  const { user, isAuthModalOpen, setIsAuthModalOpen } = useFirebase();

  // Role: 'user' | 'expert' | 'admin'
  const [role, setRole] = useState<UserRole>('user');

  // Navigation tab: 'home' | 'chat' | 'healing' | 'booking' | 'profile' | 'expert-dash'
  const [currentTab, setCurrentTab] = useState<'home' | 'chat' | 'healing' | 'booking' | 'profile' | 'expert-dash'>('home');

  // Orb Theme Color (Mint, Amber, Lavender, Rose, Ocean)
  const [currentOrbTheme, setCurrentOrbTheme] = useState<OrbThemeColor>('mint');

  // User Profile state
  const [userName, setUserName] = useState<string>('Người dùng SoulCare');
  const [sosBuddy, setSosBuddy] = useState<SOSBuddy>(DEFAULT_SOS_BUDDY);

  // Quiz state
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // All Mood History
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
    return [];
  });

  // 7-day Mood Map state
  const [moodMap, setMoodMap] = useState<MoodEntry[]>(() => allMoodHistory.slice(-7));

  // Challenge progress state
  const [challengeProgress, setChallengeProgress] = useState<UserChallengeProgress | null>(null);

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modals state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isCarePlansOpen, setIsCarePlansOpen] = useState(false);
  const [preSessionAppointment, setPreSessionAppointment] = useState<Appointment | null>(null);
  const [reviewingExpert, setReviewingExpert] = useState<ExpertProfile | null>(null);

  // Danh sách nút Bottom Navigation theo Role
  const userNavItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'healing', label: 'Trị liệu', icon: Headphones },
    { id: 'booking', label: 'Đặt lịch', icon: Calendar },
    { id: 'chat', label: 'Trợ lý AI', icon: MessageCircle },
    { id: 'profile', label: 'Cá nhân', icon: User },
  ] as const;

  const expertNavItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'booking', label: 'Lịch khám', icon: Calendar },
    { id: 'healing', label: 'Trị liệu', icon: Headphones },
    { id: 'chat', label: 'Trợ lý AI', icon: MessageCircle },
    { id: 'profile', label: 'Cá nhân', icon: User },
  ] as const;

  const navItems = role === 'expert' ? expertNavItems : userNavItems;

  // ==========================================
  // REAL-TIME FIRESTORE SYNCHRONIZATION HOOKS
  // ==========================================
  useEffect(() => {
    if (!user) {
      setAllMoodHistory([]);
      setMoodMap([]);
      setQuizResult(null);
      setQuizHistory([]);
      setChallengeProgress(null);
      setAppointments([]);
      setUserName('Người dùng SoulCare');
      try {
        localStorage.removeItem('soulcare_all_mood_history_v2');
      } catch {
        // ignore
      }
      return;
    }

    if (user.displayName) {
      setUserName(user.displayName);
    } else if (user.email) {
      setUserName(user.email.split('@')[0]);
    }

    const unsubProfile = subscribeUserProfile(user.uid, (profile) => {
      if (profile) {
        if (profile.role) setRole(profile.role);
        if (profile.name) setUserName(profile.name);
        if (profile.currentOrbTheme) setCurrentOrbTheme(profile.currentOrbTheme as OrbThemeColor);
        if (profile.sosBuddy) setSosBuddy(profile.sosBuddy);
      }
    });

    const unsubMood = subscribeMoodLogs(user.uid, (entries) => {
      setAllMoodHistory(entries || []);
      setMoodMap((entries || []).slice(-7));
      try {
        if (entries && entries.length > 0) {
          localStorage.setItem('soulcare_all_mood_history_v2', JSON.stringify(entries));
        } else {
          localStorage.removeItem('soulcare_all_mood_history_v2');
        }
      } catch {
        // ignore
      }
    });

    const unsubQuiz = subscribeQuizResults(user.uid, (results) => {
      setQuizHistory(results || []);
      setQuizResult(results && results.length > 0 ? results[results.length - 1] : null);
    });

    const unsubChallenge = subscribeUserChallenges(user.uid, (progress) => {
      setChallengeProgress(progress || null);
    });

    const unsubAppointments = (role === 'expert')
      ? subscribeAllAppointments((serverAppts) => {
          if (serverAppts && serverAppts.length > 0) {
            setAppointments(serverAppts);
          } else {
            setAppointments([
              {
                id: 'apt-exp-1',
                type: 'online',
                userId: 'user_1',
                userName: 'Nguyễn Thu Trang',
                expertId: INITIAL_EXPERTS[0].id,
                expertName: INITIAL_EXPERTS[0].name,
                expertTitle: INITIAL_EXPERTS[0].title,
                expertAvatar: INITIAL_EXPERTS[0].avatar,
                dateStr: new Date(Date.now() + 86400000).toLocaleDateString('vi-VN'),
                timeSlot: '19:00 - 20:00',
                googleMeetLink: 'https://meet.google.com/air-rise-taman',
                googleCalendarSynced: false,
                status: 'upcoming',
                userNotes: 'Khó ngủ kéo dài 3 tuần, tim đập nhanh và lo âu deadline dồn dập.',
              },
              {
                id: 'apt-exp-2',
                type: 'online',
                userId: 'user_2',
                userName: 'Trần Minh Hoàng',
                expertId: INITIAL_EXPERTS[0].id,
                expertName: INITIAL_EXPERTS[0].name,
                expertTitle: INITIAL_EXPERTS[0].title,
                expertAvatar: INITIAL_EXPERTS[0].avatar,
                dateStr: new Date().toLocaleDateString('vi-VN'),
                timeSlot: '14:30 - 15:30',
                googleMeetLink: 'https://meet.google.com/air-rise-taman',
                googleCalendarSynced: false,
                status: 'upcoming',
                userNotes: 'Hội chứng kiệt sức công sở (Burnout), mất tập trung và muốn tìm lại năng lượng tích cực.',
              },
            ]);
          }
        })
      : subscribeUserAppointments(user.uid, (serverAppts) => {
          if (serverAppts && serverAppts.length > 0) {
            setAppointments(serverAppts.filter((a) => a.status === 'upcoming' && !isPastAppointment(a)));
          } else {
            setAppointments([]);
          }
        });

    return () => {
      unsubProfile();
      unsubMood();
      unsubQuiz();
      unsubChallenge();
      unsubAppointments();
    };
  }, [user, role]);

  const handleUpdateMoodMap = (updated7Days: MoodEntry[]) => {
    setMoodMap(updated7Days);
    setAllMoodHistory((prev) => {
      const mapByDate = new Map<string, MoodEntry>();
      prev.forEach((entry) => mapByDate.set(entry.date, entry));
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

    if (user) {
      updated7Days.forEach((entry) => {
        saveMoodLog(user.uid, entry);
      });
    }
  };

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

    if (user) {
      sorted.forEach((entry) => {
        saveMoodLog(user.uid, entry);
      });
    }
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
    if (user) {
      saveChallengeProgress(user.uid, updated);
    }
  };

  const handleUpdateChallengeProgress = (progress: UserChallengeProgress) => {
    setChallengeProgress(progress);
    if (user) {
      saveChallengeProgress(user.uid, progress);
    }
  };

  const handleCompleteQuiz = (res: QuizResult) => {
    setQuizResult(res);
    setQuizHistory((prev) => [...prev, res]);
    if (user) {
      saveQuizResult(user.uid, res);
    }
  };

  const handleBookAppointment = (newApt: Appointment) => {
    const aptWithUser = {
      ...newApt,
      userId: user?.uid || newApt.userId || 'guest_user',
    };
    setAppointments((prev) => [
      aptWithUser,
      ...prev.filter((a) => a.status === 'upcoming' && !isPastAppointment(a)),
    ]);
    if (user) {
      saveAppointment(aptWithUser);
    }
  };

  const handleCancelAppointment = (appointmentId: string, _reason?: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    setPreSessionAppointment((curr) => (curr?.id === appointmentId ? null : curr));
    if (user) {
      deleteAppointment(appointmentId);
    }
    audioSynth.playNotification();
  };

  const handleCompleteAppointment = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appointmentId) {
          const updated: Appointment = {
            ...a,
            status: 'completed',
          };
          if (user) {
            saveAppointment(updated);
          }
          return updated;
        }
        return a;
      })
    );
  };

  const handleUpdateAppointmentRecap = (appointmentId: string, recapText: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appointmentId) {
          const updated: Appointment = {
            ...a,
            status: 'completed',
            doctorRecap: {
              formattedRecap: recapText,
              sentAt: new Date().toLocaleDateString('vi-VN'),
              isApproved: true,
            },
          };
          if (user) {
            saveAppointment(updated);
          }
          return updated;
        }
        return a;
      })
    );
  };

  const handleUpdateUserName = (name: string) => {
    setUserName(name);
    if (user) {
      syncUserProfile({
        userId: user.uid,
        email: user.email || '',
        name,
      });
    }
  };

  const handleUpdateSOSBuddy = (buddy: SOSBuddy) => {
    setSosBuddy(buddy);
    if (user) {
      syncUserProfile({
        userId: user.uid,
        email: user.email || '',
        name: userName,
        sosBuddy: buddy,
      });
    }
  };

  const handleOrbThemeChange = (theme: OrbThemeColor) => {
    setCurrentOrbTheme(theme);
    if (user) {
      syncUserProfile({
        userId: user.uid,
        email: user.email || '',
        name: userName,
        currentOrbTheme: theme,
      });
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setCurrentTab('home');
    if (user) {
      syncUserProfile({
        userId: user.uid,
        email: user.email || '',
        name: userName,
        role: newRole,
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f6fbf0] text-[#181d16] flex flex-col items-center justify-start p-0 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* 1. MÀN HÌNH ĐĂNG NHẬP / AUTH GATE (FULL WIDTH TRÀN VIỀN NỀN XANH NHẸ) */}
      {!user ? (
        <div className="w-full min-h-screen bg-[#f6fbf0] text-[#181d16] flex flex-col justify-center items-center p-4 sm:p-8">
          <div className="w-full max-w-xl">
            <AuthGateView onAuthSuccess={() => setCurrentTab('home')} />
          </div>
        </div>
      ) : (
        /* 2. MÀN HÌNH ỨNG DỤNG CHÍNH KHI ĐÃ ĐĂNG NHẬP (FULL RESPONSIVE TOÀN MÀN HÌNH) */
        <div className="w-full min-h-screen bg-[#f6fbf0] text-[#181d16] flex flex-col relative pb-20 overflow-x-hidden">
          
          {/* VÙNG NỘI DUNG CHÍNH CÁC TAB */}
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-4 overflow-y-auto overflow-x-hidden flex flex-col relative bg-[#f6fbf0]">
            {/* VIEW 1: HOME DASHBOARD */}
            {currentTab === 'home' && (
              <HomeDashboardView
                role={role}
                userName={role === 'expert' ? (userName && userName !== 'Người dùng SoulCare' ? userName : 'Chuyên gia') : userName}
                quizResult={quizResult}
                moodMap={moodMap}
                allMoodHistory={allMoodHistory}
                onUpdateMoodMap={handleUpdateMoodMap}
                onUpdateAllMoodHistory={handleUpdateAllMoodHistory}
                challengeProgress={challengeProgress}
                onUpdateChallengeProgress={handleUpdateChallengeProgress}
                upcomingAppointments={appointments}
                onOpenQuiz={() => setIsQuizOpen(true)}
                onOpenSOS={() => setIsSOSOpen(true)}
                onOpenBreathing={() => setCurrentTab('healing')}
                onOpenHealingHub={() => setCurrentTab('healing')}
                onOpenBooking={() => setCurrentTab('booking')}
                onOpenPreSession={(apt) => setPreSessionAppointment(apt)}
                onNavigateToChat={() => setIsAIChatOpen(true)}
                currentOrbTheme={currentOrbTheme}
                onChangeOrbTheme={handleOrbThemeChange}
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

            {/* VIEW 4: BOOKING / EXPERT DASHBOARD */}
            {currentTab === 'booking' && (
              role === 'expert' ? (
                <ExpertDashboard
                  expertProfile={INITIAL_EXPERTS[0]}
                  appointments={appointments}
                  onUpdateAppointmentRecap={handleUpdateAppointmentRecap}
                  onCompleteAppointment={handleCompleteAppointment}
                  onLaunchPreSession={(apt) => setPreSessionAppointment(apt)}
                  onAddAppointment={handleBookAppointment}
                  onDeleteAppointment={handleCancelAppointment}
                  currentUserName={userName}
                  currentUserEmail={user?.email || undefined}
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

            {/* VIEW 5: PROFILE */}
            {currentTab === 'profile' && (
              <ProfileView
                currentRole={role}
                onRoleChange={handleRoleChange}
                userName={userName}
                onUpdateUserName={handleUpdateUserName}
                sosBuddy={sosBuddy}
                onUpdateSOSBuddy={handleUpdateSOSBuddy}
                quizHistory={quizHistory}
                challengeProgress={challengeProgress}
                onOpenQuiz={() => setIsQuizOpen(true)}
                onOpenSOS={() => setIsSOSOpen(true)}
                onCheckInStreak={handleCheckInStreak}
                onOpenBreathing={() => setCurrentTab('healing')}
                onOpenHealingHub={() => setCurrentTab('healing')}
                onNavigateToChallenge={() => setCurrentTab('home')}
                currentOrbTheme={currentOrbTheme}
                onChangeOrbTheme={handleOrbThemeChange}
              />
            )}

            {/* VIEW 6: EXPERT DASHBOARD (FALLBACK) */}
            {currentTab === 'expert-dash' && (
              <ExpertDashboard
                expertProfile={INITIAL_EXPERTS[0]}
                appointments={appointments}
                onUpdateAppointmentRecap={handleUpdateAppointmentRecap}
                onCompleteAppointment={handleCompleteAppointment}
                onLaunchPreSession={(apt) => setPreSessionAppointment(apt)}
                onAddAppointment={handleBookAppointment}
                onDeleteAppointment={handleCancelAppointment}
                currentUserName={userName}
                currentUserEmail={user?.email || undefined}
              />
            )}
          </main>

          {/* FLOATING GLASS EMOTION ORB (ẨN KHI Ở TAB CHAT) */}
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
              onChangeOrbTheme={handleOrbThemeChange}
            />
          )}

          {/* FLOATING EMERGENCY SOS BUTTON (HỖ TRỢ KÉO TRƯỢT DỌC) */}
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

          {/* THANH BOTTOM NAVIGATION CỐ ĐỊNH CHÂN TRANG (FULL WIDTH CO GIÃN THEO KHUNG) */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-5xl bg-white/95 backdrop-blur-md border-t border-[#dfe4d9] px-4 py-2 flex items-center justify-around shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    audioSynth.playChime(520, 0.15);
                    setCurrentTab(item.id as any);
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 py-1 px-4 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#d6f5df] text-[#005116] font-bold scale-105 shadow-sm border border-[#67c76c]/30'
                      : 'text-[#4a6551] hover:text-[#181d16]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#006e22] stroke-[2.5]' : 'text-[#4a6551]'
                    }`}
                  />
                  <span
                    className={`text-[11px] tracking-tight ${
                      isActive ? 'text-[#005116] font-black' : 'text-[#4a6551] font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* MODALS LIÊN KẾT */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onCompleteQuiz={handleCompleteQuiz}
        onTriggerSOS={() => {
          setIsQuizOpen(false);
          setIsSOSOpen(true);
        }}
      />

      <SosModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        sosBuddy={sosBuddy}
        onStartBreathing={() => {
          setIsSOSOpen(false);
          setCurrentTab('healing');
        }}
      />

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

      {preSessionAppointment && (
        <PreSessionModal
          isOpen={!!preSessionAppointment}
          onClose={() => setPreSessionAppointment(null)}
          appointment={preSessionAppointment}
          role={role}
          onCancelAppointment={handleCancelAppointment}
        />
      )}

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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}