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

  // OS Platform Simulation ('ios' | 'android' | 'responsive')
  const [platform, setPlatform] = useState<'ios' | 'android' | 'responsive'>('ios');

  // Role: 'user' | 'expert' | 'admin'
  const [role, setRole] = useState<UserRole>('user');

  // Navigation tab: 'home' | 'chat' | 'healing' | 'booking' | 'profile' | 'expert-dash'
  const [currentTab, setCurrentTab] = useState<'home' | 'chat' | 'healing' | 'booking' | 'profile' | 'expert-dash'>('home');

  // Orb Theme Color (Mint, Amber, Lavender, Rose, Ocean)
  const [currentOrbTheme, setCurrentOrbTheme] = useState<OrbThemeColor>('mint');

  // User Profile state (Defaults to clean state for new user / visitor)
  const [userName, setUserName] = useState<string>('Người dùng SoulCare');
  const [sosBuddy, setSosBuddy] = useState<SOSBuddy>(DEFAULT_SOS_BUDDY);

  // Quiz state (Reset / empty for new users)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // All Mood History (Clean for new users, populated via Firestore on login)
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

  // 7-day Mood Map state (Synchronized with allMoodHistory or empty)
  const [moodMap, setMoodMap] = useState<MoodEntry[]>(() => allMoodHistory.slice(-7));

  // Challenge progress state (Clean / unstarted for new users)
  const [challengeProgress, setChallengeProgress] = useState<UserChallengeProgress | null>(null);

  // Appointments state (Clean for new users)
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modals state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isCarePlansOpen, setIsCarePlansOpen] = useState(false);
  const [preSessionAppointment, setPreSessionAppointment] = useState<Appointment | null>(null);
  const [reviewingExpert, setReviewingExpert] = useState<ExpertProfile | null>(null);

  // ==========================================
  // REAL-TIME FIRESTORE SYNCHRONIZATION HOOKS
  // ==========================================
  useEffect(() => {
    if (!user) {
      // When not logged in or logged out: Reset all user-specific data to clean state
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

    // When logged in: Update display name from Firebase auth
    if (user.displayName) {
      setUserName(user.displayName);
    } else if (user.email) {
      setUserName(user.email.split('@')[0]);
    }

    // 0. Subscribe to User Profile in Firestore
    const unsubProfile = subscribeUserProfile(user.uid, (profile) => {
      if (profile) {
        if (profile.role) setRole(profile.role);
        if (profile.name) setUserName(profile.name);
        if (profile.currentOrbTheme) setCurrentOrbTheme(profile.currentOrbTheme as OrbThemeColor);
        if (profile.sosBuddy) setSosBuddy(profile.sosBuddy);
      }
    });

    // 1. Subscribe to Mood Logs in Firestore (New users will start with empty array)
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

    // 2. Subscribe to Quiz Results in Firestore
    const unsubQuiz = subscribeQuizResults(user.uid, (results) => {
      setQuizHistory(results || []);
      setQuizResult(results && results.length > 0 ? results[results.length - 1] : null);
    });

    // 3. Subscribe to Challenge Progress in Firestore
    const unsubChallenge = subscribeUserChallenges(user.uid, (progress) => {
      setChallengeProgress(progress || null);
    });

    // 4. Subscribe to Appointments in Firestore
    const unsubAppointments = (role === 'expert')
      ? subscribeAllAppointments((serverAppts) => {
          if (serverAppts && serverAppts.length > 0) {
            setAppointments(serverAppts);
          } else {
            // Seed a few initial demo appointments for the doctor if none exist in Firestore
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
              {
                id: 'apt-exp-3',
                type: 'online',
                userId: 'user_3',
                userName: 'Lê Hoàng Yến',
                expertId: INITIAL_EXPERTS[0].id,
                expertName: INITIAL_EXPERTS[0].name,
                expertTitle: INITIAL_EXPERTS[0].title,
                expertAvatar: INITIAL_EXPERTS[0].avatar,
                dateStr: new Date(Date.now() - 86400000).toLocaleDateString('vi-VN'),
                timeSlot: '20:00 - 21:00',
                googleMeetLink: 'https://meet.google.com/air-rise-taman',
                googleCalendarSynced: false,
                status: 'completed',
                userNotes: 'Khủng hoảng mối quan hệ và cảm giác cô đơn kéo dài.',
                doctorRecap: {
                  formattedRecap: `Chào Lê Hoàng Yến, cảm ơn bạn đã dành thời gian chia sẻ cùng Bác sĩ trong buổi tư vấn hôm qua:\n\n1. 🌟 Đánh giá & Lắng nghe:\n- Ghi nhận bạn đang trải qua cảm giác cô đơn và mất kết nối sau biến cố tình cảm.\n- Bạn đã có nhận thức rất tốt về ranh giới cá nhân và mong muốn chữa lành.\n\n2. 🛠️ Lời khuyên & Bài tập về nhà:\n- Thực hành bài tập viết thư xả cảm xúc không gửi (15 phút mỗi tối).\n- Thực hành thở 4-7-8 trước khi đi ngủ.\n\n3. 📅 Lời nhắn từ Chuyên gia:\n- Hãy kiên nhẫn và bao dung với chính mình. Hẹn gặp lại bạn ở buổi tiếp theo!`,
                  sentAt: new Date(Date.now() - 86400000).toLocaleDateString('vi-VN'),
                  isApproved: true,
                },
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

  // Handler to update mood map and persist to full history + Firestore
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

    // Sync to Firestore if user is authenticated
    if (user) {
      updated7Days.forEach((entry) => {
        saveMoodLog(user.uid, entry);
      });
    }
  };

  // Handler to update or append to the entire history + Firestore
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

  // Challenge streak check-in handler
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

  // Handlers
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
    // Xóa hoàn toàn lịch hẹn đã hủy khỏi bộ nhớ dữ liệu và giao diện
    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    // If preSessionAppointment is the cancelled one, close it
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Device Frame Simulator */}
      {!user ? (
        <DeviceFrame
          platform={platform}
          onPlatformChange={setPlatform}
          currentTab="home"
          onTabChange={() => {}}
          role="user"
          onRoleChange={() => {}}
          currentOrbTheme={currentOrbTheme}
          hideNav={true}
        >
          <AuthGateView onAuthSuccess={() => setCurrentTab('home')} />
        </DeviceFrame>
      ) : (
        <DeviceFrame
          platform={platform}
          onPlatformChange={setPlatform}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          role={role}
          onRoleChange={handleRoleChange}
          currentOrbTheme={currentOrbTheme}
          hideNav={false}
        >
          {/* VIEW 1: HOME DASHBOARD (FOR BOTH USER AND EXPERT) */}
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

          {/* VIEW 4: BOOKING / EXPERT DASHBOARD (IF ROLE IS EXPERT, LỊCH KHÁM RENDERS EXPERT DASHBOARD) */}
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

          {/* VIEW 5: PROFILE & BUSINESS SETTINGS */}
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
              onChangeOrbTheme={handleOrbThemeChange}
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
      )}

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

      {/* 6. Firebase Authentication Modal (Google / Email) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
