import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  QuizResult,
  MoodEntry,
  UserChallengeProgress,
  Appointment,
  SOSBuddy,
} from '../types';
import {
  Send,
  Sparkles,
  Wind,
  Headphones,
  Calendar,
  Flame,
  AlertCircle,
  X,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { CrystalGlassOrb, OrbThemeColor, ORB_THEMES } from './CrystalGlassOrb';
import { querySoulCareCompanion, SoulCareUserContext } from '../utils/aiSoulCompanion';

interface EmotionOrbChatbotProps {
  userName: string;
  quizResult: QuizResult | null;
  moodMap: MoodEntry[];
  challengeProgress: UserChallengeProgress | null;
  latestAppointment: Appointment | null;
  sosBuddy: SOSBuddy;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  onNavigateToBreathing: () => void;
  onNavigateToHealingHub: () => void;
  onNavigateToBooking: () => void;
  onNavigateToStreak: () => void;
  onViewCarePlans?: () => void;
  onTriggerSOS: () => void;
  currentOrbTheme?: OrbThemeColor;
  onChangeOrbTheme?: (theme: OrbThemeColor) => void;
}

export const EmotionOrbChatbot: React.FC<EmotionOrbChatbotProps> = ({
  userName,
  quizResult,
  moodMap,
  challengeProgress,
  latestAppointment,
  sosBuddy,
  isOpen,
  onToggleOpen,
  onNavigateToBreathing,
  onNavigateToHealingHub,
  onNavigateToBooking,
  onNavigateToStreak,
  onViewCarePlans,
  onTriggerSOS,
  currentOrbTheme = 'mint',
  onChangeOrbTheme,
}) => {
  const [activeTheme, setActiveTheme] = useState<OrbThemeColor>(currentOrbTheme);
  const activeThemeRef = useRef<OrbThemeColor>(activeTheme);
  activeThemeRef.current = activeTheme;

  const [orbBottom, setOrbBottom] = useState<number>(80);
  const isDraggingOrb = useRef(false);
  const dragStartY = useRef(0);
  const startBottomY = useRef(80);
  const hasMovedSignificant = useRef(false);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingOrb.current = true;
    hasMovedSignificant.current = false;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    startBottomY.current = orbBottom;
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingOrb.current) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deltaY = dragStartY.current - clientY;

      if (Math.abs(deltaY) > 5) {
        hasMovedSignificant.current = true;
      }

      const newBottom = Math.max(70, Math.min(650, startBottomY.current + deltaY));
      setOrbBottom(newBottom);
    };

    const handleDragEnd = () => {
      isDraggingOrb.current = false;
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [orbBottom]);

  useEffect(() => {
    if (currentOrbTheme && currentOrbTheme !== activeThemeRef.current) {
      setActiveTheme(currentOrbTheme);
    }
  }, [currentOrbTheme]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: `Chào ${userName || 'bạn'}! Mình là "Hi" - Quả Cầu Tri Kỷ AI 🌿.\n\nHôm nay trong lòng bạn có điều gì trăn trở hay niềm vui nào muốn tâm sự không? Hi luôn ở đây để lắng nghe bạn.`,
      timestamp: 'Vừa xong',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const themes: OrbThemeColor[] = ['mint', 'amber', 'lavender', 'rose', 'ocean'];
    const timer = setInterval(() => {
      const current = activeThemeRef.current;
      const others = themes.filter((t) => t !== current);
      const next = others[Math.floor(Math.random() * others.length)];
      setActiveTheme(next);
      onChangeOrbTheme?.(next);
    }, 8000);
    return () => clearInterval(timer);
  }, [onChangeOrbTheme]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('auto');
      const timer = setTimeout(() => {
        scrollToBottom('smooth');
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const companionContext: SoulCareUserContext = {
      userName: userName || 'Bạn',
      quizResult,
      moodMap,
      challengeProgress,
      latestAppointment,
      sosBuddy,
    };

    try {
      const reply = await querySoulCareCompanion(text, companionContext, messages);

      if (reply.actionFlag === 'TRIGGER_SOS' || reply.isCrisis) {
        onTriggerSOS();
      }

      const botReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: reply.text,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actionFlag: reply.actionFlag === 'NONE' ? undefined : reply.actionFlag,
        actionButtonText: reply.actionButtonText,
        contextInsight: reply.contextInsight,
        isCrisis: Boolean(reply.isCrisis || reply.actionFlag === 'TRIGGER_SOS'),
      };

      setMessages((prev) => [...prev, botReply]);
      audioSynth.playChime(528, 0.4);
    } catch (err) {
      console.error('Lỗi khi chat qua Quả Cầu Tri Kỷ:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const themeConfig = ORB_THEMES[activeTheme] || ORB_THEMES.mint;

  return (
    <>
      {/* 1. QUẢ CẦU NỔI */}
      {!isOpen && (
        <div
          style={{ bottom: `${orbBottom}px` }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="fixed right-3.5 z-40 flex items-center gap-2 touch-none select-none cursor-grab active:cursor-grabbing animate-in fade-in zoom-in-75"
        >
          <button
            type="button"
            onClick={() => {
              if (!hasMovedSignificant.current) {
                audioSynth.playChime(580, 0.3);
                onToggleOpen(true);
              }
            }}
            className="group relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none drop-shadow-lg"
            title="Quả Cầu Cảm Xúc AI - Nhấn giữ để kéo lên/xuống • Chạm để trò chuyện"
          >
            <CrystalGlassOrb
              theme={activeTheme}
              size="md"
              showStand={false}
              interactive={false}
              showGlow={true}
            />

            <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-[#ffffff] text-[#006e22] text-[9px] font-extrabold border border-[#67c76c]/40 shadow-sm flex items-center gap-1 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006e22] animate-ping" />
              AI
            </span>
          </button>
        </div>
      )}

      {/* 2. KHUNG CHAT POPUP */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#181d16]/40 backdrop-blur-sm flex flex-col justify-end animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="w-full max-w-2xl mx-auto h-[88vh] bg-[#ffffff] border-t border-[#dfe4d9] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden relative text-[#181d16]">
            {/* Header */}
            <div className="px-4 py-3.5 bg-[#f7faf8] border-b border-[#dfe4d9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <CrystalGlassOrb theme={activeTheme} size="sm" showGlow={false} />

                <div>
                  <h3 className="text-xs font-bold text-[#181d16] flex items-center gap-1.5">
                    Trợ Lý Tri Kỷ SoulCare "Hi"
                    <span className="text-[9px] px-2 py-0.2 rounded-full font-bold bg-[#e0f5ea] text-[#006e22] border border-[#67c76c]/30">
                      {themeConfig.name.split(' ')[0]}
                    </span>
                  </h3>
                  <p className="text-[10px] text-[#6f7a6c]">
                    Lắng nghe thấu cảm • Cá nhân hóa theo dữ liệu của bạn
                  </p>
                </div>
              </div>

              {/* Nút đóng */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playChime(420, 0.15);
                    onToggleOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-[#ffffff] hover:bg-[#eaf0e5] text-[#181d16] flex items-center justify-center transition border border-[#dfe4d9] shadow-sm cursor-pointer"
                  title="Thu nhỏ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Danh sách tin nhắn */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-[#f6fbf0]"
            >
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    } animate-in fade-in`}
                  >
                    {!isUser && (
                      <div className="shrink-0 mt-0.5">
                        <CrystalGlassOrb theme={activeTheme} size="xs" showGlow={false} />
                      </div>
                    )}

                    <div
                      className={`max-w-[84%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2.5 shadow-sm ${
                        isUser
                          ? 'bg-[#ffffff] text-[#181d16] border border-[#dfe4d9] rounded-tr-none'
                          : msg.isCrisis
                          ? 'bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#93000a] rounded-tl-none'
                          : 'bg-gradient-to-br from-[#e0f5ea] to-[#d7f5eb] border border-[#67c76c]/30 text-[#181d16] rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Interactive Action Buttons */}
                      {msg.actionFlag === 'NAVIGATE_BREATHING' && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onNavigateToBreathing();
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#006e22] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
                        >
                          <Wind className="w-3.5 h-3.5" />
                          <span>{msg.actionButtonText || '👉 Thử bài tập thở 4-7-8'}</span>
                        </button>
                      )}

                      {msg.actionFlag === 'NAVIGATE_HEALING_HUB' && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onNavigateToHealingHub();
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#366664] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span>{msg.actionButtonText || '🎧 Nghe nhạc 432Hz & Podcast'}</span>
                        </button>
                      )}

                      {msg.actionFlag === 'NAVIGATE_STREAK' && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onNavigateToStreak();
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#ffffff] border border-[#dfe4d9] text-[#006e22] font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>{msg.actionButtonText || '🔥 Điểm danh Streak hôm nay'}</span>
                        </button>
                      )}

                      {(msg.actionFlag === 'NAVIGATE_BOOKING' || msg.actionFlag === 'NAVIGATE_BOOKING_FREE') && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onNavigateToBooking();
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#006e22] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{msg.actionButtonText || '👉 Đặt Lịch Tư Vấn 0đ'}</span>
                        </button>
                      )}

                      {msg.actionFlag === 'VIEW_CARE_PLANS' && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            if (onViewCarePlans) {
                              onViewCarePlans();
                            } else {
                              onNavigateToBooking();
                            }
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#006e22] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{msg.actionButtonText || '👉 Xem Lộ Trình Đề Xuất'}</span>
                        </button>
                      )}

                      {(msg.actionFlag === 'TRIGGER_SOS' || msg.actionFlag === 'TRIGGER_SOS_DRAWER') && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onTriggerSOS();
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#ba1a1a] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{msg.actionButtonText || '🚨 Mở Khay Cứu Hộ SOS Khẩn Cấp'}</span>
                        </button>
                      )}

                      <div className="text-[9px] text-[#6f7a6c] text-right">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-[#4a6551] text-xs italic">
                  <CrystalGlassOrb theme={activeTheme} size="xs" showGlow={false} />
                  <span>Hi đang lắng nghe và suy ngẫm cùng bạn...</span>
                </div>
              )}
              <div className="h-2" />
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Quick Prompts */}
            <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-[#f0f5ea]/60">
              {[
                'Hôm nay mình vui lắm! ✨',
                'Mình bị khó ngủ và áp lực 😴',
                'Buổi tư vấn 0đ thế nào? 🩺',
                'Tập thở 4-7-8 giúp mình 🌬️',
              ].map((quick, idx) => (
                <button
                  key={`orb-qp-${idx}`}
                  type="button"
                  onClick={() => handleSendMessage(quick)}
                  className="px-2.5 py-1 rounded-full bg-[#ffffff] border border-[#dfe4d9] text-[10px] text-[#4a6551] hover:text-[#006e22] hover:border-[#67c76c] whitespace-nowrap transition shadow-2xs cursor-pointer active:scale-95"
                >
                  {quick}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={onSubmitForm}
              className="p-3 bg-[#ffffff] border-t border-[#dfe4d9] flex items-center gap-2 shrink-0 shadow-sm"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Chia sẻ cùng Hi về cảm xúc của bạn..."
                className="flex-1 py-2.5 px-4 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder-[#6f7a6c]/60 focus:outline-none focus:ring-2 focus:ring-[#006e22]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="w-10 h-10 rounded-2xl bg-[#006e22] hover:bg-[#005116] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow-sm shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
