import React, { useState, useEffect } from 'react';
import { UserRole, SOSBuddy, QuizResult, UserChallengeProgress } from '../types';
import {
  User,
  Shield,
  Heart,
  DollarSign,
  Smartphone,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  Phone,
  PhoneCall,
  Send,
  Lock,
  Activity,
  Award,
  HelpCircle,
  Sparkles,
  Cloud,
  LogIn,
  LogOut,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { RadarChart } from './RadarChart';
import { WidgetCompanion } from './WidgetCompanion';
import { OrbThemeColor } from './CrystalGlassOrb';
import { AssessmentChartIcon } from './CustomIcons';
import { useFirebase } from '../context/FirebaseContext';


interface ProfileViewProps {
  currentRole: UserRole;
  onRoleChange: (r: UserRole) => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
  sosBuddy: SOSBuddy;
  onUpdateSOSBuddy: (buddy: SOSBuddy) => void;
  quizHistory: QuizResult[];
  challengeProgress: UserChallengeProgress | null;
  onOpenQuiz: () => void;
  onOpenSOS: () => void;
  onCheckInStreak?: () => void;
  onOpenBreathing?: () => void;
  onOpenHealingHub?: () => void;
  onNavigateToChallenge?: () => void;
  currentOrbTheme?: OrbThemeColor;
  onChangeOrbTheme?: (theme: OrbThemeColor) => void;
}

type ProfileSubPage = 'account' | 'widget' | 'security' | 'buddy' | 'history' | 'business' | null;

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentRole,
  onRoleChange,
  userName,
  onUpdateUserName,
  sosBuddy,
  onUpdateSOSBuddy,
  quizHistory,
  challengeProgress,
  onOpenQuiz,
  onOpenSOS: _onOpenSOS,
  onCheckInStreak = () => {},
  onOpenBreathing = () => {},
  onOpenHealingHub = () => {},
  onNavigateToChallenge = () => {},
  currentOrbTheme = 'mint',
  onChangeOrbTheme,
}) => {
  const { user, userProfile, signInWithGoogle, logOut: handleFirebaseLogout, isFirebaseReady } = useFirebase();
  const [selectedSubPage, setSelectedSubPage] = useState<ProfileSubPage>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // SOS Buddy form state
  const [buddyName, setBuddyName] = useState(sosBuddy.name || '');
  const [buddyPhone, setBuddyPhone] = useState(sosBuddy.phone || '');
  const [buddyMessage, setBuddyMessage] = useState(
    sosBuddy.customMessage || 'Mình đang cảm thấy không ổn và cần một người lắng nghe... Hãy gọi lại cho mình khi nhận được tin nhắn nhé.'
  );
  const [buddySavedSuccess, setBuddySavedSuccess] = useState(false);

  useEffect(() => {
    setBuddyName(sosBuddy.name || '');
    setBuddyPhone(sosBuddy.phone || '');
    if (sosBuddy.customMessage) {
      setBuddyMessage(sosBuddy.customMessage);
    }
  }, [sosBuddy]);

  // Security passlock state
  const [isPasscodeEnabled, setIsPasscodeEnabled] = useState(false);
  const [isAnonymousPublic, setIsAnonymousPublic] = useState(true);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const res = await signInWithGoogle();
      if (res && res.displayName) {
        onUpdateUserName(res.displayName);
      }
      audioSynth.playChime(528, 0.4);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await handleFirebaseLogout();
    audioSynth.playChime(396, 0.3);
  };


  const handleSaveSOSBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SOSBuddy = {
      name: buddyName,
      phone: buddyPhone,
      relationship: 'Người thân',
      customMessage: buddyMessage,
      isNotified: true,
    };
    onUpdateSOSBuddy(updated);
    setBuddySavedSuccess(true);
    audioSynth.playChime(528, 0.8);
    setTimeout(() => setBuddySavedSuccess(false), 3000);
  };

  const latestQuiz = quizHistory[quizHistory.length - 1];

  const handleSelectSubPage = (page: ProfileSubPage) => {
    audioSynth.playChime(520, 0.15);
    setSelectedSubPage(page);
  };

  const handleBackToMenu = () => {
    audioSynth.playChime(420, 0.15);
    setSelectedSubPage(null);
  };

  const subPageTitles: Record<string, { title: string; breadcrumb: string; icon: React.ReactNode }> = {
    account: { title: 'Thông Tin Tài Khoản', breadcrumb: 'Hồ sơ cá nhân', icon: <User className="w-4 h-4 text-[#006e22]" /> },
    widget: { title: 'Tiện Ích Widget 2x2', breadcrumb: 'Màn hình chính', icon: <Smartphone className="w-4 h-4 text-[#006e22]" /> },
    security: { title: 'Bảo Mật & Chuẩn Y Khoa', breadcrumb: 'Bảo vệ dữ liệu', icon: <Shield className="w-4 h-4 text-[#1976d2]" /> },
    buddy: { title: 'Vòng Tròn Tin Tưởng', breadcrumb: 'SOS Buddy khẩn cấp', icon: <Heart className="w-4 h-4 text-[#ba1a1a]" /> },
    history: { title: 'Lịch Sử Tầm Soát', breadcrumb: 'Sức khỏe tinh thần', icon: <AssessmentChartIcon size={16} className="text-[#3f51b5]" /> },
    business: { title: 'Gói Phí & Doanh Thu', breadcrumb: 'SoulCare 2026', icon: <DollarSign className="w-4 h-4 text-[#f57f17]" /> },
  };

  return (
    <div className="p-3.5 space-y-3.5 pb-24 text-[#181d16] font-sans animate-in fade-in">
      {/* 1. ROOT VIEW */}
      {selectedSubPage === null ? (
        <div className="space-y-3.5 animate-in fade-in">
          {/* Profile User Card */}
          <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs relative overflow-hidden">
            <div className="flex items-center gap-3.5">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || userName}
                  className="w-13 h-13 rounded-2xl object-cover ring-2 ring-[#67c76c]/40 shrink-0 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#67c76c] to-[#c4f7f4] flex items-center justify-center text-[#005116] font-black text-xl shadow-sm ring-2 ring-[#67c76c]/30 shrink-0">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-[#181d16] truncate">
                    {user?.displayName || userName || 'Thanh Hà'}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${
                    currentRole === 'expert'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-[#e0f5ea] text-[#006e22] border-[#67c76c]/30'
                  }`}>
                    {currentRole === 'expert' ? '🩺 Chuyên Gia / Bác Sĩ' : '🌿 Khách Hàng'}
                  </span>
                </div>
                <p className="text-[11px] text-[#6f7a6c] mt-0.5 line-clamp-1">
                  {user?.email || (currentRole === 'expert' ? 'Chuyên gia Tâm lý lâm sàng' : '"Lắng nghe và thấu cảm chính mình mỗi ngày."')}
                </p>
              </div>
            </div>

            {/* Firebase Cloud Sync Status */}
            <div className="pt-2 border-t border-[#f0f4ec] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[#006e22]">
                <Cloud className="w-3.5 h-3.5 text-[#006e22]" />
                <span className="font-semibold">
                  {isFirebaseReady ? 'Firebase Firestore (asia-southeast1)' : 'Đang kết nối Firebase...'}
                </span>
              </div>
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-2.5 py-1 rounded-xl bg-[#f7faf8] hover:bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold border border-[#dfe4d9] flex items-center gap-1 transition"
                >
                  <LogOut className="w-3 h-3" />
                  Đăng xuất
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="px-2.5 py-1 rounded-xl bg-[#006e22] hover:bg-[#005116] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition active:scale-95 disabled:opacity-50"
                >
                  <LogIn className="w-3 h-3" />
                  {isSigningIn ? 'Đang xác thực...' : 'Đăng nhập Google'}
                </button>
              )}
            </div>
          </div>

          {/* Vertical Settings Menu List */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6f7a6c] px-1">
              Cài Đặt & Tiện Ích Ứng Dụng
            </h3>

            {/* Menu Item 1: Account Info */}
            <button
              type="button"
              onClick={() => handleSelectSubPage('account')}
              className="w-full p-3.5 rounded-2xl bg-[#ffffff] hover:bg-[#f7faf8] border border-[#dfe4d9] flex items-center justify-between text-left transition group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e0f5ea] border border-[#67c76c]/30 flex items-center justify-center text-[#006e22] group-hover:scale-105 transition">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#006e22] transition">
                    Hồ Sơ & Thông Tin Tài Khoản
                  </h4>
                  <p className="text-[10px] text-[#6f7a6c]">
                    Tên hiển thị, định danh y tế, cài đặt cá nhân
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6f7a6c] group-hover:text-[#006e22] group-hover:translate-x-0.5 transition" />
            </button>

            {/* Menu Item 2: Widget 2x2 */}
            <button
              type="button"
              onClick={() => handleSelectSubPage('widget')}
              className="w-full p-3.5 rounded-2xl bg-[#ffffff] hover:bg-[#f7faf8] border border-[#dfe4d9] flex items-center justify-between text-left transition group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#c4f7f4] border border-[#366664]/30 flex items-center justify-center text-[#005116] group-hover:scale-105 transition">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#006e22] transition">
                      Tiện Ích Widget Màn Hình Chờ (2x2)
                    </h4>
                    <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#c4f7f4] text-[#005116] font-bold">
                      iOS & Android
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6f7a6c]">
                    Điểm danh Streak 1 chạm, phím tắt thở 4-7-8
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6f7a6c] group-hover:text-[#006e22] group-hover:translate-x-0.5 transition" />
            </button>

            {/* Menu Item 3: Security & HIPAA */}
            <button
              type="button"
              onClick={() => handleSelectSubPage('security')}
              className="w-full p-3.5 rounded-2xl bg-[#ffffff] hover:bg-[#f7faf8] border border-[#dfe4d9] flex items-center justify-between text-left transition group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e3f2fd] border border-[#2196f3]/30 flex items-center justify-center text-[#1976d2] group-hover:scale-105 transition">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#006e22] transition">
                    Bảo Mật & Chuẩn Đạo Đức Y Tế
                  </h4>
                  <p className="text-[10px] text-[#6f7a6c]">
                    Khóa FaceID / Passcode, Chế độ ẩn danh khi review
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6f7a6c] group-hover:text-[#006e22] group-hover:translate-x-0.5 transition" />
            </button>

            {/* Menu Item 4: SOS Buddy */}
            <button
              type="button"
              onClick={() => handleSelectSubPage('buddy')}
              className="w-full p-3.5 rounded-2xl bg-[#ffdad6] hover:bg-[#ffd1cc] border border-[#ba1a1a]/30 flex items-center justify-between text-left transition group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ffffff] border border-[#ba1a1a]/30 flex items-center justify-center text-[#ba1a1a] group-hover:scale-105 transition">
                  <Heart className="w-5 h-5 text-[#ba1a1a] fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#ba1a1a] transition">
                      Vòng Tròn Tin Tưởng (SOS Buddy)
                    </h4>
                    {sosBuddy.name ? (
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#ba1a1a] text-white font-semibold">
                        {sosBuddy.name}
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#ba1a1a]/15 text-[#ba1a1a] font-semibold">
                        Chưa cài đặt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-[#6f7a6c]">
                      {sosBuddy.name ? 'Người thân khẩn cấp' : 'Chạm để thiết lập người thân khẩn cấp'}
                    </p>
                    {sosBuddy.phone && (
                      <span className="text-[10px] text-[#ba1a1a] font-mono flex items-center gap-1">
                        <PhoneCall className="w-2.5 h-2.5" />
                        {sosBuddy.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6f7a6c] group-hover:text-[#ba1a1a] group-hover:translate-x-0.5 transition" />
            </button>

            {/* Menu Item 5: Quiz History & Radar */}
            <button
              type="button"
              onClick={() => handleSelectSubPage('history')}
              className="w-full p-3.5 rounded-2xl bg-[#ffffff] hover:bg-[#f7faf8] border border-[#dfe4d9] flex items-center justify-between text-left transition group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e8eaf6] border border-[#3f51b5]/30 flex items-center justify-center text-[#3f51b5] group-hover:scale-105 transition">
                  <AssessmentChartIcon size={20} className="text-[#3f51b5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#006e22] transition">
                    Lịch Sử Tầm Soát Tâm Lý
                  </h4>
                  <p className="text-[10px] text-[#6f7a6c]">
                    Biểu đồ Radar đa chiều PHQ-9, GAD-7, PSS-10 & PSQI
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6f7a6c] group-hover:text-[#006e22] group-hover:translate-x-0.5 transition" />
            </button>

            {/* Menu Item 6: Business & Monetization */}
            <button
              type="button"
              onClick={() => handleSelectSubPage('business')}
              className="w-full p-3.5 rounded-2xl bg-[#ffffff] hover:bg-[#f7faf8] border border-[#dfe4d9] flex items-center justify-between text-left transition group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#fff8e1] border border-[#ffa000]/30 flex items-center justify-center text-[#f57f17] group-hover:scale-105 transition">
                  <DollarSign className="w-5 h-5 text-[#f57f17]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#181d16] group-hover:text-[#006e22] transition">
                    Gói Phí & Mô Hình Doanh Thu (SoulCare 2026)
                  </h4>
                  <p className="text-[10px] text-[#6f7a6c]">
                    Chính sách 0đ buổi đầu, hoa hồng và liên kết bệnh viện
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6f7a6c] group-hover:text-[#006e22] group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      ) : (
        /* 2. SUBPAGE SLIDE VIEW */
        <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-200">
          {/* Subpage Breadcrumb Navigation Header */}
          <div className="p-3 bg-[#ffffff] rounded-2xl border border-[#dfe4d9] flex items-center justify-between shadow-2xs">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f5ea] hover:bg-[#e0f5ea] text-[#006e22] text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>

            <div className="text-right">
              <span className="text-[10px] text-[#6f7a6c] uppercase font-semibold">
                Profile &rarr; {subPageTitles[selectedSubPage]?.breadcrumb}
              </span>
              <h3 className="text-xs font-bold text-[#181d16] flex items-center justify-end gap-1.5">
                <span>{subPageTitles[selectedSubPage]?.icon}</span>
                <span>{subPageTitles[selectedSubPage]?.title}</span>
              </h3>
            </div>
          </div>

          {/* SUB-SLIDE 1: ACCOUNT INFO */}
          {selectedSubPage === 'account' && (
            <div className="space-y-3 animate-in fade-in">
              {/* Account Form */}
              <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6f7a6c]">
                  Thông Tin Tài Khoản
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-[#6f7a6c]">Họ và tên / Biệt danh hiển thị:</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => onUpdateUserName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] text-xs mt-1 focus:ring-2 focus:ring-[#006e22] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#6f7a6c]">Số điện thoại (Bảo mật y khoa):</label>
                    <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] text-xs mt-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#006e22]" />
                        0987 *** 321
                      </span>
                      <span className="text-[10px] text-[#006e22] font-bold bg-[#e0f5ea] px-2.5 py-0.5 rounded-full">
                        Đã mã hóa
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#6f7a6c]">Vai trò tài khoản (Khách Hàng / Chuyên Gia):</label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onRoleChange('user');
                          audioSynth.playChime(520, 0.2);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          currentRole === 'user'
                            ? 'bg-[#006e22] text-white border-[#006e22] shadow-2xs'
                            : 'bg-[#f7faf8] text-[#4a5548] border-[#dfe4d9] hover:bg-[#e0f5ea]'
                        }`}
                      >
                        <span>🌿 Khách Hàng</span>
                        {currentRole === 'user' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onRoleChange('expert');
                          audioSynth.playChime(587, 0.2);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          currentRole === 'expert'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-[#f7faf8] text-[#4a5548] border-[#dfe4d9] hover:bg-amber-50'
                        }`}
                      >
                        <span>🩺 Chuyên Gia</span>
                        {currentRole === 'expert' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#6f7a6c]">Email tài khoản:</label>
                    <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] text-xs mt-1">
                      {user?.email || 'thanhha.psych@taman.vn'}
                    </div>
                  </div>

                  {user ? (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full mt-2 py-2.5 rounded-xl bg-[#ffdad6] hover:bg-[#ffd1cc] text-[#ba1a1a] text-xs font-bold border border-[#ba1a1a]/30 flex items-center justify-center gap-1.5 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất tài khoản Google
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="w-full mt-2 py-2.5 rounded-xl bg-[#006e22] hover:bg-[#005116] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
                    >
                      <LogIn className="w-4 h-4" />
                      {isSigningIn ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-SLIDE 2: WIDGET 2X2 */}
          {selectedSubPage === 'widget' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#006e22]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#181d16]">Cài Đặt Tiện Ích Widget (2x2)</h4>
                      <p className="text-[10px] text-[#6f7a6c]">Trải nghiệm tương tác màn hình chính điện thoại</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] font-bold border border-[#67c76c]/30">
                    iOS & Android
                  </span>
                </div>
                <p className="text-[11px] text-[#3f4a3d] pt-1 leading-relaxed">
                  Ghim tiện ích SoulCare ra màn hình chờ để điểm danh Streak 1 chạm, bật nhanh bài thở 4-7-8 hoặc nhạc thư giãn não bộ mà không cần mở sâu vào app.
                </p>
              </div>

              {/* Interactive Sandbox Widget */}
              <div className="rounded-3xl bg-[#f7faf8] border border-[#dfe4d9] overflow-hidden p-2">
                <WidgetCompanion
                  challengeProgress={challengeProgress}
                  onCheckInStreak={onCheckInStreak}
                  onOpenBreathing={onOpenBreathing}
                  onOpenMusic={onOpenHealingHub}
                  onNavigateToChallenge={onNavigateToChallenge}
                  currentOrbTheme={currentOrbTheme}
                  onChangeOrbTheme={onChangeOrbTheme}
                />
              </div>

              {/* Setup Guide */}
              <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-2 text-xs shadow-2xs">
                <h5 className="font-bold text-[#181d16] flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#006e22]" />
                  <span>Hướng dẫn ghim Widget ra màn hình:</span>
                </h5>
                <ul className="text-[11px] text-[#6f7a6c] space-y-1.5 list-disc pl-4">
                  <li><strong>iOS (iPhone):</strong> Nhấn giữ màn hình chính &rarr; Bấm dấu (+) góc trái &rarr; Tìm "SoulCare" &rarr; Chọn Widget 2x2.</li>
                  <li><strong>Android:</strong> Chạm giữ vùng trống màn hình &rarr; Chọn "Widgets" &rarr; Kéo thả "SoulCare 2x2" vào vị trí mong muốn.</li>
                </ul>
              </div>
            </div>
          )}

          {/* SUB-SLIDE 3: SECURITY & ETHICS */}
          {selectedSubPage === 'security' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6f7a6c] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#006e22]" />
                  Bảo Mật & Chuẩn Đạo Đức Y Tế
                </h4>

                <div className="space-y-2.5 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] cursor-pointer">
                    <div>
                      <span className="font-bold text-[#181d16]">Khóa Ứng Dụng (FaceID / Passcode)</span>
                      <p className="text-[10px] text-[#6f7a6c]">Bảo vệ nhật ký và lịch sử trò chuyện khi mở app.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPasscodeEnabled}
                      onChange={(e) => setIsPasscodeEnabled(e.target.checked)}
                      className="w-4 h-4 text-[#006e22] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] cursor-pointer">
                    <div>
                      <span className="font-bold text-[#181d16]">Chế độ Ẩn Danh khi Đặt Lịch & Review</span>
                      <p className="text-[10px] text-[#6f7a6c]">Chỉ hiển thị biệt danh trên danh sách công khai.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAnonymousPublic}
                      onChange={(e) => setIsAnonymousPublic(e.target.checked)}
                      className="w-4 h-4 text-[#006e22] rounded"
                    />
                  </label>

                  <div className="p-3 bg-[#e0f5ea] rounded-2xl border border-[#67c76c]/30 text-[11px] text-[#005116] flex items-start gap-2">
                    <Lock className="w-4 h-4 text-[#006e22] shrink-0 mt-0.5" />
                    <span><strong>Cam kết bảo mật:</strong> AI không tham gia nghe lén hay ghi âm cuộc gọi Google Meet 1-1 giữa bạn và Chuyên gia.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-SLIDE 4: SOS BUDDY CONFIG */}
          {selectedSubPage === 'buddy' && (
            <form onSubmit={handleSaveSOSBuddy} className="space-y-3.5 animate-in fade-in">
              <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-[#ba1a1a]">
                  <Heart className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#181d16]">
                    Vòng Tròn Tin Tưởng (SOS Buddy)
                  </h4>
                </div>
                <p className="text-xs text-[#6f7a6c] leading-relaxed">
                  Người thân này sẽ nhận được thông báo SMS/Email khẩn cấp kèm định vị y tế khi bạn bấm nút SOS trên màn hình.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-[#6f7a6c]">Họ tên người thân:</label>
                    <input
                      type="text"
                      value={buddyName}
                      onChange={(e) => setBuddyName(e.target.value)}
                      placeholder="VD: Mẹ, Bạn thân Lan..."
                      className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] text-xs mt-1"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-[#6f7a6c]">Số điện thoại người thân:</label>
                      {buddyPhone && (
                        <a
                          href={`tel:${buddyPhone.replace(/\s+/g, '')}`}
                          className="text-[10px] text-[#ba1a1a] font-bold flex items-center gap-1 hover:underline"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Gọi thử</span>
                        </a>
                      )}
                    </div>
                    <div className="relative mt-1">
                      <PhoneCall className="w-4 h-4 text-[#ba1a1a] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={buddyPhone}
                        onChange={(e) => setBuddyPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] font-mono text-xs focus:ring-2 focus:ring-[#ba1a1a] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#6f7a6c]">Mẫu tin nhắn tự động gửi:</label>
                    <textarea
                      rows={3}
                      value={buddyMessage}
                      onChange={(e) => setBuddyMessage(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-[#181d16] text-xs mt-1 resize-none"
                      required
                    />
                  </div>
                </div>

                {buddySavedSuccess && (
                  <div className="p-2.5 bg-[#e0f5ea] border border-[#67c76c]/40 rounded-xl text-xs text-[#005116] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#006e22]" />
                    Đã lưu thông tin SOS Buddy thành công!
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Lưu Cấu Hình SOS Buddy
                </button>
              </div>
            </form>
          )}

          {/* SUB-SLIDE 5: QUIZ HISTORY & RADAR */}
          {selectedSubPage === 'history' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#181d16]">
                    Biểu Đồ Sức Khỏe Tinh Thần
                  </h4>
                  <button
                    type="button"
                    onClick={onOpenQuiz}
                    className="text-xs text-[#006e22] font-bold hover:underline"
                  >
                    + Làm Lại Quiz
                  </button>
                </div>

                {latestQuiz ? (
                  <div className="space-y-3">
                    <div className="flex justify-center py-2 bg-[#f7faf8] rounded-3xl border border-[#dfe4d9]">
                      <RadarChart
                        depressionPct={latestQuiz.depressionPct}
                        anxietyPct={latestQuiz.anxietyPct}
                        stressPct={latestQuiz.stressPct}
                        sleepPct={latestQuiz.sleepPct}
                        size={240}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9]">
                        <span className="text-[#6f7a6c]">Khí sắc:</span>{' '}
                        <strong className="text-rose-600">{latestQuiz.depressionPct}%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9]">
                        <span className="text-[#6f7a6c]">Lo âu:</span>{' '}
                        <strong className="text-amber-600">{latestQuiz.anxietyPct}%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9]">
                        <span className="text-[#6f7a6c]">Căng thẳng:</span>{' '}
                        <strong className="text-yellow-600">{latestQuiz.stressPct}%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#f7faf8] border border-[#dfe4d9]">
                        <span className="text-[#6f7a6c]">Giấc ngủ:</span>{' '}
                        <strong className="text-blue-600">{latestQuiz.sleepPct}%</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-[#6f7a6c] text-xs space-y-2">
                    <p>Bạn chưa hoàn thành bài tầm soát nào.</p>
                    <button
                      type="button"
                      onClick={onOpenQuiz}
                      className="py-2.5 px-5 rounded-full bg-[#006e22] text-white font-bold"
                    >
                      Làm Quiz Ngay
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-SLIDE 6: BUSINESS & MONETIZATION */}
          {selectedSubPage === 'business' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-[#006e22]">
                  <DollarSign className="w-5 h-5" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#181d16]">
                    Mô Hình Doanh Thu & Duy Trì (SoulCare 2026)
                  </h4>
                </div>

                <div className="space-y-2 text-xs text-[#3f4a3d]">
                  <div className="p-3 bg-[#f7faf8] rounded-2xl border border-[#dfe4d9] space-y-1">
                    <h5 className="font-bold text-[#181d16] flex items-center justify-between">
                      <span>1. Gói Miễn Phí Trải Nghiệm (Free Tier)</span>
                      <span className="text-[#006e22] font-bold">0đ Trọn đời</span>
                    </h5>
                    <p className="text-[11px] text-[#6f7a6c]">
                      Miễn phí 100% Quiz Đa chiều, 7 ngày Emotional Map, Chatbot "Hi", Widget 2x2, Thở 4-7-8, Âm thanh AI Lyria & Buổi tư vấn 1-1 đầu tiên 0đ.
                    </p>
                  </div>

                  <div className="p-3 bg-[#f7faf8] rounded-2xl border border-[#dfe4d9] space-y-1">
                    <h5 className="font-bold text-[#181d16] flex items-center justify-between">
                      <span>2. Hoa Hồng Gói Tư Vấn (Platform Commission)</span>
                      <span className="text-amber-600 font-bold">15% - 20% / Gói</span>
                    </h5>
                    <p className="text-[11px] text-[#6f7a6c]">
                      Thu hoa hồng cố định trên các gói trị liệu dài hạn (3 buổi: 1.35tr, 5 buổi: 2.1tr, 10 buổi: 3.8tr) thanh toán qua nền tảng.
                    </p>
                  </div>

                  <div className="p-3 bg-[#f7faf8] rounded-2xl border border-[#dfe4d9] space-y-1">
                    <h5 className="font-bold text-[#181d16] flex items-center justify-between">
                      <span>3. Hợp Tác Bệnh Viện / Phòng Khám Đối Tác</span>
                      <span className="text-blue-600 font-bold">Referral Fee</span>
                    </h5>
                    <p className="text-[11px] text-[#6f7a6c]">
                      Thu phí liên kết giới thiệu khi người dùng đặt lịch khám offline thành công tại các cơ sở hợp tác (Bạch Mai, ĐH Y Dược, SGP...).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
