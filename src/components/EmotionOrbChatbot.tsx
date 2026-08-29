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
import { DraggableVerticalFloat } from './DraggableVerticalFloat';

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

  // Sync when prop changes
  useEffect(() => {
    if (currentOrbTheme && currentOrbTheme !== activeThemeRef.current) {
      setActiveTheme(currentOrbTheme);
    }
  }, [currentOrbTheme]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: 'Chào bạn! Mình là "Hi" - Trợ Lý Tri Kỷ AI & Điều Phối Viên Sức Khỏe Tinh Thần của bạn 🌿.\n\nHôm nay trong lòng bạn có điều gì trăn trở hay muốn tâm sự không? Mình luôn ở đây để lắng nghe bạn.',
      timestamp: 'Vừa xong',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-cycle colors randomly every 6 seconds safely outside of updater
  useEffect(() => {
    const themes: OrbThemeColor[] = ['mint', 'amber', 'lavender', 'rose', 'ocean'];
    const timer = setInterval(() => {
      const current = activeThemeRef.current;
      const others = themes.filter((t) => t !== current);
      const next = others[Math.floor(Math.random() * others.length)];
      setActiveTheme(next);
      onChangeOrbTheme?.(next);
    }, 6000);
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const moodHistorySummary = moodMap.map((m) => `${m.dayLabel}: ${m.emotion}`).join(', ');
    const userContext = {
      user_name: userName || 'Bạn',
      quiz_radar_summary: `Trầm cảm: ${quizResult?.depressionPct ?? 35}%, Lo âu: ${quizResult?.anxietyPct ?? 45}%, Căng thẳng: ${quizResult?.stressPct ?? 55}%, Giấc ngủ: ${quizResult?.sleepPct ?? 60}%`,
      mood_history_7days: moodHistorySummary,
      active_challenge: `${challengeProgress?.challengeTitle ?? '21 Ngày Tái Thiết Giấc Ngủ & Thư Giãn'} (Streak: ${challengeProgress?.currentStreak ?? 0} ngày)`,
      free_session_status: latestAppointment?.status === 'completed' ? 'COMPLETED' : 'AVAILABLE',
      latest_expert_recap: {
        expert_name: latestAppointment?.expertName ?? 'Chuyên gia Tâm lý',
        recommended_plan: latestAppointment?.status === 'completed' ? 'UNTANGLE_3S' : 'STARTER_FREE',
        doctor_notes_summary: latestAppointment?.doctorRecap?.formattedRecap ?? 'Chưa có buổi tư vấn',
      },
      sos_buddy_name: sosBuddy.name || 'Người thân',
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          userContext,
          history: messages.slice(-4),
        }),
      });

      const data = await res.json();
      let actionFlag: ChatMessage['actionFlag'] = (data.suggested_action as ChatMessage['actionFlag']) || undefined;
      let rawText = data.message_to_user || data.text || 'Hi luôn lắng nghe và đồng hành cùng bạn.';
      let actionButtonText = data.action_button_text || null;

      if (rawText.includes('[ACTION: TRIGGER_SOS_DRAWER]') || rawText.includes('[TRIGGER_SOS_DRAWER = TRUE]') || data.triggerSOS || actionFlag === 'TRIGGER_SOS') {
        actionFlag = 'TRIGGER_SOS';
        rawText = rawText.replace(/\[ACTION: TRIGGER_SOS_DRAWER\]|\[TRIGGER_SOS_DRAWER = TRUE\]/g, '');
        onTriggerSOS();
      } else if (rawText.includes('[ACTION: NAVIGATE_BOOKING_FREE]')) {
        actionFlag = 'NAVIGATE_BOOKING_FREE';
        rawText = rawText.replace('[ACTION: NAVIGATE_BOOKING_FREE]', '');
      } else if (rawText.includes('[ACTION: VIEW_CARE_PLANS]')) {
        actionFlag = 'VIEW_CARE_PLANS';
        rawText = rawText.replace('[ACTION: VIEW_CARE_PLANS]', '');
      } else if (rawText.includes('[ACTION: NAVIGATE_BREATHING]')) {
        actionFlag = 'NAVIGATE_BREATHING';
        rawText = rawText.replace('[ACTION: NAVIGATE_BREATHING]', '');
      } else if (rawText.includes('[ACTION: NAVIGATE_HEALING_HUB]')) {
        actionFlag = 'NAVIGATE_HEALING_HUB';
        rawText = rawText.replace('[ACTION: NAVIGATE_HEALING_HUB]', '');
      } else if (rawText.includes('[ACTION: NAVIGATE_BOOKING]')) {
        actionFlag = 'NAVIGATE_BOOKING';
        rawText = rawText.replace('[ACTION: NAVIGATE_BOOKING]', '');
      }

      if (actionFlag === 'TRIGGER_SOS' || actionFlag === 'TRIGGER_SOS_DRAWER') {
        onTriggerSOS();
      }

      const botReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: rawText.trim(),
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actionFlag,
        actionButtonText,
        contextInsight: data.context_insight,
        isCrisis: data.isCrisis || actionFlag === 'TRIGGER_SOS' || actionFlag === 'TRIGGER_SOS_DRAWER',
      };

      setMessages((prev) => [...prev, botReply]);
      audioSynth.playChime(528, 0.5);
    } catch {
      const fallbackReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: 'Hi luôn ở bên cạnh bạn. Bạn có muốn thử một bài tập thở 3 phút để thư giãn không?',
        timestamp: 'Vừa xong',
        actionFlag: 'NAVIGATE_BREATHING',
        actionButtonText: '👉 Thử bài tập hít thở ngay',
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const themeConfig = ORB_THEMES[activeTheme] || ORB_THEMES.mint;

  return (
    <>
      {/* 1. FLOATING EMOTION ORB BUTTON (WITH VERTICAL DRAG CONTROL) */}
      {!isOpen && (
        <DraggableVerticalFloat
          side="right"
          storageKey="soulcare_orb_float_pos_y"
          tooltip="Quả Cầu Cảm Xúc AI - Chạm để trò chuyện"
          onClick={() => {
            audioSynth.playChime(580, 0.3);
            onToggleOpen(true);
          }}
        >
          <div
            className="group relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95 focus:outline-none drop-shadow-lg"
            title="Quả Cầu Cảm Xúc AI - Chạm để trò chuyện"
          >
            <CrystalGlassOrb
              theme={activeTheme}
              size="md"
              showStand={false}
              interactive={false}
              showGlow={true}
            />

            <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-[#ffffff] text-[#006e22] text-[9px] font-extrabold border border-[#67c76c]/40 shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006e22] animate-ping" />
              AI
            </span>
          </div>
        </DraggableVerticalFloat>
      )}

      {/* 2. FLOATING OVERLAY CHATBOT MODAL (LIGHT THEME) */}
      {isOpen && (
        <div className="absolute inset-0 z-50 bg-[#181d16]/40 backdrop-blur-sm flex flex-col justify-end animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="w-full h-[88%] bg-[#ffffff] border-t border-[#dfe4d9] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden relative text-[#181d16]">
            {/* Top Glass Header */}
            <div className="px-4 py-3 bg-[#f7faf8] border-b border-[#dfe4d9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <CrystalGlassOrb theme={activeTheme} size="sm" showGlow={false} />

                <div>
                  <h3 className="text-xs font-bold text-[#181d16] flex items-center gap-1.5">
                    Quả Cầu Cảm Xúc SoulCare
                    <span className="text-[9px] px-2 py-0.2 rounded-full font-bold bg-[#e0f5ea] text-[#006e22] border border-[#67c76c]/30">
                      {themeConfig.name.split(' ')[0]}
                    </span>
                  </h3>
                  <p className="text-[10px] text-[#6f7a6c]">
                    Lắng nghe thấu cảm • Chuyển sắc tự nhiên • Bảo mật y tế
                  </p>
                </div>
              </div>

              {/* Close Tool */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playChime(420, 0.15);
                    onToggleOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-[#ffffff] hover:bg-[#eaf0e5] text-[#181d16] flex items-center justify-center transition border border-[#dfe4d9] shadow-sm"
                  title="Thu nhỏ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
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

                      {/* Interactive Action Triggers in Chat */}
                      {msg.actionFlag === 'NAVIGATE_BREATHING' && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onNavigateToBreathing();
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#006e22] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <Wind className="w-3.5 h-3.5" />
                          <span>Tập thở 4-7-8</span>
                        </button>
                      )}

                      {msg.actionFlag === 'NAVIGATE_HEALING_HUB' && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onNavigateToHealingHub();
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#366664] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span>Sóng não 432Hz</span>
                        </button>
                      )}

                      {msg.actionFlag === 'NAVIGATE_STREAK' && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onNavigateToStreak();
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#ffffff] border border-[#dfe4d9] text-[#006e22] font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>Điểm danh Streak</span>
                        </button>
                      )}

                      {(msg.actionFlag === 'NAVIGATE_BOOKING' || msg.actionFlag === 'NAVIGATE_BOOKING_FREE') && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onNavigateToBooking();
                          }}
                          className="w-full py-2 px-3 rounded-full bg-[#006e22] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
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
                          className="w-full py-2 px-3 rounded-full bg-[#006e22] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
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
                          className="w-full py-2 px-3 rounded-full bg-[#ba1a1a] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{msg.actionButtonText || '🚨 Mở Khay Cứu Hộ SOS'}</span>
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
                  <span>SoulCare đang lắng nghe và suy ngẫm...</span>
                </div>
              )}
              <div className="h-2" />
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[#ffffff] border-t border-[#dfe4d9] flex items-center gap-2 shrink-0 shadow-sm"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tâm sự cùng SoulCare..."
                className="flex-1 py-2.5 px-4 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder-[#6f7a6c]/60 focus:outline-none focus:ring-2 focus:ring-[#006e22]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="w-10 h-10 rounded-2xl bg-[#006e22] hover:bg-[#005116] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow-sm shrink-0"
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
