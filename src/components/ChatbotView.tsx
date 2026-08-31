import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, QuizResult, MoodEntry, UserChallengeProgress, Appointment, SOSBuddy } from '../types';
import { Send, Sparkles, Wind, Headphones, Calendar, Flame, AlertCircle } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { ChatbotOrbAvatar } from './ChatbotOrbAvatar';
import { querySoulCareCompanion, SoulCareUserContext } from '../utils/aiSoulCompanion';

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
      text: `Chào ${userName || 'bạn'}! Mình là "Hi" - Trợ Lý Tri Kỷ AI của bạn 🌿. Hôm nay trong lòng bạn có điều gì trăn trở hay niềm vui nào muốn tâm sự không? Hi luôn ở đây để lắng nghe bạn.`,
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
      console.error('Lỗi khi truy vấn trợ lý tri kỷ Hi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="flex flex-col h-full w-full flex-1 min-h-0 bg-[#f6fbf0] text-[#181d16] font-sans overflow-hidden">
      {/* Header Banner */}
      <div className="px-4 py-3 bg-[#ffffff]/90 backdrop-blur-md border-b border-[#dfe4d9] flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <ChatbotOrbAvatar size={36} />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#006e22] ring-2 ring-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#181d16] flex items-center gap-1.5">
              Trợ Lý Tri Kỷ SoulCare "Hi"
            </h3>
            <p className="text-[10px] text-[#6f7a6c]">
              Lắng nghe thấu cảm • Cá nhân hóa theo dữ liệu của bạn
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
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
                className={`max-w-[84%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2.5 shadow-sm ${
                  isUser
                    ? 'bg-[#ffffff] text-[#181d16] border border-[#dfe4d9] rounded-tr-none'
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
                    <span>{msg.actionButtonText || '👉 Thử bài tập thở 4-7-8'}</span>
                  </button>
                )}

                {msg.actionFlag === 'NAVIGATE_HEALING_HUB' && (
                  <button
                    type="button"
                    onClick={onNavigateToHealingHub}
                    className="w-full py-2 px-3 rounded-full bg-[#366664] hover:bg-[#2c5351] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{msg.actionButtonText || '🎧 Nghe nhạc 432Hz & Podcast'}</span>
                  </button>
                )}

                {msg.actionFlag === 'NAVIGATE_STREAK' && (
                  <button
                    type="button"
                    onClick={onNavigateToStreak}
                    className="w-full py-2 px-3 rounded-full bg-[#ffffff] hover:bg-slate-50 border border-[#dfe4d9] text-[#006e22] font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{msg.actionButtonText || '🔥 Điểm danh Streak hôm nay'}</span>
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
            <span>Hi đang lắng nghe và suy ngẫm cùng bạn...</span>
          </div>
        )}
        <div className="h-2" />
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-[#f0f5ea]/60">
        {[
          'Hôm nay mình vui lắm á! ✨',
          'Mình đang bị mất ngủ và căng thẳng 😴',
          'Buổi tư vấn đầu tiên 0đ như thế nào? 🩺',
          'Hướng dẫn bài tập thở 4-7-8 giúp mình 🌬️',
        ].map((quick, idx) => (
          <button
            key={`qp-${idx}`}
            type="button"
            onClick={() => handleSendMessage(quick)}
            className="px-3 py-1 rounded-full bg-[#ffffff] border border-[#dfe4d9] text-[10px] text-[#4a6551] hover:text-[#006e22] hover:border-[#67c76c] whitespace-nowrap transition shadow-2xs cursor-pointer active:scale-95"
          >
            {quick}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={onSubmitForm}
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
          className="w-10 h-10 rounded-2xl bg-[#006e22] hover:bg-[#005116] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow-sm shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
