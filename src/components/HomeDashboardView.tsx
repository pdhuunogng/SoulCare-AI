import React, { useState, useEffect, useMemo } from 'react';
import {
  QuizResult,
  MoodEntry,
  UserChallengeProgress,
  Appointment,
  UserRole,
} from '../types';
import { INITIAL_CHALLENGES } from '../data/initialData';
import {
  Video,
  ShieldAlert,
  Plus,
  ChevronRight,
  BookOpen,
  Edit3,
  Save,
  Sparkles,
  Check,
  RotateCcw,
  MessageSquare,
  Smile,
  Calendar,
  Flame,
  Wind,
  Headphones,
  Stethoscope,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Trash2,
  CalendarDays,
  X,
  LogIn,
  UserCheck,
  Cloud,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { RadarChart } from './RadarChart';
import { audioSynth } from '../utils/audioSynth';
import confetti from 'canvas-confetti';
import { RibbonIcon } from './RibbonIcon';
import { OrbThemeColor, ORB_THEMES } from './CrystalGlassOrb';
import {
  EmotionIcon,
  ZenLeafIcon,
  MoodFaceTabIcon,
  AssessmentChartIcon,
  MindfulFlameIcon,
  SleepMoonIcon,
  StrengthIcon,
  SparkleStarIcon,
  HeartZenIcon,
} from './CustomIcons';
import { formatDateIso, formatDateDisplayVi, getVietnameseDayLabel } from '../utils/dateUtils';

interface HomeDashboardViewProps {
  role?: UserRole;
  userName: string;
  quizResult: QuizResult | null;
  moodMap: MoodEntry[];
  allMoodHistory?: MoodEntry[];
  onUpdateMoodMap: (newMoodMap: MoodEntry[]) => void;
  onUpdateAllMoodHistory?: (newHistory: MoodEntry[]) => void;
  challengeProgress: UserChallengeProgress | null;
  onUpdateChallengeProgress: (progress: UserChallengeProgress) => void;
  upcomingAppointments: Appointment[];
  onOpenQuiz: () => void;
  onOpenSOS: () => void;
  onOpenBreathing: () => void;
  onOpenHealingHub: () => void;
  onOpenBooking: () => void;
  onOpenPreSession: (apt: Appointment) => void;
  onNavigateToChat: () => void;
  onNavigateToProfile?: () => void;
  currentOrbTheme?: OrbThemeColor;
  onChangeOrbTheme?: (theme: OrbThemeColor) => void;
}

type HomeSubTab = 'overview' | 'mood' | 'assessment' | 'challenge';

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  role = 'user',
  userName,
  quizResult,
  moodMap,
  allMoodHistory = [],
  onUpdateMoodMap,
  onUpdateAllMoodHistory,
  challengeProgress,
  onUpdateChallengeProgress,
  upcomingAppointments,
  onOpenQuiz,
  onOpenSOS,
  onOpenBreathing,
  onOpenHealingHub,
  onOpenBooking,
  onOpenPreSession,
  onNavigateToChat,
  onNavigateToProfile,
  currentOrbTheme = 'mint',
  onChangeOrbTheme,
}) => {
  const { user, setIsAuthModalOpen } = useFirebase();

  // Dynamic 7-day calendar window ending today
  const effectiveMoodMap = useMemo(() => {
    const today = new Date();
    const mapByDate = new Map<string, MoodEntry>();
    (allMoodHistory.length > 0 ? allMoodHistory : moodMap).forEach((m) => {
      mapByDate.set(m.date, m);
    });

    const list: MoodEntry[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDateIso(d);
      const dayLabel = getVietnameseDayLabel(d);

      if (mapByDate.has(dateStr)) {
        list.push(mapByDate.get(dateStr)!);
      } else {
        list.push({
          date: dateStr,
          dayLabel: i === 0 ? 'Hôm nay' : dayLabel,
          emotion: 'Chưa ghi nhận',
          note: '',
          tags: [],
          timestamp: d.getTime(),
        });
      }
    }
    return list;
  }, [moodMap, allMoodHistory]);

  const [activeTab, setActiveTab] = useState<HomeSubTab>('overview');
  const [selectedDayDetail, setSelectedDayDetail] = useState<MoodEntry | null>(
    effectiveMoodMap[effectiveMoodMap.length - 1] || null
  );
  const [selectedMoodTag, setSelectedMoodTag] = useState<string>('#CôngViệc');
  const [journalInput, setJournalInput] = useState<string>(
    effectiveMoodMap[effectiveMoodMap.length - 1]?.note || ''
  );
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Synchronize selected day whenever effectiveMoodMap changes
  useEffect(() => {
    if (!selectedDayDetail) {
      setSelectedDayDetail(effectiveMoodMap[effectiveMoodMap.length - 1] || null);
    } else {
      const match = effectiveMoodMap.find((m) => m.date === selectedDayDetail.date);
      if (match) {
        setSelectedDayDetail(match);
      }
    }
  }, [effectiveMoodMap]);

  // Diary Archive & Search State (All history persistence)
  const [journalViewMode, setJournalViewMode] = useState<'recent7' | 'allArchive'>('recent7');
  const [journalSearchQuery, setJournalSearchQuery] = useState('');
  const [journalFilterTag, setJournalFilterTag] = useState('Tất cả');
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(formatDateIso(new Date()));
  const [newEntryEmotion, setNewEntryEmotion] = useState('Tươi vui');
  const [newEntryNote, setNewEntryNote] = useState('');
  const [newEntryTag, setNewEntryTag] = useState('#CôngViệc');

  // Real-time AI Weekly Mood Analysis State
  const [aiWeeklyRecap, setAiWeeklyRecap] = useState<{
    headline: string;
    summary: string;
    emotionalHighlights: string;
    microActions: string[];
    encouragement: string;
  } | null>(null);
  const [isAiWeeklyRecapLoading, setIsAiWeeklyRecapLoading] = useState(false);
  const [aiWeeklyRecapLastUpdated, setAiWeeklyRecapLastUpdated] = useState<string>('');

  // Real-time AI Assessment Summary State
  const [aiAssessmentRecap, setAiAssessmentRecap] = useState<{
    headline: string;
    overallSummary: string;
    microActions: string[];
    clinicalAdvice: string;
  } | null>(null);
  const [isAiAssessmentLoading, setIsAiAssessmentLoading] = useState(false);

  // Synchronize effective all history
  const effectiveAllHistory = allMoodHistory.length > 0 ? allMoodHistory : moodMap;

  // Real-time AI Weekly Recap Fetcher
  const fetchAiWeeklyRecap = async (force: boolean = false) => {
    if (isAiWeeklyRecapLoading) return;
    setIsAiWeeklyRecapLoading(true);

    try {
      const res = await fetch('/api/weekly-mood-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          moodList: moodMap,
          quizScores: quizResult
            ? {
                depressionPct: quizResult.depressionPct,
                anxietyPct: quizResult.anxietyPct,
                stressPct: quizResult.stressPct,
                sleepPct: quizResult.sleepPct,
              }
            : undefined,
          challengeProgress: challengeProgress
            ? {
                title: challengeProgress.challengeTitle,
                streak: challengeProgress.currentStreak,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (data.recap) {
        setAiWeeklyRecap(data.recap);
        setAiWeeklyRecapLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        if (force) audioSynth.playChime(528, 0.8);
      }
    } catch (err) {
      console.error('Failed to fetch real-time AI weekly recap:', err);
    } finally {
      setIsAiWeeklyRecapLoading(false);
    }
  };

  // Real-time AI Assessment Recap Fetcher
  const fetchAiAssessmentRecap = async () => {
    if (!quizResult || isAiAssessmentLoading) return;
    setIsAiAssessmentLoading(true);

    try {
      const res = await fetch('/api/assessment-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          quizResult,
          moodHistory: moodMap,
        }),
      });

      const data = await res.json();
      if (data.assessmentRecap) {
        setAiAssessmentRecap(data.assessmentRecap);
        audioSynth.playChime(587, 0.8);
      }
    } catch (err) {
      console.error('Failed to fetch real-time assessment recap:', err);
    } finally {
      setIsAiAssessmentLoading(false);
    }
  };

  // Auto-fetch real-time AI recap on initial load of mood tab
  useEffect(() => {
    if (activeTab === 'mood' && !aiWeeklyRecap && !isAiWeeklyRecapLoading) {
      fetchAiWeeklyRecap();
    }
    if (activeTab === 'assessment' && quizResult && !aiAssessmentRecap && !isAiAssessmentLoading) {
      fetchAiAssessmentRecap();
    }
  }, [activeTab, quizResult]);

  const emotionEmojis: Record<
    string,
    { emoji: string; label: string; desc: string; color: string; bg: string; pastelBg: string }
  > = {
    'Tươi vui': { emoji: '😊', label: 'Tươi vui', desc: 'Tràn đầy năng lượng, tích cực', color: 'text-amber-600', bg: 'bg-amber-100 border-amber-300', pastelBg: 'bg-amber-50 text-amber-900' },
    'Ổn định': { emoji: '😌', label: 'Ổn định', desc: 'Bình yên, tâm trí cân bằng', color: 'text-emerald-600', bg: 'bg-emerald-100 border-emerald-300', pastelBg: 'bg-emerald-50 text-emerald-900' },
    'Mệt mỏi': { emoji: '😫', label: 'Mệt mỏi', desc: 'Kiệt sức, cần nghỉ ngơi phục hồi', color: 'text-blue-600', bg: 'bg-blue-100 border-blue-300', pastelBg: 'bg-blue-50 text-blue-900' },
    'Căng thẳng': { emoji: '😰', label: 'Căng thẳng', desc: 'Áp lực cao, đầu óc căng cứng', color: 'text-purple-600', bg: 'bg-purple-100 border-purple-300', pastelBg: 'bg-purple-50 text-purple-900' },
    'Bối rối': { emoji: '🥺', label: 'Bối rối', desc: 'Chưa rõ hướng đi, hoang mang', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300', pastelBg: 'bg-slate-50 text-slate-900' },
    'Hạnh phúc': { emoji: '🥰', label: 'Hạnh phúc', desc: 'Rạng rỡ, phấn khởi hân hoan', color: 'text-pink-600', bg: 'bg-pink-100 border-pink-300', pastelBg: 'bg-pink-50 text-pink-900' },
    'Biết ơn': { emoji: '🤗', label: 'Biết ơn', desc: 'Ấm lòng, trân trọng cuộc sống', color: 'text-rose-600', bg: 'bg-rose-100 border-rose-300', pastelBg: 'bg-rose-50 text-rose-900' },
    'Mất ngủ': { emoji: '🥱', label: 'Mất ngủ', desc: 'Chập chờn, thiếu giấc ngủ sâu', color: 'text-indigo-600', bg: 'bg-indigo-100 border-indigo-300', pastelBg: 'bg-indigo-50 text-indigo-900' },
  };

  const getEmojiInfo = (emotion: string) => {
    return (
      emotionEmojis[emotion] || {
        emoji: '🙂',
        label: emotion,
        desc: 'Đang lắng nghe cảm xúc',
        color: 'text-emerald-600',
        bg: 'bg-emerald-100 border-emerald-300',
        pastelBg: 'bg-emerald-50 text-emerald-900',
      }
    );
  };

  const currentThemeConfig = ORB_THEMES[currentOrbTheme] || ORB_THEMES.mint;

  const handleSelectEmotionForDay = (emotion: string) => {
    audioSynth.playChime(528, 0.8);
    const targetDate = selectedDayDetail?.date || effectiveMoodMap[effectiveMoodMap.length - 1]?.date || formatDateIso(new Date());
    const dateObj = new Date(targetDate);
    const dayLabel = selectedDayDetail?.dayLabel || getVietnameseDayLabel(dateObj);

    const updatedEntry: MoodEntry = {
      ...(selectedDayDetail || {}),
      date: targetDate,
      dayLabel,
      emotion,
      note: selectedDayDetail?.note || '',
      tags: selectedDayDetail?.tags || [selectedMoodTag],
      timestamp: dateObj.getTime(),
    };

    // Update 7-day mood map
    const existingInMap = moodMap.some((m) => m.date === targetDate);
    let updatedMap: MoodEntry[];
    if (existingInMap) {
      updatedMap = moodMap.map((m) => (m.date === targetDate ? updatedEntry : m));
    } else {
      updatedMap = [...moodMap, updatedEntry];
    }
    onUpdateMoodMap(updatedMap);

    // Update full mood history
    if (onUpdateAllMoodHistory) {
      const existingInAll = effectiveAllHistory.some((m) => m.date === targetDate);
      let updatedAll: MoodEntry[];
      if (existingInAll) {
        updatedAll = effectiveAllHistory.map((m) => (m.date === targetDate ? updatedEntry : m));
      } else {
        updatedAll = [...effectiveAllHistory, updatedEntry];
      }
      onUpdateAllMoodHistory(updatedAll);
    }

    setSelectedDayDetail(updatedEntry);

    if (onChangeOrbTheme) {
      if (emotion === 'Tươi vui' || emotion === 'Hạnh phúc') onChangeOrbTheme('amber');
      else if (emotion === 'Căng thẳng' || emotion === 'Mệt mỏi') onChangeOrbTheme('lavender');
      else if (emotion === 'Biết ơn') onChangeOrbTheme('rose');
      else if (emotion === 'Mất ngủ') onChangeOrbTheme('ocean');
      else onChangeOrbTheme('mint');
    }
  };

  const handleSaveJournalNote = () => {
    const targetDate = selectedDayDetail?.date || effectiveMoodMap[effectiveMoodMap.length - 1]?.date || formatDateIso(new Date());
    audioSynth.playChime(660, 0.4);

    const trimmedNote = journalInput.trim();
    const dateObj = new Date(targetDate);
    const dayLabel = selectedDayDetail?.dayLabel || getVietnameseDayLabel(dateObj);
    const emotion = selectedDayDetail?.emotion || 'Tươi vui';

    const updatedEntry: MoodEntry = {
      ...(selectedDayDetail || {}),
      date: targetDate,
      dayLabel,
      emotion,
      note: trimmedNote,
      tags: Array.from(new Set([...(selectedDayDetail?.tags || []), selectedMoodTag])),
      timestamp: dateObj.getTime(),
    };

    const existingInMap = moodMap.some((m) => m.date === targetDate);
    let updatedMap: MoodEntry[];
    if (existingInMap) {
      updatedMap = moodMap.map((m) => (m.date === targetDate ? updatedEntry : m));
    } else {
      updatedMap = [...moodMap, updatedEntry];
    }
    onUpdateMoodMap(updatedMap);

    if (onUpdateAllMoodHistory) {
      const existingInAll = effectiveAllHistory.some((m) => m.date === targetDate);
      let updatedAll: MoodEntry[];
      if (existingInAll) {
        updatedAll = effectiveAllHistory.map((m) => (m.date === targetDate ? updatedEntry : m));
      } else {
        updatedAll = [...effectiveAllHistory, updatedEntry];
      }
      onUpdateAllMoodHistory(updatedAll);
    }

    setSelectedDayDetail(updatedEntry);

    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleAddNewCustomJournalEntry = () => {
    if (!newEntryNote.trim()) return;
    audioSynth.playChime(660, 0.5);

    const dateObj = new Date(newEntryDate);
    const dayLabel = getVietnameseDayLabel(dateObj);

    const entryToSave: MoodEntry = {
      date: newEntryDate,
      dayLabel,
      emotion: newEntryEmotion,
      note: newEntryNote.trim(),
      tags: [newEntryTag],
      timestamp: dateObj.getTime(),
    };

    if (onUpdateAllMoodHistory) {
      const existingIdx = effectiveAllHistory.findIndex((e) => e.date === newEntryDate);
      let newAll: MoodEntry[];
      if (existingIdx >= 0) {
        newAll = effectiveAllHistory.map((e) => (e.date === newEntryDate ? entryToSave : e));
      } else {
        newAll = [...effectiveAllHistory, entryToSave];
      }
      onUpdateAllMoodHistory(newAll);
    }

    // Check if the new entry belongs in the active 7-day moodMap
    const isInMoodMap = moodMap.some((m) => m.date === newEntryDate);
    if (isInMoodMap) {
      const newMoodMap = moodMap.map((m) => (m.date === newEntryDate ? entryToSave : m));
      onUpdateMoodMap(newMoodMap);
    }

    setSelectedDayDetail(entryToSave);
    setJournalInput(entryToSave.note || '');
    setIsNewEntryModalOpen(false);
    setNewEntryNote('');
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleSelectDay = (day: MoodEntry) => {
    audioSynth.playChime(480, 0.2);
    setSelectedDayDetail(day);
    setJournalInput(day.note || '');
  };

  const handleCheckInStreak = () => {
    if (challengeProgress?.todayCompleted) return;
    audioSynth.playChime(587, 1);

    if (!challengeProgress) {
      const defaultCh = INITIAL_CHALLENGES[0];
      const initial: UserChallengeProgress = {
        challengeId: defaultCh.id,
        challengeTitle: defaultCh.title,
        currentStreak: 1,
        totalDays: defaultCh.durationDays,
        daysCompletedCount: 1,
        todayCompleted: true,
        lastCheckInDate: formatDateIso(new Date()),
      };
      onUpdateChallengeProgress(initial);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
      return;
    }

    const updated: UserChallengeProgress = {
      ...challengeProgress,
      currentStreak: challengeProgress.currentStreak + 1,
      daysCompletedCount: Math.min(challengeProgress.daysCompletedCount + 1, challengeProgress.totalDays),
      todayCompleted: true,
      lastCheckInDate: formatDateIso(new Date()),
    };

    onUpdateChallengeProgress(updated);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleSelectChallenge = (ch: (typeof INITIAL_CHALLENGES)[0]) => {
    audioSynth.playChime(600, 0.4);
    const updated: UserChallengeProgress = {
      challengeId: ch.id,
      challengeTitle: ch.title,
      currentStreak: 1,
      totalDays: ch.durationDays,
      daysCompletedCount: 1,
      todayCompleted: false,
      lastCheckInDate: formatDateIso(new Date()),
    };
    onUpdateChallengeProgress(updated);
  };

  const nextAppointment = upcomingAppointments.find((a) => a.status === 'upcoming');
  const streakCount = challengeProgress ? challengeProgress.currentStreak : 0;
  const totalDays = challengeProgress ? challengeProgress.totalDays : 21;
  const completedCount = challengeProgress ? challengeProgress.daysCompletedCount : 0;

  // 100% Synchronized Weekly Emotional Counts directly from effectiveMoodMap
  const trackedMoodEntries = effectiveMoodMap.filter((m) => m.emotion !== 'Chưa ghi nhận');
  const positiveDays = trackedMoodEntries.filter((m) => m.emotion === 'Tươi vui' || m.emotion === 'Hạnh phúc').length;
  const balancedDays = trackedMoodEntries.filter((m) => m.emotion === 'Ổn định' || m.emotion === 'Biết ơn').length;
  const tensionDays = trackedMoodEntries.filter(
    (m) => m.emotion === 'Căng thẳng' || m.emotion === 'Mệt mỏi' || m.emotion === 'Bối rối' || m.emotion === 'Mất ngủ'
  ).length;
  const totalTracked = trackedMoodEntries.length;

  const positivePct = totalTracked > 0 ? Math.round((positiveDays / totalTracked) * 100) : 0;
  const balancedPct = totalTracked > 0 ? Math.round((balancedDays / totalTracked) * 100) : 0;
  const tensionPct = totalTracked > 0 ? Math.max(0, 100 - positivePct - balancedPct) : 0;

  // Active challenge and remaining challenges
  const activeChallengeObj = INITIAL_CHALLENGES.find((ch) => ch.id === challengeProgress?.challengeId) || INITIAL_CHALLENGES[0];
  const otherChallenges = INITIAL_CHALLENGES.filter((ch) => ch.id !== challengeProgress?.challengeId);

  // Diary items for display
  const rawDisplayEntries =
    journalViewMode === 'recent7'
      ? effectiveMoodMap.filter((m) => m.emotion !== 'Chưa ghi nhận' || (m.note && m.note.trim().length > 0))
      : [...effectiveAllHistory].reverse();
  const filteredJournalEntries = rawDisplayEntries.filter((entry) => {
    const matchesSearch =
      !journalSearchQuery ||
      entry.note?.toLowerCase().includes(journalSearchQuery.toLowerCase()) ||
      entry.emotion.toLowerCase().includes(journalSearchQuery.toLowerCase()) ||
      entry.date.includes(journalSearchQuery) ||
      entry.tags?.some((t) => t.toLowerCase().includes(journalSearchQuery.toLowerCase()));

    const matchesTag =
      journalFilterTag === 'Tất cả' || entry.tags?.includes(journalFilterTag);

    return matchesSearch && matchesTag;
  });

  const todayIso = formatDateIso(new Date());

  return (
    <div className="p-4 space-y-4 pb-24 text-[#181d16] font-sans animate-in fade-in bg-[#f6fbf0]">
      {/* Greeting Title */}
      <div className="space-y-0.5 pt-1">
        <h2 className="text-xl font-bold text-[#181d16] tracking-tight">
          {role === 'expert' ? (
            <>
              Chào {userName && userName !== 'Người dùng SoulCare' && !userName.includes('Bác sĩ') ? userName : 'Chuyên gia'}, <span className="text-[#006e22] font-bold">hôm nay bạn cảm thấy thế nào?</span>
            </>
          ) : (
            <>
              Chào {userName && userName !== 'Người dùng SoulCare' ? userName : 'bạn'}, <span className="text-[#006e22] font-bold">hôm nay bạn cảm thấy thế nào?</span>
            </>
          )}
        </h2>
        <p className="text-xs text-[#4a6551] font-normal">
          {role === 'expert'
            ? 'Hãy dành một vài phút thư giãn tâm trí sau những giờ đồng hành cùng khách hàng.'
            : 'Hãy dành một vài phút lắng nghe tâm trạng của mình nhé.'}
        </p>
      </div>

      {/* Subtab Switcher */}
      <div className="p-1 rounded-2xl bg-[#eaf0e5] border border-[#dfe4d9] grid grid-cols-4 gap-1 select-none shadow-inner">
        {[
          { id: 'overview', label: 'Tổng quan', Icon: ZenLeafIcon },
          { id: 'mood', label: 'Cảm xúc', Icon: MoodFaceTabIcon },
          { id: 'assessment', label: 'Tầm soát', Icon: AssessmentChartIcon },
          { id: 'challenge', label: 'Thử thách', Icon: MindfulFlameIcon },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audioSynth.playChime(500, 0.2);
                setActiveTab(tab.id as HomeSubTab);
              }}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-center ${
                isActive
                  ? 'bg-[#ffffff] text-[#006e22] font-bold shadow-sm ring-1 ring-[#67c76c]/30 scale-[1.02]'
                  : 'text-[#4a6551] hover:text-[#181d16] font-medium'
              }`}
            >
              <TabIcon size={18} className={isActive ? 'text-[#006e22]' : 'text-[#4a6551]'} />
              <span className="text-[11px] leading-tight truncate w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT SECTIONS */}

      {/* TAB 1: TỔNG QUAN (OVERVIEW - EXACT STITCH SCREENSHOT DESIGN) */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* BANNER 21 NGÀY RÈN LUYỆN (EXACT GREEN-TO-MINT GRADIENT WITH ROUNDED SHAPE) */}
          <div className="p-5 rounded-[28px] bg-gradient-to-r from-[#59be68] via-[#65cca8] to-[#80e5d8] text-white space-y-4 shadow-lg shadow-[#67c76c]/20 relative overflow-hidden">
            {/* Subtle background energy wave */}
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/15 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between z-10 relative">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <ZenLeafIcon size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide">
                    {totalDays} Ngày
                  </h3>
                  <p className="text-xs font-semibold text-white/90">Rèn luyện thói quen</p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 flex items-center gap-1.5 shadow-sm">
                <span>Ngày {completedCount}/{totalDays}</span>
                <MindfulFlameIcon size={14} className="text-amber-200" />
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 z-10 relative">
              <div className="w-full h-2.5 rounded-full bg-black/15 overflow-hidden border border-white/25">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${(completedCount / totalDays) * 100}%` }}
                />
              </div>
            </div>

            {/* Bottom Action: White Pill Check-In Button */}
            <div className="flex items-center justify-between pt-1 z-10 relative">
              <button
                type="button"
                onClick={handleCheckInStreak}
                disabled={challengeProgress?.todayCompleted}
                className={`py-2 px-5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 ${
                  challengeProgress?.todayCompleted
                    ? 'bg-white/40 text-white cursor-not-allowed border border-white/30'
                    : 'bg-white hover:bg-slate-50 text-[#005116] font-extrabold shadow-emerald-900/10'
                }`}
              >
                {challengeProgress?.todayCompleted ? (
                  <>
                    <Check className="w-4 h-4 text-[#006e22] stroke-[3]" />
                    <span>Đã Điểm Danh</span>
                  </>
                ) : !challengeProgress || completedCount === 0 ? (
                  <>
                    <Sparkles className="w-4 h-4 text-[#006e22]" />
                    <span>Bắt đầu thử thách ngay</span>
                  </>
                ) : (
                  <>
                    <span>Điểm danh ngay</span>
                    <Check className="w-4 h-4 text-[#006e22] stroke-[3]" />
                  </>
                )}
              </button>

              <span className="text-[11px] text-white/90 font-medium italic">
                {streakCount > 0 ? `${streakCount} ngày liên tiếp` : 'Chưa có chuỗi liên tiếp'}
              </span>
            </div>
          </div>

          {/* BẢN ĐỒ CẢM XÚC (7-DAY MOOD TRACKER - REALTIME SYNCHRONIZED) */}
          <div className="p-4 rounded-[28px] bg-[#ffffff] border border-[#dfe4d9] space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#181d16]">Bản đồ cảm xúc</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] font-semibold border border-[#67c76c]/30">
                  7 Ngày Gần Nhất
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('mood')}
                className="text-xs text-[#006e22] font-semibold flex items-center gap-0.5 hover:underline"
              >
                Chi tiết &gt;
              </button>
            </div>

            {/* Weekday Row: Real-time 7 days ending today with custom vector faces */}
            <div className="grid grid-cols-7 gap-1">
              {moodMap.map((entry, idx) => {
                const isToday = entry.date === todayIso || idx === moodMap.length - 1;

                return (
                  <div key={entry.date} className="flex flex-col items-center gap-1.5">
                    <span className={`text-[11px] font-bold ${isToday ? 'text-[#006e22]' : 'text-[#6f7a6c]'}`}>
                      {entry.dayLabel}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayDetail(entry);
                        setActiveTab('mood');
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition transform hover:scale-110 active:scale-95 border relative ${
                        isToday
                          ? 'border-2 border-[#006e22] bg-[#e0f5ea] text-[#006e22] ring-2 ring-[#67c76c]/30 shadow-md'
                          : 'bg-[#ffffff] border-[#dfe4d9] text-[#181d16] hover:bg-[#f7faf8]'
                      }`}
                      title={`${entry.dayLabel} (${entry.date}): ${entry.emotion}`}
                    >
                      <EmotionIcon emotion={entry.emotion} size={22} />
                      {isToday && (
                        <span className="absolute -top-1 px-1 py-0.1 bg-[#006e22] text-white text-[7px] font-extrabold rounded-full">
                          NAY
                        </span>
                      )}
                    </button>
                    <span className="text-[9px] text-[#6f7a6c] font-mono truncate max-w-[40px]">
                      {entry.date.split('-').slice(1).reverse().join('/')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHÔNG GIAN CHỮA LÀNH (QUICK HEALING HUB TILES) */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-bold text-[#181d16] flex items-center gap-1.5">
              Không gian chữa lành
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onOpenBreathing}
                className="p-4 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] hover:border-[#67c76c] text-left transition group shadow-sm flex flex-col justify-between h-28"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center">
                    <Wind className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] font-bold">
                    3 Phút
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#006e22] transition">
                    Tập thở 4-7-8
                  </h4>
                  <p className="text-[11px] text-[#6f7a6c]">Thả lỏng thần kinh</p>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenHealingHub}
                className="p-4 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] hover:border-[#67c76c] text-left transition group shadow-sm flex flex-col justify-between h-28"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#b9ece9] text-[#366664] flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#b9ece9] text-[#366664] font-bold">
                    432Hz
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#366664] transition">
                    Trị liệu Âm thanh
                  </h4>
                  <p className="text-[11px] text-[#6f7a6c]">Sóng não & Podcast</p>
                </div>
              </button>
            </div>
          </div>

          {/* Upcoming Appointment Card or Consultation Booking Card */}
          {nextAppointment ? (
            <div className="p-4 rounded-2xl bg-[#ffffff] border border-[#67c76c]/40 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs text-[#006e22] font-bold">
                  <Video className="w-4 h-4" />
                  {role === 'expert' ? 'Ca tư vấn sắp tới' : 'Lịch tư vấn 1-1'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] font-semibold">
                  Google Meet
                </span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={nextAppointment.expertAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
                  alt="Avatar"
                  className="w-11 h-11 rounded-2xl object-cover ring-1 ring-[#67c76c]/30"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#181d16] truncate">
                    {role === 'expert' ? (nextAppointment.userName || 'Khách hàng') : nextAppointment.expertName}
                  </h4>
                  <p className="text-[11px] text-[#6f7a6c]">
                    📅 {nextAppointment.dateStr} | ⏰ {nextAppointment.timeSlot}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPreSession(nextAppointment)}
                  className="px-3 py-1.5 rounded-xl bg-[#006e22] hover:bg-[#005116] text-white text-xs font-bold transition shadow-sm"
                >
                  Chuẩn bị
                </button>
              </div>
            </div>
          ) : role === 'expert' ? null : (
            <div className="p-4 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16]">Tham vấn Chuyên gia 0đ</h4>
                  <p className="text-[11px] text-[#6f7a6c]">Buổi đầu miễn phí cùng Chuyên gia CBT</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenBooking}
                className="px-3.5 py-1.5 rounded-full bg-[#006e22] hover:bg-[#005116] text-white text-xs font-bold shadow-sm transition"
              >
                Đặt ngay
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BẢN ĐỒ CẢM XÚC & NHẬT KÝ LƯU TRỮ (REAL-TIME AI & ARCHIVE) */}
      {activeTab === 'mood' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Main 7-Day Visual Mood Strip Card */}
          <div className="p-4 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center">
                  <MoodFaceTabIcon size={20} className="text-[#006e22]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#181d16] uppercase tracking-wider">
                    Biểu Đồ Cảm Xúc 7 Ngày
                  </h3>
                  <p className="text-[11px] text-[#6f7a6c]">
                    Thời gian thực tế đồng bộ đến hôm nay
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] font-bold border border-[#67c76c]/30">
                Tuần này
              </span>
            </div>

            {/* 7 Interactive Emoji Day Cards (Real-time Dates) */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {moodMap.map((entry, idx) => {
                const isSelected = selectedDayDetail?.date === entry.date;
                const isToday = entry.date === todayIso || idx === moodMap.length - 1;

                return (
                  <button
                    key={`mood-day-${entry.date}`}
                    type="button"
                    onClick={() => handleSelectDay(entry)}
                    className={`p-2 rounded-2xl flex flex-col items-center justify-between text-center transition-all relative ${
                      isSelected
                        ? 'bg-[#e0f5ea] border-2 border-[#006e22] ring-2 ring-[#67c76c]/30 scale-105 shadow-sm text-[#006e22]'
                        : isToday
                        ? 'bg-[#f0f5ea] border border-[#67c76c]/50 hover:bg-[#e0f5ea] text-[#181d16]'
                        : 'bg-[#f7faf8] border border-[#dfe4d9] hover:bg-[#eaf0e5] text-[#3f4a3d]'
                    }`}
                  >
                    {isToday && (
                      <span className="absolute -top-1.5 px-1.5 py-0.2 bg-[#006e22] text-white text-[7px] font-extrabold rounded-full">
                        HÔM NAY
                      </span>
                    )}
                    <span className="text-[10px] text-[#6f7a6c] font-bold mt-0.5">{entry.dayLabel}</span>
                    <div className="my-1 transform hover:scale-110 transition-transform">
                      <EmotionIcon
                        emotion={entry.emotion}
                        size={28}
                        className={isSelected ? 'text-[#006e22]' : ''}
                      />
                    </div>
                    <span className="text-[8px] text-[#3f4a3d] font-semibold truncate max-w-[38px]">
                      {entry.emotion}
                    </span>
                    <span className="text-[7px] text-[#6f7a6c] font-mono mt-0.5">
                      {entry.date.split('-').slice(1).reverse().join('/')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Day Selector & Emoji Chooser */}
            {selectedDayDetail && (
              <div className="p-3.5 bg-[#f7faf8] rounded-2xl border border-[#dfe4d9] space-y-3">
                <div className="flex items-center justify-between border-b border-[#dfe4d9] pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-white border border-[#dfe4d9] shadow-sm">
                      <EmotionIcon
                        emotion={selectedDayDetail.emotion}
                        size={32}
                        className="text-[#006e22]"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#181d16] flex items-center gap-1.5">
                        <span>{selectedDayDetail.dayLabel} ({formatDateDisplayVi(new Date(selectedDayDetail.date))})</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#e0f5ea] text-[#006e22] font-semibold border border-[#67c76c]/30">
                          {selectedDayDetail.emotion}
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#6f7a6c]">
                        {getEmojiInfo(selectedDayDetail.emotion).desc}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] text-[#6f7a6c] italic">
                    Chạm biểu tượng để đổi
                  </span>
                </div>

                {/* 8 Single Choice Face Emojis with Custom Vector Faces */}
                <div className="space-y-1.5">
                  <span className="text-xs text-[#3f4a3d] font-semibold flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5 text-[#006e22]" />
                    Chọn hoặc thay đổi cảm xúc cho ngày này:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(emotionEmojis).map(([key, item]) => {
                      const isChosen = selectedDayDetail.emotion === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectEmotionForDay(key)}
                          className={`p-2.5 rounded-xl flex flex-col items-center gap-1 transition-all text-center border relative ${
                            isChosen
                              ? 'bg-[#e0f5ea] border-[#006e22] ring-1 ring-[#006e22]/40 shadow-sm scale-[1.03] text-[#006e22]'
                              : 'bg-[#ffffff] border-[#dfe4d9] hover:bg-[#f0f5ea] text-[#3f4a3d]'
                          }`}
                        >
                          {isChosen && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#006e22] text-white rounded-full flex items-center justify-center text-[8px] font-black">
                              ✓
                            </span>
                          )}
                          <div className="transform hover:scale-110 transition-transform">
                            <EmotionIcon
                              emotion={key}
                              size={28}
                              className={isChosen ? 'text-[#006e22]' : item.color}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${isChosen ? 'text-[#006e22]' : 'text-[#3f4a3d]'}`}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tag Selection */}
                <div className="flex items-center gap-1 overflow-x-auto pt-1 no-scrollbar">
                  <span className="text-[10px] text-[#6f7a6c] font-semibold shrink-0">Chủ đề:</span>
                  {['#CôngViệc', '#GiaĐình', '#TìnhCảm', '#GiấcNgủ', '#SứcKhỏe', '#BiếtƠn', '#TậpThở'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedMoodTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition shrink-0 ${
                        selectedMoodTag === tag
                          ? 'bg-[#006e22] text-white shadow-sm'
                          : 'bg-[#ffffff] text-[#4a6551] border border-[#dfe4d9] hover:text-[#181d16]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MỤC GHI CHÚ / RECAP / NHẬT KÝ CẢM XÚC */}
          {selectedDayDetail && (
            <div className="p-4 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#181d16] flex items-center gap-1.5">
                      <span>Nhật Ký & Ghi Chú Cảm Xúc</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#eaf0e5] text-[#006e22] font-mono">
                        {selectedDayDetail.dayLabel} • {formatDateDisplayVi(new Date(selectedDayDetail.date))}
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#6f7a6c]">
                      Lưu trữ vĩnh viễn không bị xóa từ ngày bắt đầu
                    </p>
                  </div>
                </div>

                {isSavedNotice && (
                  <span className="text-[11px] text-[#006e22] font-bold flex items-center gap-1 bg-[#e0f5ea] px-2.5 py-1 rounded-lg animate-in fade-in border border-[#67c76c]/30">
                    <Check className="w-3.5 h-3.5" /> Đã lưu vĩnh viễn
                  </span>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="space-y-1">
                <span className="text-[10px] text-[#6f7a6c] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Gợi ý tự vấn nhanh (Chạm để chèn):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { text: 'Điều gì khiến bạn cảm thấy như vậy?', promptText: 'Hôm nay điều gì khiến bạn cảm thấy như vậy?: ', icon: <SparkleStarIcon size={14} className="text-amber-500 shrink-0" /> },
                    { text: 'Một khoảnh khắc biết ơn hôm nay:', promptText: 'Một khoảnh khắc biết ơn hôm nay: ', icon: <ZenLeafIcon size={14} className="text-[#006e22] shrink-0" /> },
                    { text: 'Chất lượng giấc ngủ & sự thư giãn:', promptText: 'Chất lượng giấc ngủ & sự thư giãn: ', icon: <SleepMoonIcon size={14} className="text-indigo-500 shrink-0" /> },
                    { text: 'Tôi tự hào vì hôm nay đã:', promptText: 'Tôi tự hào vì hôm nay đã: ', icon: <StrengthIcon size={14} className="text-amber-600 shrink-0" /> },
                  ].map((item, idx) => (
                    <button
                      key={`prompt-${idx}`}
                      type="button"
                      onClick={() => {
                        setJournalInput((prev) => (prev ? `${prev}\n• ${item.promptText}` : `• ${item.promptText}`));
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[11px] text-[#4a6551] hover:text-[#006e22] hover:border-[#67c76c] hover:bg-[#e0f5ea] transition flex items-center gap-1.5 text-left active:scale-95"
                    >
                      {item.icon}
                      <span>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea for Daily Journal/Recap */}
              <div className="relative">
                <textarea
                  rows={3}
                  value={journalInput}
                  onChange={(e) => setJournalInput(e.target.value)}
                  placeholder={`Viết nhật ký, recap tóm tắt ngày ${selectedDayDetail.dayLabel} (${selectedDayDetail.date}), những việc đã trải qua hoặc điều bạn muốn giải tỏa...`}
                  className="w-full p-3 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] text-xs placeholder:text-[#6f7a6c]/60 focus:outline-none focus:ring-2 focus:ring-[#006e22] focus:border-transparent resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#6f7a6c]">
                  {journalInput.length} ký tự • Thẻ: <strong className="text-[#006e22]">{selectedMoodTag}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {journalInput && (
                    <button
                      type="button"
                      onClick={() => setJournalInput('')}
                      className="px-3 py-1.5 rounded-xl bg-[#f7faf8] hover:bg-[#eaf0e5] text-[#4a6551] text-xs font-semibold transition border border-[#dfe4d9]"
                    >
                      Xóa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveJournalNote}
                    className="px-4 py-1.5 rounded-full bg-[#006e22] hover:bg-[#005116] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Nhật Ký</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COMPLETE DIARY ARCHIVE & TIMELINE (PERMANENT STORAGE - KHÔNG XÓA NHẬT KÝ CŨ) */}
          <div className="p-4 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#006e22]" />
                <h4 className="text-xs font-bold text-[#181d16]">
                  Lưu Trữ Nhật Ký & Ghi Chú ({effectiveAllHistory.length} Bản Ghi)
                </h4>
              </div>

              {/* Mode Toggle and Add Entry Button */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-[#f0f4ee] p-0.5 border border-[#dfe4d9] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setJournalViewMode('recent7')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      journalViewMode === 'recent7'
                        ? 'bg-[#ffffff] text-[#006e22] shadow-2xs'
                        : 'text-[#6f7a6c] hover:text-[#181d16]'
                    }`}
                  >
                    7 Ngày Gần Nhất
                  </button>
                  <button
                    type="button"
                    onClick={() => setJournalViewMode('allArchive')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      journalViewMode === 'allArchive'
                        ? 'bg-[#ffffff] text-[#006e22] shadow-2xs'
                        : 'text-[#6f7a6c] hover:text-[#181d16]'
                    }`}
                  >
                    Toàn Bộ Nhật Ký
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewEntryModalOpen(true)}
                  className="px-3 py-1 rounded-xl bg-[#006e22] hover:bg-[#005116] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition"
                  title="Thêm nhật ký ngày mới"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Viết Mới</span>
                </button>
              </div>
            </div>

            {/* Search & Tag Filter Bar (Active in All Archive Mode) */}
            <div className="space-y-2 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7a6c]" />
                <input
                  type="text"
                  value={journalSearchQuery}
                  onChange={(e) => setJournalSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo nội dung, cảm xúc, ngày (VD: 2026, Căng thẳng, #CôngViệc)..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder:text-[#6f7a6c]/60 focus:outline-none focus:ring-2 focus:ring-[#006e22]"
                />
                {journalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setJournalSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6f7a6c] hover:text-[#181d16]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tag Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[10px] text-[#6f7a6c] font-semibold shrink-0">Lọc thẻ:</span>
                {['Tất cả', '#CôngViệc', '#GiaĐình', '#TìnhCảm', '#GiấcNgủ', '#SứcKhỏe', '#BiếtƠn', '#TậpThở'].map((tag) => (
                  <button
                    key={`archive-tag-${tag}`}
                    type="button"
                    onClick={() => setJournalFilterTag(tag)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition shrink-0 ${
                      journalFilterTag === tag
                        ? 'bg-[#006e22] text-white shadow-2xs'
                        : 'bg-[#f7faf8] text-[#4a6551] border border-[#dfe4d9] hover:bg-[#e0f5ea]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Entries */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredJournalEntries.length > 0 ? (
                filteredJournalEntries.map((entry, idx) => {
                  const isSelected = selectedDayDetail?.date === entry.date;
                  return (
                    <button
                      key={`hist-entry-${entry.date}-${idx}`}
                      type="button"
                      onClick={() => handleSelectDay(entry)}
                      className={`w-full p-3 rounded-xl text-left transition border flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#e0f5ea] border-[#006e22] ring-1 ring-[#006e22]/20'
                          : 'bg-[#f7faf8] border-[#dfe4d9] hover:bg-[#f0f5ea]'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <EmotionIcon emotion={entry.emotion} size={28} className={isSelected ? 'text-[#006e22]' : ''} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[#181d16]">{entry.dayLabel}</span>
                            <span className="text-[10px] text-[#6f7a6c] font-mono">
                              ({formatDateDisplayVi(new Date(entry.date))})
                            </span>
                            <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#eaf0e5] text-[#006e22] font-semibold">
                              {entry.emotion}
                            </span>
                            {entry.tags?.map((t) => (
                              <span key={t} className="text-[8px] px-1.5 py-0.2 rounded bg-white text-[#4a6551] border border-[#dfe4d9]">
                                {t}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-[#006e22] font-medium shrink-0 ml-2">Mở & Sửa</span>
                        </div>
                        <p className="text-xs text-[#3f4a3d] mt-1.5 italic line-clamp-2 leading-relaxed">
                          {entry.note ? `"${entry.note}"` : <span className="text-[#6f7a6c]">Chưa có ghi chú nội dung...</span>}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-[#6f7a6c]">
                  Không tìm thấy nhật ký phù hợp với bộ lọc.
                </div>
              )}
            </div>
          </div>

          {/* MODAL: THÊM NHẬT KÝ CHO NGÀY BẤT KỲ */}
          {isNewEntryModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-[#ffffff] border border-[#dfe4d9] rounded-3xl p-5 w-full max-w-md space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#dfe4d9] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#181d16]">Thêm Nhật Ký Ngày Mới</h3>
                      <p className="text-[11px] text-[#6f7a6c]">Lưu trữ vào toàn bộ lịch sử sử dụng</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewEntryModalOpen(false)}
                    className="p-1 rounded-full text-[#6f7a6c] hover:bg-[#f7faf8]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Date Picker */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#181d16]">Chọn ngày ghi nhật ký:</label>
                  <input
                    type="date"
                    value={newEntryDate}
                    onChange={(e) => setNewEntryDate(e.target.value)}
                    max={todayIso}
                    className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] focus:outline-none focus:ring-2 focus:ring-[#006e22]"
                  />
                </div>

                {/* Emotion Chooser */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#181d16]">Cảm xúc của bạn trong ngày đó:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(emotionEmojis).map(([key, item]) => {
                      const isChosen = newEntryEmotion === key;
                      return (
                        <button
                          key={`new-modal-${key}`}
                          type="button"
                          onClick={() => setNewEntryEmotion(key)}
                          className={`p-2 rounded-xl flex flex-col items-center gap-0.5 border text-center transition ${
                            isChosen
                              ? 'bg-[#e0f5ea] border-[#006e22] text-[#006e22] ring-1 ring-[#006e22]/30 font-bold'
                              : 'bg-[#ffffff] border-[#dfe4d9] text-[#3f4a3d] hover:bg-[#f7faf8]'
                          }`}
                        >
                          <EmotionIcon emotion={key} size={22} className={isChosen ? 'text-[#006e22]' : item.color} />
                          <span className="text-[9px]">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tag */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#181d16]">Chủ đề / Thẻ:</label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {['#CôngViệc', '#GiaĐình', '#TìnhCảm', '#GiấcNgủ', '#SứcKhỏe', '#BiếtƠn', '#TậpThở'].map((tag) => (
                      <button
                        key={`modal-tag-${tag}`}
                        type="button"
                        onClick={() => setNewEntryTag(tag)}
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold transition ${
                          newEntryTag === tag
                            ? 'bg-[#006e22] text-white shadow-2xs'
                            : 'bg-[#f7faf8] text-[#4a6551] border border-[#dfe4d9]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note Content */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#181d16]">Nội dung tâm sự / nhật ký:</label>
                  <textarea
                    rows={3}
                    value={newEntryNote}
                    onChange={(e) => setNewEntryNote(e.target.value)}
                    placeholder="Những trải nghiệm, cảm xúc, hoặc điều bạn muốn ghi nhớ lại..."
                    className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] focus:outline-none focus:ring-2 focus:ring-[#006e22]"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewEntryModalOpen(false)}
                    className="flex-1 py-2.5 rounded-full text-xs font-medium text-[#6f7a6c] bg-[#f7faf8] border border-[#dfe4d9] hover:bg-[#eaf0e5]"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewCustomJournalEntry}
                    disabled={!newEntryNote.trim()}
                    className="flex-1 py-2.5 rounded-full text-xs font-bold text-white bg-[#006e22] hover:bg-[#005116] disabled:opacity-40 shadow-sm transition"
                  >
                    Lưu Vào Nhật Ký
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 7-Day Emotional Balance Breakdown - REFINED ACCURATE WORDING */}
          <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#181d16] flex items-center gap-1.5">
                <AssessmentChartIcon size={16} className="text-[#006e22]" />
                <span>Thống Kê Tâm Trạng Tuần ({totalTracked} Ngày Đã Ghi Nhận)</span>
              </h4>
              <span className="text-[10px] text-[#6f7a6c] font-medium">Đồng bộ tự động</span>
            </div>

            {/* Segmented Weekly Mood Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-full bg-[#f0f4ee] overflow-hidden flex p-0.5 gap-0.5">
                {positiveDays > 0 && (
                  <div
                    style={{ width: `${positivePct}%` }}
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    title={`Tươi vui & Tích cực: ${positiveDays} ngày (${positivePct}%)`}
                  />
                )}
                {balancedDays > 0 && (
                  <div
                    style={{ width: `${balancedPct}%` }}
                    className="h-full rounded-full bg-[#67c76c] transition-all duration-500"
                    title={`Cân bằng & Thư thái: ${balancedDays} ngày (${balancedPct}%)`}
                  />
                )}
                {tensionDays > 0 && (
                  <div
                    style={{ width: `${tensionPct}%` }}
                    className="h-full rounded-full bg-purple-400 transition-all duration-500"
                    title={`Căng thẳng & Mệt mỏi: ${tensionDays} ngày (${tensionPct}%)`}
                  />
                )}
              </div>
              <div className="flex items-center justify-between text-[9px] text-[#6f7a6c] px-0.5">
                <span className="text-amber-700 font-semibold">● Tươi vui ({positivePct}%)</span>
                <span className="text-[#006e22] font-semibold">● Cân bằng ({balancedPct}%)</span>
                <span className="text-purple-700 font-semibold">● Căng thẳng & Mệt mỏi ({tensionPct}%)</span>
              </div>
            </div>

            {/* 3 Synchronized Category Stat Cards with Refined Labels */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col items-center justify-center">
                <EmotionIcon emotion="Tươi vui" size={24} />
                <p className="text-xs font-bold text-amber-900 mt-1">{positiveDays} Ngày</p>
                <p className="text-[10px] text-amber-700 font-medium">Tươi vui & Tích cực ({positivePct}%)</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col items-center justify-center">
                <EmotionIcon emotion="Ổn định" size={24} />
                <p className="text-xs font-bold text-[#006e22] mt-1">{balancedDays} Ngày</p>
                <p className="text-[10px] text-[#006e22] font-medium">Cân bằng & Thư thái ({balancedPct}%)</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex flex-col items-center justify-center">
                <EmotionIcon emotion="Căng thẳng" size={24} />
                <p className="text-xs font-bold text-purple-900 mt-1">{tensionDays} Ngày</p>
                <p className="text-[10px] text-purple-700 font-medium">Cần xoa dịu ({tensionPct}%)</p>
              </div>
            </div>

            {/* REAL-TIME DYNAMIC AI PSYCHOLOGICAL RECAP (POWERED BY GEMINI SDK) */}
            <div className="p-4 bg-gradient-to-br from-[#e0f5ea] to-[#f4fbf5] rounded-2xl border border-[#67c76c]/40 text-xs text-[#005116] space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="font-bold flex items-center gap-1.5 text-sm text-[#005116]">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Bản Phân Tích Tâm Trạng Real-Time (AI Trợ Lý Tri Kỷ)</span>
                </p>
                <button
                  type="button"
                  onClick={() => fetchAiWeeklyRecap(true)}
                  disabled={isAiWeeklyRecapLoading}
                  className="px-2.5 py-1 rounded-full bg-white/80 border border-[#67c76c]/40 hover:bg-white text-[10px] font-bold text-[#006e22] flex items-center gap-1 shadow-2xs transition disabled:opacity-50"
                  title="Phân tích lại theo dữ liệu mới nhất"
                >
                  <RefreshCw className={`w-3 h-3 ${isAiWeeklyRecapLoading ? 'animate-spin' : ''}`} />
                  <span>{isAiWeeklyRecapLoading ? 'Đang phân tích...' : 'AI Phân Tích Lại'}</span>
                </button>
              </div>

              {isAiWeeklyRecapLoading ? (
                <div className="py-4 flex flex-col items-center justify-center gap-2 text-[#4a6551]">
                  <RefreshCw className="w-5 h-5 text-[#006e22] animate-spin" />
                  <span className="text-xs italic">AI đang đọc dữ liệu 7 ngày và tạo bản phân tích chuyên sâu...</span>
                </div>
              ) : aiWeeklyRecap ? (
                <div className="space-y-2 text-[#181d16]">
                  <h5 className="font-bold text-xs text-[#005116] border-b border-[#67c76c]/20 pb-1">
                    {aiWeeklyRecap.headline}
                  </h5>
                  <p className="text-[11px] leading-relaxed text-[#3f4a3d]">
                    {aiWeeklyRecap.summary}
                  </p>

                  {aiWeeklyRecap.emotionalHighlights && (
                    <div className="p-2.5 bg-white/70 rounded-xl border border-[#67c76c]/30 text-[11px] text-[#2d3a2c]">
                      <span className="font-semibold text-[#006e22]">Điểm nhấn tâm lý: </span>
                      {aiWeeklyRecap.emotionalHighlights}
                    </div>
                  )}

                  {aiWeeklyRecap.microActions && aiWeeklyRecap.microActions.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-[#005116]">Hành động nhỏ gợi ý cho bạn:</span>
                      <ul className="space-y-1 text-[11px] text-[#3f4a3d]">
                        {aiWeeklyRecap.microActions.map((action, i) => (
                          <li key={`action-${i}`} className="flex items-start gap-1.5">
                            <span className="text-[#006e22] font-bold">✓</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiWeeklyRecap.encouragement && (
                    <p className="text-[11px] italic text-[#006e22] font-medium pt-1">
                      💬 "{aiWeeklyRecap.encouragement}"
                    </p>
                  )}

                  {aiWeeklyRecapLastUpdated && (
                    <div className="text-[9px] text-[#6f7a6c] text-right pt-0.5">
                      Cập nhật bởi Gemini AI lúc {aiWeeklyRecapLastUpdated}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-[11px] text-[#181d16] leading-relaxed">
                    {positiveDays >= 4
                      ? `Tuần này bạn có ${positiveDays} ngày tràn đầy năng lượng tươi vui (${positivePct}%). Trạng thái tinh thần đang rất ổn định và bền bỉ!`
                      : tensionDays >= 3
                      ? `Tuần này bạn trải qua ${tensionDays} ngày có áp lực hoặc căng thẳng (${tensionPct}%). Đừng quên dành 10 phút thư giãn cùng bài tập thở và nghe podcast chữa lành.`
                      : `Bạn duy trì trạng thái cảm xúc tương đối cân bằng (${balancedDays} ngày ổn định). Hãy tiếp tục duy trì thói quen check-in mỗi ngày nhé!`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TẦM SOÁT ĐA CHIỀU (ASSESSMENT & REAL-TIME RECAP) */}
      {activeTab === 'assessment' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AssessmentChartIcon size={22} className="text-[#006e22]" />
                <div>
                  <h3 className="text-xs font-bold text-[#181d16] uppercase tracking-wider">
                    Tầm Soát Tâm Lý Chuẩn Y Khoa
                  </h3>
                  <p className="text-[11px] text-[#6f7a6c]">PHQ-9, GAD-7, PSS-10 & PSQI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenQuiz}
                className="px-3.5 py-1.5 rounded-full bg-[#006e22] hover:bg-[#005116] text-white text-xs font-bold transition shadow-sm"
              >
                {quizResult ? 'Đo lại' : 'Làm Quiz'}
              </button>
            </div>

            {quizResult ? (
              <div className="space-y-3.5">
                {/* Visual Radar */}
                <div className="flex items-center justify-center py-2 bg-[#f7faf8] rounded-2xl border border-[#dfe4d9]">
                  <RadarChart
                    depressionPct={quizResult.depressionPct}
                    anxietyPct={quizResult.anxietyPct}
                    stressPct={quizResult.stressPct}
                    sleepPct={quizResult.sleepPct}
                  />
                </div>

                {/* REAL-TIME AI CLINICAL ASSESSMENT RECAP */}
                <div className="p-3.5 bg-gradient-to-br from-[#e0f5ea] to-[#f4fbf5] rounded-2xl border border-[#67c76c]/40 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#67c76c]/20 pb-1.5">
                    <span className="text-xs font-bold text-[#005116] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {aiAssessmentRecap?.headline || 'Bản Đánh Giá Chuyên Sâu Từ AI Y Khoa'}
                    </span>
                    <button
                      type="button"
                      onClick={fetchAiAssessmentRecap}
                      disabled={isAiAssessmentLoading}
                      className="px-2 py-0.5 rounded-full bg-white text-[10px] font-bold text-[#006e22] border border-[#67c76c]/30 hover:bg-[#f0f5ea] transition flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isAiAssessmentLoading ? 'animate-spin' : ''}`} />
                      <span>{isAiAssessmentLoading ? 'Đang tạo...' : 'Tạo Lại'}</span>
                    </button>
                  </div>

                  {isAiAssessmentLoading ? (
                    <div className="py-3 text-center text-xs text-[#4a6551] flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#006e22]" />
                      <span>AI đang biên soạn phân tích 4 chiều...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 text-[#181d16] text-xs">
                      <p className="leading-relaxed text-[#3f4a3d]">
                        {aiAssessmentRecap?.overallSummary || quizResult.overallSummary}
                      </p>

                      {aiAssessmentRecap?.microActions && aiAssessmentRecap.microActions.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-bold text-[#005116]">Khuyến nghị điều chỉnh lối sống:</span>
                          <ul className="space-y-1 text-[11px] text-[#3f4a3d]">
                            {aiAssessmentRecap.microActions.map((act, i) => (
                              <li key={`rec-${i}`} className="flex items-start gap-1.5">
                                <span className="text-[#006e22]">●</span>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAssessmentRecap?.clinicalAdvice && (
                        <div className="p-2 rounded-xl bg-white/80 border border-[#67c76c]/30 text-[11px] text-[#005116]">
                          <span className="font-bold">Lời khuyên chuyên môn: </span>
                          <span>{aiAssessmentRecap.clinicalAdvice}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4 Dimension Score Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9]">
                    <span className="text-[10px] text-[#6f7a6c]">Trầm cảm (PHQ-9)</span>
                    <p className="text-xs font-bold text-[#181d16]">{quizResult.depressionPct}% (Ngưỡng nhẹ)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9]">
                    <span className="text-[10px] text-[#6f7a6c]">Lo âu (GAD-7)</span>
                    <p className="text-xs font-bold text-[#181d16]">{quizResult.anxietyPct}% (Vừa phải)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9]">
                    <span className="text-[10px] text-[#6f7a6c]">Căng thẳng (PSS-10)</span>
                    <p className="text-xs font-bold text-[#181d16]">{quizResult.stressPct}% (Trung bình)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9]">
                    <span className="text-[10px] text-[#6f7a6c]">Giấc ngủ (PSQI)</span>
                    <p className="text-xs font-bold text-[#181d16]">{quizResult.sleepPct}% (Cần thư giãn)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-[#6f7a6c]">Bạn chưa hoàn thành bài tầm soát 4 chiều.</p>
                <button
                  type="button"
                  onClick={onOpenQuiz}
                  className="px-4 py-2 rounded-full bg-[#006e22] text-white text-xs font-bold"
                >
                  Bắt đầu làm bài (3 phút)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: THỬ THÁCH RÈN LUYỆN (PINNED ACTIVE CHALLENGE ON TOP) */}
      {activeTab === 'challenge' && (
        <div className="space-y-4 animate-in fade-in">
          {/* 1. HIGHLIGHTED ACTIVE CHALLENGE PINNED ON TOP */}
          {challengeProgress ? (
            <div className="p-4 rounded-3xl bg-gradient-to-b from-[#e0f5ea]/90 to-[#ffffff] border-2 border-[#006e22] space-y-3.5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#006e22] text-white text-[10px] font-extrabold tracking-wide uppercase shadow-2xs">
                    Thử Thách Đang Thực Hiện
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#006e22] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Chuỗi {streakCount} Ngày</span>
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-[#181d16] flex items-center gap-2">
                  <span>{activeChallengeObj.badgeIcon}</span>
                  <span>{activeChallengeObj.title}</span>
                </h4>
                <p className="text-xs text-[#4a6551] leading-relaxed">
                  {activeChallengeObj.description}
                </p>
              </div>

              {/* Today's Daily Prompt Action Card */}
              <div className="p-3 bg-[#ffffff] rounded-2xl border border-[#dfe4d9] space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-[#006e22] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#006e22]" />
                  <span>Nhiệm Vụ Hôm Nay (Ngày {completedCount + 1}/{totalDays})</span>
                </span>
                <p className="text-xs text-[#181d16] font-medium leading-relaxed">
                  "{activeChallengeObj.dailyPrompt}"
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6f7a6c]">Tiến độ rèn luyện</span>
                  <span className="font-bold text-[#006e22]">
                    {completedCount}/{totalDays} Ngày ({Math.round((completedCount / totalDays) * 100)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#dfe4d9] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(completedCount / totalDays) * 100}%` }}
                    className="h-full bg-[#006e22] rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Check-in streak button */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckInStreak}
                  disabled={challengeProgress?.todayCompleted}
                  className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 ${
                    challengeProgress?.todayCompleted
                      ? 'bg-[#e0f5ea] text-[#005116] border border-[#67c76c]/40 cursor-default'
                      : 'bg-[#006e22] hover:bg-[#005116] text-white'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {challengeProgress?.todayCompleted
                      ? 'Đã hoàn thành điểm danh hôm nay'
                      : 'Điểm danh hoàn thành hôm nay'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] text-center space-y-2.5 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center mx-auto">
                <MindfulFlameIcon size={22} className="text-[#006e22]" />
              </div>
              <h4 className="text-xs font-bold text-[#181d16]">Chưa Có Thử Thách Nào Đang Thực Hiện</h4>
              <p className="text-[11px] text-[#6f7a6c] leading-relaxed max-w-xs mx-auto">
                Hãy lựa chọn một thử thách rèn luyện bên dưới để bắt đầu chuỗi ngày nuôi dưỡng thói quen chữa lành và cải thiện giấc ngủ.
              </p>
            </div>
          )}

          {/* 2. OTHER AVAILABLE CHALLENGES LIST */}
          <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold text-[#181d16] uppercase tracking-wider flex items-center gap-1.5">
              <MindfulFlameIcon size={18} className="text-amber-500" />
              <span>{challengeProgress ? 'Danh Sách Thử Thách Khác' : 'Khám Phá Danh Sách Thử Thách'}</span>
            </h3>

            <div className="space-y-2.5">
              {otherChallenges.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-2xl border border-[#dfe4d9] bg-[#f7faf8] hover:bg-[#f0f5ea] transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#181d16] flex items-center gap-1.5">
                      <span>{ch.badgeIcon}</span>
                      <span>{ch.title}</span>
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffffff] text-[#006e22] font-semibold border border-[#dfe4d9]">
                      {ch.durationDays} Ngày
                    </span>
                  </div>
                  <p className="text-xs text-[#4a6551] leading-relaxed">{ch.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#dfe4d9]/80">
                    <span className="text-[10px] text-[#6f7a6c]">Mục tiêu: {ch.durationDays} ngày rèn luyện</span>
                    <button
                      type="button"
                      onClick={() => handleSelectChallenge(ch)}
                      className="px-3 py-1 rounded-full bg-[#006e22] hover:bg-[#005116] text-white text-[11px] font-bold shadow-sm transition"
                    >
                      Bắt đầu thử thách này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
