import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Heart,
  Cloud,
  ChevronRight,
  Headphones,
  Activity,
  Flame,
  ArrowRight,
  Stethoscope,
  Award,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { audioSynth } from '../utils/audioSynth';
import { RibbonIcon } from './RibbonIcon';
import { AssessmentChartIcon, MindfulFlameIcon, ZenLeafIcon } from './CustomIcons';
import { UserRole } from '../types';

interface AuthGateViewProps {
  onAuthSuccess?: () => void;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({ onAuthSuccess }) => {
  const { signInWithGoogle, signInWithEmail, registerWithEmail, loading } = useFirebase();

  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    audioSynth.playChime(role === 'expert' ? 620 : 520, 0.15);
  };

  const handleGoogleAuth = async () => {
    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      const user = await signInWithGoogle(selectedRole);
      if (user) {
        audioSynth.playChime(528, 0.5);
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Bạn đã đóng cửa sổ đăng nhập Google.');
      } else {
        setErrorMsg('Không thể đăng nhập bằng Google. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    if (mode === 'register' && !displayName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    if (mode === 'register' && !agreeTerms) {
      setErrorMsg('Vui lòng đồng ý với điều khoản dịch vụ và chính sách bảo mật.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'login') {
        const user = await signInWithEmail(email.trim(), password, selectedRole);
        if (user) {
          audioSynth.playChime(528, 0.5);
          if (onAuthSuccess) onAuthSuccess();
        }
      } else {
        const user = await registerWithEmail(email.trim(), password, displayName.trim(), selectedRole);
        if (user) {
          audioSynth.playChime(660, 0.6);
          if (onAuthSuccess) onAuthSuccess();
        }
      }
    } catch (err: any) {
      console.error(err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Email hoặc mật khẩu không chính xác.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('Email này đã được đăng ký. Vui lòng chọn tab Đăng nhập.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Mật khẩu quá ngắn hoặc đơn giản.');
      } else {
        setErrorMsg('Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-full p-4 md:p-6 flex flex-col justify-between bg-gradient-to-b from-[#f4faf2] via-[#f7fbf5] to-[#ffffff] text-[#181d16] font-sans">
      <div className="space-y-4 max-w-sm mx-auto w-full pt-2">
        {/* Brand & App Identity Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-3xl bg-white shadow-sm ring-1 ring-[#67c76c]/40 items-center justify-center">
            <RibbonIcon size={44} />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e0f5ea] border border-[#67c76c]/30 text-[10px] font-extrabold text-[#006e22] uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-[#006e22]" />
              <span>SoulCare</span>
            </div>
            <h2 className="text-xl font-black text-[#181d16] tracking-tight">
              {mode === 'register' ? 'Bắt Đầu Hành Trình Chữa Lành' : 'Chào Mừng Bạn Trở Lại'}
            </h2>
            <p className="text-xs text-[#4a6551] mt-1 leading-relaxed">
              Chọn vai trò của bạn để truy cập phiên bản phù hợp và bảo mật hồ sơ cá nhân.
            </p>
          </div>
        </div>

        {/* 2-Role Choice Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#4a6551] px-1 block">
            Chọn vai trò tài khoản:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Role 1: Khách Hàng */}
            <button
              type="button"
              onClick={() => handleRoleSelect('user')}
              className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                selectedRole === 'user'
                  ? 'bg-white border-[#006e22] ring-2 ring-[#006e22]/20 shadow-sm'
                  : 'bg-white/70 border-[#dfe4d9] hover:bg-white text-[#6f7a6c]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    selectedRole === 'user'
                      ? 'bg-[#e0f5ea] text-[#006e22]'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                </div>
                {selectedRole === 'user' && (
                  <span className="w-2 h-2 rounded-full bg-[#006e22]" />
                )}
              </div>
              <div>
                <p className={`text-xs font-bold ${selectedRole === 'user' ? 'text-[#181d16]' : 'text-slate-600'}`}>
                  Khách Hàng
                </p>
                <p className="text-[10px] text-[#6f7a6c] leading-tight mt-0.5">
                  Thân chủ chăm sóc tâm trí, rèn luyện 21 ngày & khám 0đ
                </p>
              </div>
            </button>

            {/* Role 2: Chuyên Gia */}
            <button
              type="button"
              onClick={() => handleRoleSelect('expert')}
              className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                selectedRole === 'expert'
                  ? 'bg-white border-[#1976d2] ring-2 ring-[#1976d2]/20 shadow-sm'
                  : 'bg-white/70 border-[#dfe4d9] hover:bg-white text-[#6f7a6c]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    selectedRole === 'expert'
                      ? 'bg-[#e3f2fd] text-[#1976d2]'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                </div>
                {selectedRole === 'expert' && (
                  <span className="w-2 h-2 rounded-full bg-[#1976d2]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className={`text-xs font-bold ${selectedRole === 'expert' ? 'text-[#181d16]' : 'text-slate-600'}`}>
                    Chuyên Gia
                  </p>
                  <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-800 text-[8px] font-bold">
                    BS/TS
                  </span>
                </div>
                <p className="text-[10px] text-[#6f7a6c] leading-tight mt-0.5">
                  Chuyên gia tư vấn, duyệt bản Recap AI & quản lý ca hẹn
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 4 Core SoulCare Value Props Pills */}
        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="p-2.5 rounded-2xl bg-white/90 border border-[#dfe4d9] space-y-1 shadow-2xs">
            <div className="w-6 h-6 rounded-xl bg-[#e0f5ea] text-[#006e22] flex items-center justify-center">
              <AssessmentChartIcon size={14} className="text-[#006e22]" />
            </div>
            <p className="text-[11px] font-bold text-[#181d16]">
              {selectedRole === 'expert' ? 'Hồ Sơ Y Khoa' : 'Tầm Soát Y Khoa'}
            </p>
            <p className="text-[9px] text-[#6f7a6c] leading-tight">
              {selectedRole === 'expert' ? 'Bệnh án & Radar PHQ-9' : 'Radar PHQ-9 & GAD-7'}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/90 border border-[#dfe4d9] space-y-1 shadow-2xs">
            <div className="w-6 h-6 rounded-xl bg-[#d6f5df] text-[#005116] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#006e22]" />
            </div>
            <p className="text-[11px] font-bold text-[#181d16]">
              {selectedRole === 'expert' ? 'Thư Ký AI Recap' : 'Trợ Lý Tri Kỷ Hi'}
            </p>
            <p className="text-[9px] text-[#6f7a6c] leading-tight">
              {selectedRole === 'expert' ? 'Tự động hóa ghi chú' : 'Lắng nghe 24/7 thấu cảm'}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/90 border border-[#dfe4d9] space-y-1 shadow-2xs">
            <div className="w-6 h-6 rounded-xl bg-[#fff3e0] text-amber-700 flex items-center justify-center">
              <MindfulFlameIcon size={14} className="text-amber-600" />
            </div>
            <p className="text-[11px] font-bold text-[#181d16]">
              {selectedRole === 'expert' ? 'Lịch Google Sync' : 'Thử Thách 21 Ngày'}
            </p>
            <p className="text-[9px] text-[#6f7a6c] leading-tight">
              {selectedRole === 'expert' ? 'Đồng bộ Google Calendar' : 'Rèn luyện chuỗi thói quen'}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/90 border border-[#dfe4d9] space-y-1 shadow-2xs">
            <div className="w-6 h-6 rounded-xl bg-[#e8eaf6] text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-[11px] font-bold text-[#181d16]">Bảo Mật Cloud</p>
            <p className="text-[9px] text-[#6f7a6c] leading-tight">Firebase Cloud y tế</p>
          </div>
        </div>

        {/* Authentication Form Box */}
        <div className="p-4 rounded-3xl bg-white border border-[#dfe4d9] shadow-sm space-y-3.5">
          {/* Mode Switcher Tabs */}
          <div className="p-1 rounded-2xl bg-[#f0f4ee] grid grid-cols-2 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition ${
                mode === 'register'
                  ? 'bg-white text-[#006e22] shadow-sm'
                  : 'text-[#6f7a6c] hover:text-[#181d16]'
              }`}
            >
              Tạo Tài Khoản Mới
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition ${
                mode === 'login'
                  ? 'bg-white text-[#006e22] shadow-sm'
                  : 'text-[#6f7a6c] hover:text-[#181d16]'
              }`}
            >
              Đăng Nhập
            </button>
          </div>

          {/* Quick Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isSubmitting || loading}
            className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-[#dfe4d9] text-xs font-bold text-[#181d16] flex items-center justify-center gap-2 shadow-2xs transition active:scale-98 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Tiếp tục với Google ({selectedRole === 'expert' ? 'Chuyên gia' : 'Khách hàng'})</span>
          </button>

          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-[#dfe4d9]" />
            <span className="text-[10px] text-[#6f7a6c] uppercase font-semibold">hoặc email</span>
            <div className="flex-1 h-px bg-[#dfe4d9]" />
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-semibold text-[#181d16] block mb-1">
                  {selectedRole === 'expert' ? 'Họ tên Bác sĩ / Chuyên gia:' : 'Họ và tên của bạn:'}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#6f7a6c] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={selectedRole === 'expert' ? 'VD: TS. BS. Nguyễn Minh Anh' : 'VD: Nguyễn Thanh Hà'}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder:text-[#6f7a6c]/60 focus:ring-2 focus:ring-[#006e22] focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-[#181d16] block mb-1">
                Địa chỉ Email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6f7a6c] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder:text-[#6f7a6c]/60 focus:ring-2 focus:ring-[#006e22] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#181d16] block mb-1">
                Mật khẩu:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6f7a6c] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder:text-[#6f7a6c]/60 focus:ring-2 focus:ring-[#006e22] focus:bg-white focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-[#6f7a6c] hover:text-[#181d16] absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <label className="flex items-start gap-2 pt-0.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#dfe4d9] text-[#006e22] focus:ring-[#006e22]"
                />
                <span className="text-[10px] text-[#4a6551] leading-tight">
                  Tôi đồng ý với Quy chế hoạt động và Chính sách bảo mật dữ liệu y tế SoulCare 2026.
                </span>
              </label>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className={`w-full py-2.5 px-4 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-98 disabled:opacity-50 ${
                selectedRole === 'expert'
                  ? 'bg-[#1976d2] hover:bg-[#1565c0] shadow-blue-900/15'
                  : 'bg-[#006e22] hover:bg-[#005116] shadow-emerald-900/15'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'Đang xử lý...'
                  : mode === 'register'
                  ? `Tạo Tài Khoản (${selectedRole === 'expert' ? 'Chuyên Gia' : 'Khách Hàng'})`
                  : `Đăng Nhập (${selectedRole === 'expert' ? 'Chuyên Gia' : 'Khách Hàng'})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Security & Footer Info */}
      <div className="pt-4 pb-2 text-center text-[10px] text-[#6f7a6c] space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[#006e22] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Mã hóa bảo mật 256-bit trên Google Cloud Platform</span>
        </div>
        <p>© 2026 SoulCare Health Platform</p>
      </div>
    </div>
  );
};

