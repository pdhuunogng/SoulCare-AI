import React from 'react';
import { PlatformType, UserRole } from '../types';
import {
  Smartphone,
  Apple,
  Monitor,
  Wifi,
  Battery,
  Signal,
  Home,
  MessageCircle,
  Headphones,
  Calendar,
  User,
  Stethoscope,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { RibbonIcon } from './RibbonIcon';
import { OrbThemeColor } from './CrystalGlassOrb';

interface DeviceFrameProps {
  platform: PlatformType;
  onPlatformChange: (p: PlatformType) => void;
  currentTab: 'home' | 'chat' | 'healing' | 'booking' | 'profile' | 'expert-dash';
  onTabChange: (tab: 'home' | 'chat' | 'healing' | 'booking' | 'profile' | 'expert-dash') => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  children: React.ReactNode;
  currentOrbTheme?: OrbThemeColor;
  hideNav?: boolean;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  platform,
  onPlatformChange,
  currentTab,
  onTabChange,
  role,
  onRoleChange,
  children,
  currentOrbTheme = 'mint',
  hideNav = false,
}) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-2 md:p-6 select-none font-sans">
      {/* Top Platform Switcher Header */}
      <header className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 mb-4 px-4 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative shadow-md rounded-xl overflow-hidden flex items-center justify-center">
            <RibbonIcon size={36} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>SoulCare</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                SoulCare Crystal Orb
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-normal">
              Bảng màu Trắng & Xanh Lá • Font Be Vietnam Pro • Không gian chữa lành thấu cảm
            </p>
          </div>
        </div>

        {/* Device Switcher Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => onPlatformChange('ios')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                platform === 'ios'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iOS</span>
            </button>

            <button
              type="button"
              onClick={() => onPlatformChange('android')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                platform === 'android'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Android</span>
            </button>

            <button
              type="button"
              onClick={() => onPlatformChange('responsive')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                platform === 'responsive'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Mở rộng</span>
            </button>
          </div>
      </header>

      {/* Frame Container */}
      {platform === 'responsive' ? (
        <main className="w-full max-w-4xl bg-[#f6fbf0] text-[#181d16] rounded-3xl border border-[#dfe4d9] shadow-2xl overflow-hidden min-h-[85vh] flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto">{children}</div>

          {/* Bottom Navigation for Responsive */}
          {!hideNav && (
            <nav className="w-full bg-[#ffffff]/90 backdrop-blur-md border-t border-[#dfe4d9] px-6 py-2.5 flex items-center justify-around z-30">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      audioSynth.playChime(520, 0.15);
                      onTabChange(item.id as any);
                    }}
                    className={`flex items-center gap-2 py-2 px-5 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'text-[#005116] bg-[#d6f5df] font-bold shadow-sm ring-1 ring-[#67c76c]/40 scale-[1.02]'
                        : 'text-[#4a6551] hover:text-[#181d16] hover:bg-[#eaf0e5]/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#006e22] stroke-[2.5]' : 'text-[#4a6551]'}`} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </main>
      ) : (
        <div
          className={`relative transition-all duration-300 w-full max-w-[420px] rounded-[52px] p-3 shadow-2xl border ${
            platform === 'ios'
              ? 'bg-slate-900 border-slate-700 ring-8 ring-slate-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
              : 'bg-slate-900 border-emerald-950/60 ring-8 ring-slate-800/70 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
          }`}
        >
          {/* Inner Phone Screen (Light White & Green Theme) */}
          <div className="relative w-full h-[844px] bg-[#f6fbf0] text-[#181d16] rounded-[42px] overflow-hidden flex flex-col border border-[#dfe4d9]/80 shadow-inner">
            {/* Status Bar */}
            <div className="w-full h-11 px-7 flex items-center justify-between text-xs font-semibold text-[#3f4a3d] z-30 shrink-0 select-none bg-[#f6fbf0]/80 backdrop-blur-sm border-b border-[#dfe4d9]/40">
              <span className="font-semibold">9:41</span>

              {/* Dynamic Island for iOS / Camera Punch Hole for Android */}
              {platform === 'ios' ? (
                <div className="h-6 w-28 bg-[#181d16] rounded-full flex items-center justify-between px-2.5 mx-auto text-[10px] text-white">
                  <div className="w-2 h-2 rounded-full bg-[#67c76c] animate-pulse" />
                  <span className="text-[9px] font-mono tracking-tighter text-white/90">SoulCare</span>
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-[#181d16] mx-auto ring-1 ring-white/20" />
              )}

              <div className="flex items-center gap-1.5 text-[#3f4a3d]">
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4 text-[#006e22]" />
              </div>
            </div>

            {/* App viewport */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative bg-[#f6fbf0]">
              {children}
            </div>

            {/* Bottom Navigation Bar (Stitch Rounded Soft Pill Style) */}
            {!hideNav && (
              <nav className="w-full bg-[#ffffff]/92 backdrop-blur-md border-t border-[#dfe4d9] px-2 py-2 flex items-center justify-around z-30 shrink-0 shadow-sm">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        audioSynth.playChime(520, 0.15);
                        onTabChange(item.id as any);
                      }}
                      className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? 'bg-[#d6f5df] text-[#005116] font-bold scale-105 shadow-sm border border-[#67c76c]/30'
                          : 'text-[#4a6551] hover:text-[#181d16]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#006e22] stroke-[2.5]' : 'text-[#4a6551]'}`} />
                      <span className={`text-[10px] tracking-tight ${isActive ? 'text-[#005116] font-black' : 'text-[#4a6551] font-medium'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Bottom Home Indicator */}
            <div className="w-full h-4 flex items-center justify-center shrink-0 z-30 bg-[#ffffff]">
              {platform === 'ios' ? (
                <div className="w-32 h-1 bg-[#181d16]/30 rounded-full" />
              ) : (
                <div className="w-20 h-1 bg-[#181d16]/20 rounded-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
