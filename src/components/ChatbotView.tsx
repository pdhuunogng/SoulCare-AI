import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, QuizResult, MoodEntry, UserChallengeProgress, Appointment, SOSBuddy } from '../types';
import { Send, Sparkles, Wind, Headphones, Calendar, Flame, AlertCircle, Heart } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { ChatbotOrbAvatar } from './ChatbotOrbAvatar';

interface ChatbotViewProps {
  userName: string;
  quizResult: QuizResult | null;
  moodMap: MoodEntry[];
  challengeProgress: UserChallengeProgress | null;
  latestAppointment: Appointment | null;
  sosBuddy: SOSBuddy;
  onNavigateToBreathing: () => void;
  onNavigateToHealingHub: () => void;
  onNavigateToBooking: () => void;
  onNavigateToStreak: () => void;
  onViewCarePlans?: () => void;
  onTriggerSOS: () => void;
}

export const ChatbotView: React.FC<ChatbotViewProps> = ({
  userName,
  quizResult,
  moodMap,
  challengeProgress,
  latestAppointment,
  sosBuddy,
  onNavigateToBreathing,
  onNavigateToHealingHub,
  onNavigateToBooking,
  onNavigateToStreak,
  onViewCarePlans,
  onTriggerSOS,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: 'Chào bạn! Mình là "Hi" - Trợ Lý Tri Kỷ AI & Điều Phối Viên Sức Khỏe Tinh Thần của bạn 🌿. Hôm nay bạn cảm thấy thế nào? Hãy cứ thoải mái chia sẻ, Hi luôn ở đây để lắng nghe và đồng hành cùng bạn mà không phán xét.',
      timestamp: 'Vừa xong',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
    const timer = setTimeout(() => {
      scrollToBottom('smooth');
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

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

    // Chuẩn bị Input Context Schema theo quy định
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
      let rawText = data.message_to_user || data.text || 'Hi luôn ở bên cạnh lắng nghe bạn.';
      let actionButtonText = data.action_button_text || null;

      // Handle legacy tag matches if present
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
        text: 'Hi luôn ở bên cạnh lắng nghe bạn. Khi cảm thấy căng thẳng hay ngổn ngang, bạn có muốn thử dành 3 phút hít thở sâu cùng Hi không?',
        timestamp: 'Vừa xong',
        actionFlag: 'NAVIGATE_BREATHING',
        actionButtonText: '👉 Thử bài tập hít thở ngay',
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full flex-1 min-h-0 bg-[#f6fbf0] text-[#181d16] font-sans overflow-hidden">
      {/* Chat Top Banner */}
      <div className="px-4 py-3 bg-[#ffffff]/90 backdrop-blur-md border-b border-[#dfe4d9] flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <ChatbotOrbAvatar size={36} />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#006e22] ring-2 ring-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#181d16] flex items-center gap-1.5">
              SoulCare
            </h3>
            <p className="text-[10px] text-[#6f7a6c]">
              Bảo mật tuyệt đối
            </p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 overscroll-contain"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in`}
            >
              {!isUser && (
                <div className="shrink-0 mt-0.5">
                  <ChatbotOrbAvatar size={28} />
                </div>
              )}

              <div
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2.5 shadow-sm ${
                  isUser
                    ? 'bg-[#ffffff] text-[#181d16] border border-[#dfe4d9] rounded-tr-none shadow-sm'
                    : msg.isCrisis
                    ? 'bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#93000a] rounded-tl-none'
                    : 'bg-gradient-to-br from-[#e0f5ea] to-[#d7f5eb] border border-[#67c76c]/30 text-[#181d16] rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Render Interactive Action Buttons */}
                {msg.actionFlag === 'NAVIGATE_BREATHING' && (
                  <button
                    type="button"
                    onClick={onNavigateToBreathing}
                    className="w-full py-2 px-3 rounded-full bg-[#006e22] hover:bg-[#005116] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>{msg.actionButtonText || '👉 Thử bài tập hít thở ngay'}</span>
                  </button>
                )}

                {msg.actionFlag === 'NAVIGATE_HEALING_HUB' && (
                  <button
                    type="button"
                    onClick={onNavigateToHealingHub}
                    className="w-full py-2 px-3 rounded-full bg-[#366664] hover:bg-[#2c5351] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{msg.actionButtonText || '👉 Mở Góc Âm Thanh & Podcast'}</span>
                  </button>
                )}

                {msg.actionFlag === 'NAVIGATE_STREAK' && (
                  <button
                    type="button"
                    onClick={onNavigateToStreak}
                    className="w-full py-2 px-3 rounded-full bg-[#ffffff] hover:bg-slate-50 border border-[#dfe4d9] text-[#006e22] font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{msg.actionButtonText || '🔥 Điểm danh Streak Thử thách hôm nay'}</span>
                  </button>
                )}

                {(msg.actionFlag === 'NAVIGATE_BOOKING' || msg.actionFlag === 'NAVIGATE_BOOKING_FREE') && (
                  <button
                    type="button"
                    onClick={onNavigateToBooking}
                    className="w-full py-2 px-3 rounded-full bg-[#006e22] hover:bg-[#005116] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{msg.actionButtonText || '👉 Đặt Lịch Tư Vấn 0đ'}</span>
                  </button>
                )}

                {msg.actionFlag === 'VIEW_CARE_PLANS' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewCarePlans) {
                        onViewCarePlans();
                      } else {
                        onNavigateToBooking();
                      }
                    }}
                    className="w-full py-2 px-3 rounded-full bg-[#006e22] hover:bg-[#005116] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{msg.actionButtonText || '👉 Xem Lộ Trình Đề Xuất'}</span>
                  </button>
                )}

                {(msg.actionFlag === 'TRIGGER_SOS' || msg.actionFlag === 'TRIGGER_SOS_DRAWER') && (
                  <button
                    type="button"
                    onClick={onTriggerSOS}
                    className="w-full py-2 px-3 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-md"
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
            <ChatbotOrbAvatar size={24} isPulsing={true} />
            <span>Hi đang lắng nghe và suy ngẫm...</span>
          </div>
        )}
        <div className="h-2" />
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-[#f0f5ea]/60">
        {[
          'Buổi tư vấn đầu tiên 0đ như thế nào?',
          'Tư vấn giúp mình lộ trình điều trị',
          'Hôm nay mình bị mất ngủ và căng thẳng',
          'Giải thích giúp mình về bài tập thở',
        ].map((quick, idx) => (
          <button
            key={`qp-${idx}`}
            type="button"
            onClick={() => {
              setInputText(quick);
            }}
            className="px-3 py-1 rounded-full bg-[#ffffff] border border-[#dfe4d9] text-[10px] text-[#4a6551] hover:text-[#006e22] hover:border-[#67c76c] whitespace-nowrap transition shadow-2xs"
          >
            {quick}
          </button>
        ))}
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
          placeholder="Tâm sự cùng Hi (bảo mật tuyệt đối)..."
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
  );
};
