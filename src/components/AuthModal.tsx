import React, { useState } from 'react';
import {
  X,
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
  Stethoscope,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { audioSynth } from '../utils/audioSynth';
import { RibbonIcon } from './RibbonIcon';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { signInWithGoogle, signInWithEmail, registerWithEmail, loading } = useFirebase();

  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      const user = await signInWithGoogle(selectedRole);
      if (user) {
        audioSynth.playChime(528, 0.5);
        onClose();
        if (onSuccess) onSuccess();
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

    try {
      setIsSubmitting(true);
      if (mode === 'login') {
        const user = await signInWithEmail(email.trim(), password, selectedRole);
        if (user) {
          audioSynth.playChime(528, 0.5);
          onClose();
          if (onSuccess) onSuccess();
        }
      } else {
        const user = await registerWithEmail(email.trim(), password, displayName.trim(), selectedRole);
        if (user) {
          audioSynth.playChime(660, 0.6);
          onClose();
          if (onSuccess) onSuccess();
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
        setErrorMsg('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-[#dfe4d9] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Logo & Close Button */}
        <div className="relative bg-gradient-to-br from-[#e0f5ea] via-[#f0f9f4] to-[#ffffff] p-6 pb-4 border-b border-[#dfe4d9] text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-[#6f7a6c] hover:text-[#181d16] hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-2">
            <div className="p-2 rounded-2xl bg-white shadow-sm ring-1 ring-[#67c76c]/30">
              <RibbonIcon size={36} />
            </div>
          </div>

          <h3 className="text-lg font-black text-[#181d16] tracking-tight">
            {mode === 'login' ? 'Chào mừng bạn trở lại' : 'Tạo tài khoản SoulCare'}
          </h3>
          <p className="text-xs text-[#4a6551] mt-0.5">
            Đồng bộ dữ liệu cảm xúc & lộ trình chăm sóc sức khỏe tinh thần an toàn trên Firebase Cloud
          </p>

          {/* Role selector buttons */}
          <div className="mt-3 grid grid-cols-2 gap-2 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('user');
                audioSynth.playChime(520, 0.15);
              }}
              className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 border transition ${
                selectedRole === 'user'
                  ? 'bg-white text-[#006e22] border-[#006e22] shadow-xs'
                  : 'bg-white/60 text-[#6f7a6c] border-[#dfe4d9]'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Khách Hàng</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('expert');
                audioSynth.playChime(620, 0.15);
              }}
              className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 border transition ${
                selectedRole === 'expert'
                  ? 'bg-white text-[#1976d2] border-[#1976d2] shadow-xs'
                  : 'bg-white/60 text-[#6f7a6c] border-[#dfe4d9]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Chuyên Gia (BS)</span>
            </button>
          </div>

          {/* Mode Switch Tabs */}
          <div className="mt-3 p-1 rounded-2xl bg-[#eaf0e5] grid grid-cols-2 gap-1 max-w-xs mx-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-xl transition ${
                mode === 'login'
                  ? 'bg-white text-[#006e22] shadow-sm'
                  : 'text-[#6f7a6c] hover:text-[#181d16]'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-xl transition ${
                mode === 'register'
                  ? 'bg-white text-[#006e22] shadow-sm'
                  : 'text-[#6f7a6c] hover:text-[#181d16]'
              }`}
            >
              Đăng Ký Mới
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Google Sign-in One-Click (Recommended) */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isSubmitting || loading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#f7faf8] active:scale-[0.98] text-[#181d16] font-bold text-xs border border-[#dfe4d9] shadow-xs flex items-center justify-center gap-3 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>
              {mode === 'login'
                ? `Tiếp tục với Google (${selectedRole === 'expert' ? 'Chuyên gia' : 'Khách hàng'})`
                : `Đăng ký nhanh với Google (${selectedRole === 'expert' ? 'Chuyên gia' : 'Khách hàng'})`}
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#dfe4d9]" />
            <span className="text-[11px] text-[#6f7a6c] font-medium uppercase tracking-wider">
              Hoặc dùng Email
            </span>
            <div className="flex-1 h-px bg-[#dfe4d9]" />
          </div>

          {/* Error Message banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-semibold text-[#181d16] block mb-1">
                  {selectedRole === 'expert' ? 'Họ tên Bác sĩ / Chuyên gia:' : 'Họ và tên của bạn:'}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#6f7a6c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={selectedRole === 'expert' ? 'TS. BS. Nguyễn Minh Anh' : 'Nguyễn Thanh Hà'}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder:text-[#6f7a6c]/60 focus:ring-2 focus:ring-[#006e22] focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-[#181d16] block mb-1">
                Địa chỉ Email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6f7a6c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder:text-[#6f7a6c]/60 focus:ring-2 focus:ring-[#006e22] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#181d16] block mb-1">
                Mật khẩu:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6f7a6c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder:text-[#6f7a6c]/60 focus:ring-2 focus:ring-[#006e22] focus:bg-white focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-[#6f7a6c] hover:text-[#181d16] absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className={`w-full py-3 rounded-2xl text-white font-bold text-xs shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                selectedRole === 'expert'
                  ? 'bg-[#1976d2] hover:bg-[#1565c0]'
                  : 'bg-[#006e22] hover:bg-[#005116]'
              }`}
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : mode === 'login'
                ? `Đăng Nhập (${selectedRole === 'expert' ? 'Chuyên Gia' : 'Khách Hàng'})`
                : `Hoàn Tất Đăng Ký (${selectedRole === 'expert' ? 'Chuyên Gia' : 'Khách Hàng'})`}
            </button>
          </form>

          {/* Privacy & Cloud Trust Footer */}
          <div className="p-3 rounded-2xl bg-[#e0f5ea] border border-[#67c76c]/30 flex items-center gap-2.5 text-[10px] text-[#005116]">
            <ShieldCheck className="w-4 h-4 text-[#006e22] shrink-0" />
            <span>
              Mọi nhật ký tâm lý và radar sức khỏe được bảo mật đa tầng, tuân thủ tiêu chuẩn an toàn dữ liệu y tế.
            </span>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] text-[#6f7a6c] hover:text-[#006e22] font-semibold transition"
            >
              Tiếp tục chế độ dùng thử khách (Offline)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

