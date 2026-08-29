import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_SOUND_TRACKS, INITIAL_PODCASTS } from '../data/initialData';
import { SoundTrack, PodcastItem } from '../types';
import { audioSynth } from '../utils/audioSynth';
import {
  Play,
  Pause,
  Wind,
  Headphones,
  Radio,
  Sparkles,
  ShieldCheck,
  Youtube,
  Bot,
  X,
  Activity,
  Mic,
  Timer,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';

// Emotion theme palettes for music & podcast cards
const TRACK_EMOTION_THEMES: Record<
  string,
  {
    bgGradient: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    playBg: string;
    playText: string;
    activeRing: string;
  }
> = {
  'snd-1': {
    bgGradient: 'bg-gradient-to-br from-[#e0f5ea] via-[#f0faf4] to-[#cbf0dc]/70',
    border: 'border-[#67c76c]/40 hover:border-[#67c76c]',
    badgeBg: 'bg-[#e0f5ea]',
    badgeText: 'text-[#006e22]',
    badgeBorder: 'border-[#67c76c]/40',
    playBg: 'bg-[#e0f5ea]',
    playText: 'text-[#006e22]',
    activeRing: 'ring-[#006e22]',
  },
  'snd-5': {
    bgGradient: 'bg-gradient-to-br from-[#fef7d8] via-[#fffde6] to-[#e6f9e6]/70',
    border: 'border-[#f59e0b]/40 hover:border-[#f59e0b]',
    badgeBg: 'bg-[#fef3c7]',
    badgeText: 'text-[#b45309]',
    badgeBorder: 'border-[#f59e0b]/40',
    playBg: 'bg-[#fef3c7]',
    playText: 'text-[#b45309]',
    activeRing: 'ring-[#b45309]',
  },
  'snd-8': {
    bgGradient: 'bg-gradient-to-br from-[#ffedd5] via-[#fff7ed] to-[#fed7aa]/60',
    border: 'border-[#f97316]/40 hover:border-[#f97316]',
    badgeBg: 'bg-[#ffedd5]',
    badgeText: 'text-[#c2410c]',
    badgeBorder: 'border-[#f97316]/40',
    playBg: 'bg-[#ffedd5]',
    playText: 'text-[#c2410c]',
    activeRing: 'ring-[#c2410c]',
  },
  'snd-10': {
    bgGradient: 'bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#dbeafe]/70',
    border: 'border-[#3b82f6]/40 hover:border-[#3b82f6]',
    badgeBg: 'bg-[#e0f2fe]',
    badgeText: 'text-[#1d4ed8]',
    badgeBorder: 'border-[#3b82f6]/40',
    playBg: 'bg-[#e0f2fe]',
    playText: 'text-[#1d4ed8]',
    activeRing: 'ring-[#1d4ed8]',
  },
  'snd-2': {
    bgGradient: 'bg-gradient-to-br from-[#e0e7ff] via-[#eef2ff] to-[#ede9fe]/70',
    border: 'border-[#6366f1]/40 hover:border-[#6366f1]',
    badgeBg: 'bg-[#e0e7ff]',
    badgeText: 'text-[#4338ca]',
    badgeBorder: 'border-[#6366f1]/40',
    playBg: 'bg-[#e0e7ff]',
    playText: 'text-[#4338ca]',
    activeRing: 'ring-[#4338ca]',
  },
  'snd-6': {
    bgGradient: 'bg-gradient-to-br from-[#e0f7fa] via-[#f0fbfd] to-[#e1f5fe]/70',
    border: 'border-[#06b6d4]/40 hover:border-[#06b6d4]',
    badgeBg: 'bg-[#e0f7fa]',
    badgeText: 'text-[#0e7490]',
    badgeBorder: 'border-[#06b6d4]/40',
    playBg: 'bg-[#e0f7fa]',
    playText: 'text-[#0e7490]',
    activeRing: 'ring-[#0e7490]',
  },
  'snd-9': {
    bgGradient: 'bg-gradient-to-br from-[#f3e8ff] via-[#faf5ff] to-[#ede9fe]/70',
    border: 'border-[#a855f7]/40 hover:border-[#a855f7]',
    badgeBg: 'bg-[#f3e8ff]',
    badgeText: 'text-[#7e22ce]',
    badgeBorder: 'border-[#a855f7]/40',
    playBg: 'bg-[#f3e8ff]',
    playText: 'text-[#7e22ce]',
    activeRing: 'ring-[#7e22ce]',
  },
  'snd-11': {
    bgGradient: 'bg-gradient-to-br from-[#ccfbf1] via-[#f0fdfa] to-[#d1fae5]/70',
    border: 'border-[#14b8a6]/40 hover:border-[#14b8a6]',
    badgeBg: 'bg-[#ccfbf1]',
    badgeText: 'text-[#0f766e]',
    badgeBorder: 'border-[#14b8a6]/40',
    playBg: 'bg-[#ccfbf1]',
    playText: 'text-[#0f766e]',
    activeRing: 'ring-[#0f766e]',
  },
  'snd-3': {
    bgGradient: 'bg-gradient-to-br from-[#ecfccb] via-[#f7fee7] to-[#dcfce7]/70',
    border: 'border-[#84cc16]/40 hover:border-[#84cc16]',
    badgeBg: 'bg-[#ecfccb]',
    badgeText: 'text-[#4d7c0f]',
    badgeBorder: 'border-[#84cc16]/40',
    playBg: 'bg-[#ecfccb]',
    playText: 'text-[#4d7c0f]',
    activeRing: 'ring-[#4d7c0f]',
  },
  'snd-7': {
    bgGradient: 'bg-gradient-to-br from-[#fef3c7] via-[#fffbeb] to-[#fed7aa]/60',
    border: 'border-[#d97706]/40 hover:border-[#d97706]',
    badgeBg: 'bg-[#fef3c7]',
    badgeText: 'text-[#92400e]',
    badgeBorder: 'border-[#d97706]/40',
    playBg: 'bg-[#fef3c7]',
    playText: 'text-[#92400e]',
    activeRing: 'ring-[#92400e]',
  },
  'snd-12': {
    bgGradient: 'bg-gradient-to-br from-[#fae8ff] via-[#fdf4ff] to-[#fce7f3]/70',
    border: 'border-[#d946ef]/40 hover:border-[#d946ef]',
    badgeBg: 'bg-[#fae8ff]',
    badgeText: 'text-[#a21caf]',
    badgeBorder: 'border-[#d946ef]/40',
    playBg: 'bg-[#fae8ff]',
    playText: 'text-[#a21caf]',
    activeRing: 'ring-[#a21caf]',
  },
  'snd-4': {
    bgGradient: 'bg-gradient-to-br from-[#ede9fe] via-[#f5f3ff] to-[#fae8ff]/70',
    border: 'border-[#8b5cf6]/40 hover:border-[#8b5cf6]',
    badgeBg: 'bg-[#ede9fe]',
    badgeText: 'text-[#6d28d9]',
    badgeBorder: 'border-[#8b5cf6]/40',
    playBg: 'bg-[#ede9fe]',
    playText: 'text-[#6d28d9]',
    activeRing: 'ring-[#6d28d9]',
  },
  'snd-13': {
    bgGradient: 'bg-gradient-to-br from-[#ffe4e6] via-[#fff1f2] to-[#fce7f3]/70',
    border: 'border-[#f43f5e]/40 hover:border-[#f43f5e]',
    badgeBg: 'bg-[#ffe4e6]',
    badgeText: 'text-[#be123c]',
    badgeBorder: 'border-[#f43f5e]/40',
    playBg: 'bg-[#ffe4e6]',
    playText: 'text-[#be123c]',
    activeRing: 'ring-[#be123c]',
  },
  'snd-14': {
    bgGradient: 'bg-gradient-to-br from-[#e0e7ff] via-[#f0fdfa] to-[#cffafe]/70',
    border: 'border-[#4f46e5]/40 hover:border-[#4f46e5]',
    badgeBg: 'bg-[#e0e7ff]',
    badgeText: 'text-[#3730a3]',
    badgeBorder: 'border-[#4f46e5]/40',
    playBg: 'bg-[#e0f2fe]',
    playText: 'text-[#3730a3]',
    activeRing: 'ring-[#3730a3]',
  },
};

const DEFAULT_THEME = {
  bgGradient: 'bg-gradient-to-br from-[#e0f5ea] via-[#f0faf4] to-[#ffffff]',
  border: 'border-[#67c76c]/40 hover:border-[#67c76c]',
  badgeBg: 'bg-[#e0f5ea]',
  badgeText: 'text-[#006e22]',
  badgeBorder: 'border-[#67c76c]/40',
  playBg: 'bg-[#e0f5ea]',
  playText: 'text-[#006e22]',
  activeRing: 'ring-[#006e22]',
};

// Breathing Emotion Themes
const BREATHING_EMOTION_THEMES: Record<string, typeof DEFAULT_THEME> = {
  '478': {
    bgGradient: 'bg-gradient-to-br from-[#e0f5ea] via-[#f0faf4] to-[#cbf0dc]/60',
    border: 'border-[#67c76c]/40 hover:border-[#67c76c]',
    badgeBg: 'bg-[#e0f5ea]',
    badgeText: 'text-[#006e22]',
    badgeBorder: 'border-[#67c76c]/40',
    playBg: 'bg-[#e0f5ea]',
    playText: 'text-[#006e22]',
    activeRing: 'ring-[#006e22]',
  },
  box: {
    bgGradient: 'bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#bae6fd]/60',
    border: 'border-[#3b82f6]/40 hover:border-[#3b82f6]',
    badgeBg: 'bg-[#e0f2fe]',
    badgeText: 'text-[#1d4ed8]',
    badgeBorder: 'border-[#3b82f6]/40',
    playBg: 'bg-[#e0f2fe]',
    playText: 'text-[#1d4ed8]',
    activeRing: 'ring-[#1d4ed8]',
  },
  diaphragm: {
    bgGradient: 'bg-gradient-to-br from-[#fef3c7] via-[#fffbeb] to-[#fde68a]/60',
    border: 'border-[#f59e0b]/40 hover:border-[#f59e0b]',
    badgeBg: 'bg-[#fef3c7]',
    badgeText: 'text-[#b45309]',
    badgeBorder: 'border-[#f59e0b]/40',
    playBg: 'bg-[#fef3c7]',
    playText: 'text-[#b45309]',
    activeRing: 'ring-[#b45309]',
  },
  balance44: {
    bgGradient: 'bg-gradient-to-br from-[#f3e8ff] via-[#faf5ff] to-[#e9d5ff]/60',
    border: 'border-[#a855f7]/40 hover:border-[#a855f7]',
    badgeBg: 'bg-[#f3e8ff]',
    badgeText: 'text-[#7e22ce]',
    badgeBorder: 'border-[#a855f7]/40',
    playBg: 'bg-[#f3e8ff]',
    playText: 'text-[#7e22ce]',
    activeRing: 'ring-[#7e22ce]',
  },
  calm426: {
    bgGradient: 'bg-gradient-to-br from-[#ccfbf1] via-[#f0fdfa] to-[#99f6e4]/60',
    border: 'border-[#14b8a6]/40 hover:border-[#14b8a6]',
    badgeBg: 'bg-[#ccfbf1]',
    badgeText: 'text-[#0f766e]',
    badgeBorder: 'border-[#14b8a6]/40',
    playBg: 'bg-[#ccfbf1]',
    playText: 'text-[#0f766e]',
    activeRing: 'ring-[#0f766e]',
  },
  grounding: {
    bgGradient: 'bg-gradient-to-br from-[#ffe4e6] via-[#fff1f2] to-[#fecdd3]/60',
    border: 'border-[#f43f5e]/40 hover:border-[#f43f5e]',
    badgeBg: 'bg-[#ffe4e6]',
    badgeText: 'text-[#be123c]',
    badgeBorder: 'border-[#f43f5e]/40',
    playBg: 'bg-[#ffe4e6]',
    playText: 'text-[#be123c]',
    activeRing: 'ring-[#be123c]',
  },
};

interface HealingHubProps {
  initialBreathingOpen?: boolean;
}

export const HealingHubView: React.FC<HealingHubProps> = ({
  initialBreathingOpen = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<'breathing' | 'soundscapes' | 'podcasts'>(
    initialBreathingOpen ? 'breathing' : 'soundscapes'
  );

  // Breathing State
  const [breathingMethod, setBreathingMethod] = useState<'478' | 'box' | 'diaphragm' | 'balance44' | 'calm426' | 'grounding'>('478');
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Hít vào (Inhale)' | 'Giữ hơi (Hold)' | 'Thở ra (Exhale)' | 'Nghỉ (Pause)'>('Hít vào (Inhale)');
  const [breathTimer, setBreathTimer] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  // Soundscape & Audio HTML5 State
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [soundDuration, setSoundDuration] = useState<'infinite' | '15' | '30' | '60'>('infinite');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Podcast State
  const [playingPodcastId, setPlayingPodcastId] = useState<string | null>(null);
  const [podcastFilter, setPodcastFilter] = useState<string>('all');
  const [selectedYoutubeModalPod, setSelectedYoutubeModalPod] = useState<PodcastItem | null>(null);
  const [isLyriaNarrationSpeaking, setIsLyriaNarrationSpeaking] = useState<boolean>(false);
  const [isLyriaNarrationPaused, setIsLyriaNarrationPaused] = useState<boolean>(false);
  const [lyriaSpeechProgress, setLyriaSpeechProgress] = useState<number>(0);
  const [lyriaVoiceSpeed, setLyriaVoiceSpeed] = useState<number>(0.85); // 0.85 = Giọng trầm ấm, tốc độ vừa vặn
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(0.12); // 0.12 = Nhạc nền êm dịu, không lấn át giọng nói
  const [currentSentenceText, setCurrentSentenceText] = useState<string>('');

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const currentSentenceIdxRef = useRef<number>(0);
  const isSpeechCancelledRef = useRef<boolean>(false);
  const speechTimeoutRef = useRef<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);
  const voicesCacheRef = useRef<SpeechSynthesisVoice[]>([]);

  // 1. Nạp sẵn Voice Cache ngay khi mở ứng dụng
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        voicesCacheRef.current = v;
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Breathing protocols catalog
  const breathingProtocols = [
    { id: '478', name: 'Thở 4-7-8 (Harvard Medical)', tag: 'Giảm Lo Âu & Ngủ Sâu', desc: 'Hít 4s - Giữ 7s - Thở ra 8s kích hoạt hệ đối giao cảm.', inhale: 4, hold: 7, exhale: 8, pause: 0 },
    { id: 'box', name: 'Thở Hộp (Navy SEALs)', tag: 'Lấy Lại Bình Tĩnh & Tập Trung', desc: 'Hít 4s - Giữ 4s - Thở ra 4s - Nghỉ 4s ổn định huyết áp.', inhale: 4, hold: 4, exhale: 4, pause: 4 },
    { id: 'diaphragm', name: 'Thở Cơ Hoành Sâu (Somatic)', tag: 'Giải Phóng Căng Thẳng Cơ Thể', desc: 'Hít căng bụng 5s - Giữ 2s - Thở xẹp bụng 6s.', inhale: 5, hold: 2, exhale: 6, pause: 0 },
    { id: 'balance44', name: 'Thở Cân Bằng Năng Lượng (4-4)', tag: 'Tái Cân Bằng Não Bộ', desc: 'Hít đều 4s - Thở đều 4s nhịp nhàng suốt ngày làm việc.', inhale: 4, hold: 0, exhale: 4, pause: 0 },
    { id: 'calm426', name: 'Thở Xoa Dịu Hệ Thần Kinh (4-2-6)', tag: 'Hạ Nhịp Tim Nhanh', desc: 'Hít 4s - Giữ 2s - Thở dài 6s giải tỏa tức thời.', inhale: 4, hold: 2, exhale: 6, pause: 0 },
    { id: 'grounding', name: 'Thở Nối Đất 5 Giây (Cắt Panic)', tag: 'Cắt Cơn Hoảng Sợ', desc: 'Hít sâu 5s - Thở chậm 5s tập trung cảm giác bàn chân.', inhale: 5, hold: 0, exhale: 5, pause: 0 },
  ];

  // Breathing logic loop
  useEffect(() => {
    let interval: number | undefined;
    if (!isBreathingRunning) return;

    const currentProto = breathingProtocols.find((p) => p.id === breathingMethod) || breathingProtocols[0];

    interval = window.setInterval(() => {
      setBreathTimer((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phase based on current protocol
        if (breathPhase === 'Hít vào (Inhale)') {
          if (currentProto.hold > 0) {
            setBreathPhase('Giữ hơi (Hold)');
            audioSynth.playChime(432, 0.6);
            return currentProto.hold;
          } else {
            setBreathPhase('Thở ra (Exhale)');
            audioSynth.playChime(320, 0.8);
            return currentProto.exhale;
          }
        } else if (breathPhase === 'Giữ hơi (Hold)') {
          setBreathPhase('Thở ra (Exhale)');
          audioSynth.playChime(320, 0.8);
          return currentProto.exhale;
        } else if (breathPhase === 'Thở ra (Exhale)') {
          if (currentProto.pause > 0) {
            setBreathPhase('Nghỉ (Pause)');
            return currentProto.pause;
          } else {
            setBreathPhase('Hít vào (Inhale)');
            setCycleCount((c) => c + 1);
            audioSynth.playChime(528, 0.9);
            return currentProto.inhale;
          }
        } else {
          setBreathPhase('Hít vào (Inhale)');
          setCycleCount((c) => c + 1);
          audioSynth.playChime(528, 0.9);
          return currentProto.inhale;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingRunning, breathPhase, breathingMethod]);

  // Hẹn giờ tắt nhạc
  useEffect(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);

    if (soundDuration !== 'infinite' && (playingTrackId || playingPodcastId)) {
      const minutes = parseInt(soundDuration, 10);
      sleepTimerRef.current = window.setTimeout(() => {
        stopAllAudioAndSpeech();
      }, minutes * 60 * 1000);
    }

    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [soundDuration, playingTrackId, playingPodcastId]);

  // Clean up Web Audio, HTML5 Audio, and Speech on unmount
  useEffect(() => {
    return () => {
      audioSynth.stopAmbient('ambient');
      audioSynth.stopAmbient('podcastBg');
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, []);

  // Tách văn bản thành từng câu ngắn gọn để đọc mượt mà, không giật lag
  const splitTextIntoSentences = (text: string): string[] => {
    if (!text) return [];
    const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const raw = clean.split(/(?<=[.!?…])\s+/g);
    const result = raw.map((s) => s.trim()).filter((s) => s.length > 0);
    return result.length > 0 ? result : [clean];
  };

  // Dừng giọng đọc hoàn toàn
  const stopLyriaNarration = () => {
    isSpeechCancelledRef.current = true;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsLyriaNarrationSpeaking(false);
    setIsLyriaNarrationPaused(false);
    setCurrentSentenceText('');
  };

  // Dừng toàn bộ âm thanh (nhạc + podcast + giọng nói)
  const stopAllAudioAndSpeech = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current.load();
      currentAudioRef.current = null;
    }
    setCurrentAudio(null);
    audioSynth.stopAmbient('ambient');
    audioSynth.stopAmbient('podcastBg');
    stopLyriaNarration();
    setPlayingTrackId(null);
    setPlayingPodcastId(null);
    setLyriaSpeechProgress(0);
  };

  // Soundscape track toggle (Ưu tiên MP3 Supabase, Fallback Web Audio API)
  const handleTogglePlayTrack = async (track: SoundTrack) => {
    if (playingTrackId === track.id) {
      stopAllAudioAndSpeech();
    } else {
      stopAllAudioAndSpeech();

      if (track.audioUrl) {
        try {
          const audio = new Audio();
          audio.src = track.audioUrl;
          audio.volume = 0.75;
          audio.loop = true;
          audio.preload = 'auto';
          await audio.play();
          currentAudioRef.current = audio;
          setCurrentAudio(audio);
          setPlayingTrackId(track.id);
          return;
        } catch (e) {
          console.warn('Lỗi tải MP3 Supabase, chuyển sang Web Audio API Fallback:', e);
        }
      }

      audioSynth.startAmbient(track.synthType, 'ambient');
      setPlayingTrackId(track.id);
    }
  };

  // Trình phát giọng đọc trị liệu mượt mà (Sentence-by-sentence queue)
  const startLyriaNarration = (text: string, speed = lyriaVoiceSpeed, startFromIndex = 0) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
      return;
    }

    // Hủy bỏ tiến trình đọc cũ
    isSpeechCancelledRef.current = true;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    window.speechSynthesis.cancel();

    const sentences = splitTextIntoSentences(text);
    if (sentences.length === 0) return;

    speechQueueRef.current = sentences;
    isSpeechCancelledRef.current = false;
    setIsLyriaNarrationPaused(false);

    const safeStartIdx = Math.min(startFromIndex, sentences.length - 1);
    currentSentenceIdxRef.current = safeStartIdx;
    setCurrentSentenceText(sentences[safeStartIdx]);
    setLyriaSpeechProgress(Math.round((safeStartIdx / sentences.length) * 100));

    // Lấy giọng đọc tiếng Việt tối ưu
    const voices = voicesCacheRef.current.length > 0 ? voicesCacheRef.current : window.speechSynthesis.getVoices();
    const viVoices = voices.filter(
      (v) =>
        v.lang === 'vi-VN' ||
        v.lang === 'vi_VN' ||
        v.lang.toLowerCase().startsWith('vi')
    );
    const selectedVoice =
      viVoices.find((v) =>
        /natural|neural|online|google tiếng việt|hoaimy|namminh|linh|mai|an/i.test(v.name)
      ) || (viVoices.length > 0 ? viVoices[0] : null) || voices.find((v) => v.default) || voices[0] || null;

    const speakSentence = (index: number) => {
      if (isSpeechCancelledRef.current) return;
      if (index >= sentences.length) {
        setIsLyriaNarrationSpeaking(false);
        setIsLyriaNarrationPaused(false);
        setLyriaSpeechProgress(100);
        setCurrentSentenceText('Đã hoàn thành bài dẫn thiền');
        if (currentAudioRef.current && bgMusicVolume > 0) {
          currentAudioRef.current.volume = Math.min(0.25, bgMusicVolume * 1.5);
        }
        return;
      }

      currentSentenceIdxRef.current = index;
      setCurrentSentenceText(sentences[index]);
      const progressPct = Math.round(((index + 1) / sentences.length) * 100);
      setLyriaSpeechProgress(progressPct);

      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.rate = Math.max(0.7, Math.min(1.2, speed));
      utterance.pitch = 1.0;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || 'vi-VN';
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.onstart = () => {
        if (isSpeechCancelledRef.current) return;
        setIsLyriaNarrationSpeaking(true);
        setIsLyriaNarrationPaused(false);
      };

      utterance.onend = () => {
        if (isSpeechCancelledRef.current) return;
        // Khoảng lặng thở chánh niệm 350ms giữa các câu trị liệu
        speechTimeoutRef.current = window.setTimeout(() => {
          speakSentence(index + 1);
        }, 350);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis sentence event:', e);
        if (isSpeechCancelledRef.current) return;
        speechTimeoutRef.current = window.setTimeout(() => {
          speakSentence(index + 1);
        }, 200);
      };

      window.speechSynthesis.speak(utterance);
    };

    setTimeout(() => {
      if (!isSpeechCancelledRef.current) {
        speakSentence(safeStartIdx);
      }
    }, 60);
  };

  const pauseLyriaNarration = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsLyriaNarrationSpeaking(false);
    setIsLyriaNarrationPaused(true);
  };

  const resumeLyriaNarration = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsLyriaNarrationSpeaking(true);
      setIsLyriaNarrationPaused(false);
      return;
    }
    const activePod = INITIAL_PODCASTS.find((p) => p.id === playingPodcastId);
    if (activePod?.narrationAudioText) {
      startLyriaNarration(activePod.narrationAudioText, lyriaVoiceSpeed, currentSentenceIdxRef.current);
    }
  };

  const replayLyriaNarration = () => {
    const activePod = INITIAL_PODCASTS.find((p) => p.id === playingPodcastId);
    if (activePod?.narrationAudioText) {
      startLyriaNarration(activePod.narrationAudioText, lyriaVoiceSpeed, 0);
    }
  };

  const handleChangeBgVolume = (newVol: number) => {
    setBgMusicVolume(newVol);
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = newVol;
    }
  };

  const handleChangeVoiceSpeed = (newSpeed: number) => {
    setLyriaVoiceSpeed(newSpeed);
    const activePod = INITIAL_PODCASTS.find((p) => p.id === playingPodcastId);
    if (activePod?.narrationAudioText && isLyriaNarrationSpeaking) {
      startLyriaNarration(activePod.narrationAudioText, newSpeed, currentSentenceIdxRef.current);
    }
  };

  // Podcast toggle: MP3 Supabase (Nhạc nền êm dịu) + Voice Reading chống nghẽn
  const handleTogglePlayPodcast = (pod: PodcastItem) => {
    if (pod.sourceType === 'YOUTUBE') {
      setSelectedYoutubeModalPod(pod);
      return;
    }

    if (playingPodcastId === pod.id) {
      stopAllAudioAndSpeech();
      return;
    }

    stopAllAudioAndSpeech();
    setPlayingPodcastId(pod.id);

    // 1. Phát kịch bản giọng đọc thấu cảm
    if (pod.narrationAudioText) {
      startLyriaNarration(pod.narrationAudioText, lyriaVoiceSpeed, 0);
    }

    // 2. Phát nhạc nền ở mức âm lượng êm ái (mặc định 0.12)
    if (bgMusicVolume > 0) {
      if (pod.audioUrl) {
        const audio = new Audio();
        audio.src = pod.audioUrl;
        audio.volume = bgMusicVolume;
        audio.loop = true;
        audio.preload = 'auto';
        audio
          .play()
          .then(() => {
            currentAudioRef.current = audio;
            setCurrentAudio(audio);
          })
          .catch((e) => {
            console.warn('Không thể tải file MP3 nền từ Supabase, chuyển sang Fallback Web Audio:', e);
            let synth: any = 'ocean';
            if (pod.id === 'pod-2') synth = 'solfeggio528';
            else if (pod.id === 'pod-3') synth = 'tibetan';
            else if (pod.id === 'pod-4') synth = 'alpha';
            else if (pod.id === 'pod-6') synth = 'deltaSleep';
            else if (pod.id === 'pod-9') synth = 'tibetan';
            audioSynth.startAmbient(synth, 'podcastBg');
          });
      } else {
        let synth: any = 'ocean';
        if (pod.id === 'pod-2') synth = 'solfeggio528';
        else if (pod.id === 'pod-3') synth = 'tibetan';
        else if (pod.id === 'pod-4') synth = 'alpha';
        else if (pod.id === 'pod-6') synth = 'deltaSleep';
        else if (pod.id === 'pod-9') synth = 'tibetan';
        audioSynth.startAmbient(synth, 'podcastBg');
      }
    }
  };

  const filteredTracks =
    filterTag === 'all'
      ? INITIAL_SOUND_TRACKS
      : INITIAL_SOUND_TRACKS.filter((t) => t.tag === filterTag);

  const filteredPodcasts =
    podcastFilter === 'all'
      ? INITIAL_PODCASTS
      : INITIAL_PODCASTS.filter((p) => p.tag === podcastFilter);

  const activePlayingTrack = INITIAL_SOUND_TRACKS.find((t) => t.id === playingTrackId);
  const activePlayingPodcast = INITIAL_PODCASTS.find((p) => p.id === playingPodcastId);

  return (
    <div className="p-4 space-y-5 pb-28 text-[#181d16] font-sans animate-in fade-in bg-[#f6fbf0]">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0f5ea] text-[#006e22] text-[11px] font-bold border border-[#67c76c]/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Góc Trị Liệu & Tự Chăm Sóc Y Khoa</span>
        </div>
        <h2 className="text-xl font-extrabold text-[#181d16] tracking-tight">
          Healing Hub
        </h2>
      </div>

      {/* Main Category Tabs */}
      <div className="flex p-1 rounded-2xl bg-[#ffffff] border border-[#dfe4d9] shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveCategory('breathing')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeCategory === 'breathing'
              ? 'bg-[#006e22] text-white shadow-sm'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Bài tập thở</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('soundscapes')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeCategory === 'soundscapes'
              ? 'bg-[#006e22] text-white shadow-sm'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>Âm nhạc</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('podcasts')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeCategory === 'podcasts'
              ? 'bg-[#006e22] text-white shadow-sm'
              : 'text-[#6f7a6c] hover:text-[#181d16]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Podcast</span>
        </button>
      </div>

      {/* CATEGORY 1: BREATHING PROTOCOLS */}
      {activeCategory === 'breathing' && (
        <div className="space-y-4">
          {/* Method selector cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {breathingProtocols.map((p) => {
              const isSelected = breathingMethod === p.id;
              const theme = BREATHING_EMOTION_THEMES[p.id] || DEFAULT_THEME;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setBreathingMethod(p.id as any);
                    setBreathPhase('Hít vào (Inhale)');
                    setBreathTimer(p.inhale);
                    setIsBreathingRunning(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all shadow-2xs ${theme.bgGradient} ${
                    isSelected
                      ? `ring-2 ${theme.activeRing} border-transparent shadow-md scale-[1.01]`
                      : `${theme.border}`
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                    >
                      {p.tag}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#181d16] mb-1">{p.name}</h4>
                  <p className="text-[10px] text-[#4a5548] leading-tight line-clamp-2">{p.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Active Breathing Display */}
          <div className="p-6 rounded-3xl bg-white border border-[#dfe4d9] shadow-sm text-center space-y-4">
            <div className="flex justify-between items-center text-xs text-[#6f7a6c] px-2">
              <span className="font-semibold">Chu kỳ hoàn tất: {cycleCount}</span>
              <span className="bg-[#e0f5ea] text-[#006e22] px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                {breathingProtocols.find((p) => p.id === breathingMethod)?.name}
              </span>
            </div>

            {/* Breathing Circle Animation */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center my-4">
              <div
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                  isBreathingRunning
                    ? breathPhase.includes('Hít')
                      ? 'scale-110 bg-[#e0f5ea] opacity-80 animate-pulse'
                      : breathPhase.includes('Giữ')
                      ? 'scale-105 bg-[#fef3c7] opacity-80'
                      : breathPhase.includes('Thở')
                      ? 'scale-90 bg-[#ccfbf1] opacity-70'
                      : 'scale-95 bg-[#e0e7ff] opacity-60'
                    : 'scale-100 bg-[#f0faf4] opacity-50'
                }`}
              />
              <div className="relative z-10 space-y-1">
                <span className="text-4xl font-extrabold text-[#006e22] font-mono">
                  {breathTimer}s
                </span>
                <p className="text-xs font-bold text-[#181d16]">{breathPhase}</p>
              </div>
            </div>

            {/* Control Button */}
            <button
              type="button"
              onClick={() => setIsBreathingRunning(!isBreathingRunning)}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm ${
                isBreathingRunning
                  ? 'bg-[#ba1a1a] text-white hover:bg-[#93000a]'
                  : 'bg-[#006e22] text-white hover:bg-[#005317]'
              }`}
            >
              {isBreathingRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isBreathingRunning ? 'Tạm Dừng' : 'Bắt Đầu Bài Tập'}</span>
            </button>
          </div>
        </div>
      )}

      {/* CATEGORY 2: SOUNDSCAPES */}
      {activeCategory === 'soundscapes' && (
        <div className="space-y-4">
          {/* Active Player Status Bar */}
          {activePlayingTrack && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#006e22] to-[#0f766e] text-white shadow-md flex items-center justify-between gap-3 animate-in fade-in">
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                    <Activity className="w-3 h-3 animate-pulse text-emerald-300" />
                    <span>Đang phát: {activePlayingTrack.frequency}</span>
                  </span>
                  <span className="text-[10px] text-white/80">{activePlayingTrack.bpm} BPM</span>
                </div>
                <h4 className="text-xs font-bold truncate text-white">{activePlayingTrack.title}</h4>
                <p className="text-[10px] text-white/80 truncate">{activePlayingTrack.acousticProfile}</p>
              </div>

              {/* Animated Equalizer Waves */}
              <div className="flex items-end gap-1 h-6 px-2">
                <span className="w-1 bg-white/90 rounded-full animate-bounce h-5 [animation-delay:0.1s]" />
                <span className="w-1 bg-white/90 rounded-full animate-bounce h-3 [animation-delay:0.3s]" />
                <span className="w-1 bg-white/90 rounded-full animate-bounce h-6 [animation-delay:0.2s]" />
                <span className="w-1 bg-white/90 rounded-full animate-bounce h-4 [animation-delay:0.4s]" />
              </div>

              <button
                type="button"
                onClick={() => handleTogglePlayTrack(activePlayingTrack)}
                className="w-9 h-9 rounded-xl bg-white text-[#006e22] flex items-center justify-center font-bold shadow-sm shrink-0 hover:bg-emerald-50"
                title="Dừng phát"
              >
                <Pause className="w-4 h-4 fill-current" />
              </button>
            </div>
          )}

          {/* Hẹn giờ tắt nhạc */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#dfe4d9] text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#4a5548]">
              <Timer className="w-4 h-4 text-[#006e22]" />
              <span>Hẹn giờ tắt nhạc:</span>
            </div>
            <div className="flex gap-1">
              {[
                { id: 'infinite', label: 'Vô tận' },
                { id: '15', label: '15p' },
                { id: '30', label: '30p' },
                { id: '60', label: '60p' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSoundDuration(opt.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                    soundDuration === opt.id
                      ? 'bg-[#006e22] text-white shadow-xs'
                      : 'bg-[#f0faf4] text-[#6f7a6c] hover:text-[#181d16]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: `Tất Cả (${INITIAL_SOUND_TRACKS.length} bài)` },
              { id: '#GiảmCăngThẳng', label: '#GiảmCăngThẳng' },
              { id: '#KhóNgủ', label: '#KhóNgủ' },
              { id: '#TậpTrung', label: '#TậpTrung' },
              { id: '#ThảLỏngTâmTrí', label: '#ThảLỏng' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterTag(pill.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  filterTag === pill.id
                    ? 'bg-[#006e22] text-white shadow-sm'
                    : 'bg-[#ffffff] text-[#6f7a6c] hover:text-[#181d16] border border-[#dfe4d9]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* 14 Unique Sound Cards List */}
          <div className="space-y-2.5">
            {filteredTracks.map((track) => {
              const isPlaying = playingTrackId === track.id;
              const theme = TRACK_EMOTION_THEMES[track.id] || DEFAULT_THEME;

              return (
                <div
                  key={track.id}
                  className={`p-3.5 rounded-2xl border transition-all shadow-2xs ${theme.bgGradient} ${
                    isPlaying
                      ? `ring-2 ${theme.activeRing} border-transparent shadow-md scale-[1.01]`
                      : `${theme.border}`
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                        >
                          {track.frequency}
                        </span>
                        <span className="text-[10px] text-[#6f7a6c] font-semibold">{track.tag}</span>
                        {track.bpm && (
                          <span className="text-[9px] text-[#6f7a6c] font-mono bg-white/60 px-1.5 py-0.5 rounded border border-[#dfe4d9]/50">
                            {track.bpm} BPM
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-[#181d16] truncate">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-[#4a5548] leading-relaxed line-clamp-2">
                        {track.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePlayTrack(track)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition shadow-sm ${
                        isPlaying
                          ? 'bg-[#ba1a1a] text-white animate-pulse shadow-md'
                          : `${theme.playBg} ${theme.playText} hover:bg-[#006e22] hover:text-white`
                      }`}
                      title={isPlaying ? 'Dừng phát' : 'Phát âm thanh'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY 3: PODCASTS (YouTube + AI Lyria Medical Podcasts) */}
      {activeCategory === 'podcasts' && (
        <div className="space-y-4">
          {/* Active AI Lyria Player Banner */}
          {activePlayingPodcast && activePlayingPodcast.sourceType === 'AI_LYRIA' && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white shadow-lg space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    <Bot className="w-3 h-3" />
                    <span>Google AI Lyria x Mindful Voice</span>
                  </div>
                  {isLyriaNarrationSpeaking && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 text-[10px] border border-indigo-300/30">
                      <Mic className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-medium">Giọng dẫn thiền êm ái</span>
                    </div>
                  )}
                  {isLyriaNarrationPaused && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] border border-amber-300/30">
                      <span className="text-[9px] font-medium">Tạm dừng</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={stopAllAudioAndSpeech}
                  className="text-white/70 hover:text-white transition"
                  title="Đóng trình phát"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white leading-snug">{activePlayingPodcast.title}</h4>
                <p className="text-[11px] text-indigo-200/90 mt-0.5">
                  Tần số trị liệu: {activePlayingPodcast.lyriaMusicStyle}
                </p>
              </div>

              {/* Live Subtitle / Current Sentence */}
              {currentSentenceText && (
                <div className="p-2.5 rounded-xl bg-black/25 backdrop-blur-xs border border-white/10 text-xs text-emerald-200/95 leading-relaxed font-medium min-h-[44px] flex items-center">
                  <span>"{currentSentenceText}"</span>
                </div>
              )}

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-300"
                    style={{ width: `${lyriaSpeechProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-white/70">
                  <span className="flex items-center gap-1">
                    {isLyriaNarrationSpeaking ? (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Đang đọc dẫn thoại trị liệu (Nhẹ nhàng & Sâu lắng)...</span>
                      </>
                    ) : isLyriaNarrationPaused ? (
                      <span>Đang tạm dừng bài dẫn thoại</span>
                    ) : (
                      <span>Âm thanh nền Lyria đang phát hòa quyện</span>
                    )}
                  </span>
                  <span>{activePlayingPodcast.duration}</span>
                </div>
              </div>

              {/* Audio Controls Bar */}
              <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 text-[11px]">
                {/* Voice Speed & Background Music Controls */}
                <div className="flex items-center gap-3">
                  {/* Tốc độ đọc */}
                  <div className="flex items-center gap-1 text-[10px] text-white/80">
                    <span>Tốc độ:</span>
                    {[
                      { val: 0.75, label: '0.75x' },
                      { val: 0.85, label: '0.85x' },
                      { val: 1.0, label: '1.0x' },
                    ].map((s) => (
                      <button
                        key={s.val}
                        type="button"
                        onClick={() => handleChangeVoiceSpeed(s.val)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                          Math.abs(lyriaVoiceSpeed - s.val) < 0.05
                            ? 'bg-emerald-400 text-[#1e1b4b]'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Nhạc nền toggle/volume */}
                  <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                    <button
                      type="button"
                      onClick={() => handleChangeBgVolume(bgMusicVolume > 0 ? 0 : 0.12)}
                      className="p-1 rounded hover:bg-white/10 text-emerald-300"
                      title={bgMusicVolume > 0 ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
                    >
                      {bgMusicVolume > 0 ? (
                        <Volume2 className="w-3.5 h-3.5" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-white/40" />
                      )}
                    </button>
                    <span className="text-[9px]">Nhạc nền</span>
                  </div>
                </div>

                {/* Primary Playback Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={replayLyriaNarration}
                    className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                    title="Đọc lại từ đầu"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {isLyriaNarrationSpeaking ? (
                    <button
                      type="button"
                      onClick={pauseLyriaNarration}
                      className="px-3 py-1 rounded-full bg-white text-[#1e1b4b] font-bold flex items-center gap-1 hover:bg-emerald-50 transition shadow-sm"
                    >
                      <Pause className="w-3 h-3 fill-current" />
                      <span>Tạm dừng</span>
                    </button>
                  ) : isLyriaNarrationPaused ? (
                    <button
                      type="button"
                      onClick={resumeLyriaNarration}
                      className="px-3 py-1 rounded-full bg-emerald-400 text-[#1e1b4b] font-bold flex items-center gap-1 hover:bg-emerald-300 transition shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Tiếp tục</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={replayLyriaNarration}
                      className="px-3 py-1 rounded-full bg-emerald-400 text-[#1e1b4b] font-bold flex items-center gap-1 hover:bg-emerald-300 transition shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Nghe lại</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={stopAllAudioAndSpeech}
                    className="p-1.5 rounded-full bg-white/10 text-rose-300 hover:bg-rose-500/20 transition"
                    title="Dừng và đóng"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Topic Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'Tất Cả Chủ Đề' },
              { id: '#ChữaLành', label: '#ChữaLành' },
              { id: '#TâmLýHọcHànhVi', label: '#TâmLý' },
              { id: '#LoÂuHoảngSợ', label: '#LoÂu' },
              { id: '#ÁpLựcCôngViệc', label: '#Burnout' },
              { id: '#YHọcGiấcNgủ', label: '#GiấcNgủ' },
              { id: '#TựTrắcẨn', label: '#TựTrắcẨn' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setPodcastFilter(pill.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  podcastFilter === pill.id
                    ? 'bg-[#006e22] text-white shadow-sm'
                    : 'bg-[#ffffff] text-[#6f7a6c] hover:text-[#181d16] border border-[#dfe4d9]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Podcast Cards List */}
          <div className="space-y-3">
            {filteredPodcasts.map((pod) => {
              const isPlaying = playingPodcastId === pod.id;
              const isLyria = pod.sourceType === 'AI_LYRIA';

              return (
                <div
                  key={pod.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 shadow-2xs ${
                    isLyria
                      ? 'bg-gradient-to-br from-[#f5f3ff] via-[#faf5ff] to-[#ffffff] border-indigo-200/70 hover:border-indigo-400'
                      : 'bg-gradient-to-br from-[#fff1f2] via-[#fff5f5] to-[#ffffff] border-rose-200/70 hover:border-rose-400'
                  } ${
                    isPlaying
                      ? 'ring-2 ring-indigo-600 border-transparent shadow-md scale-[1.01]'
                      : ''
                  }`}
                >
                  {/* Top Bar: Source Badge & Duration */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isLyria ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Bot className="w-3 h-3 text-indigo-600" />
                          <span>AI Lyria Trị Liệu</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          <Youtube className="w-3 h-3 text-rose-600" />
                          <span>YouTube Chuyên Gia</span>
                        </span>
                      )}
                      <span className="text-[10px] text-[#6f7a6c] font-medium">{pod.tag}</span>
                    </div>

                    <span className="font-mono text-[11px] font-semibold text-[#4a5548] bg-white/80 px-2 py-0.5 rounded-md border border-[#dfe4d9]/80">
                      {pod.duration}
                    </span>
                  </div>

                  {/* Title & Host */}
                  <div>
                    <h4 className="text-xs font-bold text-[#181d16] leading-snug">{pod.title}</h4>
                    {!isLyria && pod.host && (
                      <p className="text-[10px] font-medium text-[#6f7a6c] mt-0.5">{pod.host}</p>
                    )}
                    {!isLyria && pod.hostRole && (
                      <p className="text-[9px] text-[#006e22] italic font-medium">{pod.hostRole}</p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-[#4a5548] leading-relaxed">{pod.desc}</p>

                  {/* Bottom Action Bar */}
                  <div className="pt-2 flex items-center justify-end border-t border-[#dfe4d9]/70">
                    <button
                      type="button"
                      onClick={() => handleTogglePlayPodcast(pod)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs ${
                        isLyria
                          ? isPlaying
                            ? 'bg-[#ba1a1a] text-white animate-pulse shadow-md'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-rose-600 text-white hover:bg-rose-700'
                      }`}
                    >
                      {isLyria ? (
                        isPlaying ? (
                          <Pause className="w-3 h-3 fill-current" />
                        ) : (
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        )
                      ) : (
                        <Youtube className="w-3 h-3" />
                      )}
                      <span>
                        {isLyria
                          ? isPlaying
                            ? 'Đang phát Lyria'
                            : 'Nghe AI Lyria'
                          : 'Mở YouTube Playlist'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* YouTube Dedicated Audio/Video Modal */}
      {selectedYoutubeModalPod && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#dfe4d9] space-y-3">
            {/* Modal Header */}
            <div className="p-4 bg-[#f6fbf0] border-b border-[#dfe4d9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Youtube className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#181d16] truncate max-w-[280px]">
                    {selectedYoutubeModalPod.title}
                  </h3>
                  <p className="text-[10px] text-[#6f7a6c]">{selectedYoutubeModalPod.host}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedYoutubeModalPod(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#dfe4d9] text-[#6f7a6c] hover:text-[#181d16] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded YouTube Player (Hỗ trợ cả Video đơn và Playlist) */}
            <div className="px-4">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner">
                <iframe
                  className="w-full h-full"
                  src={
                    selectedYoutubeModalPod.playlistId
                      ? `https://www.youtube-nocookie.com/embed/videoseries?list=${selectedYoutubeModalPod.playlistId}&autoplay=1&rel=0`
                      : `https://www.youtube-nocookie.com/embed/${selectedYoutubeModalPod.youtubeId}?autoplay=1&rel=0`
                  }
                  title={selectedYoutubeModalPod.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Summary & Medical Takeaways */}
            <div className="p-4 space-y-2.5 max-h-44 overflow-y-auto">
              {selectedYoutubeModalPod.medicalTakeaways && (
                <div className="p-3 rounded-2xl bg-[#e0f5ea] border border-[#67c76c]/40 text-[11px] text-[#006e22] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Đúc kết Y khoa & Trị liệu Chánh niệm:</span>
                  </div>
                  <p className="text-[#181d16] leading-relaxed">{selectedYoutubeModalPod.medicalTakeaways}</p>
                </div>
              )}

              {selectedYoutubeModalPod.transcriptSummary && (
                <div className="space-y-1 text-[11px] text-[#4a5548]">
                  <p className="font-bold text-[#181d16]">Các điểm cốt lõi:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    {selectedYoutubeModalPod.transcriptSummary.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#f6fbf0] border-t border-[#dfe4d9] flex justify-between items-center">
              <a
                href={
                  selectedYoutubeModalPod.playlistId
                    ? `https://www.youtube.com/playlist?list=${selectedYoutubeModalPod.playlistId}`
                    : `https://www.youtube.com/watch?v=${selectedYoutubeModalPod.youtubeId}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
              >
                <Youtube className="w-4 h-4" />
                <span>Mở trên YouTube ↗</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedYoutubeModalPod(null)}
                className="px-4 py-2 rounded-xl bg-[#006e22] text-white text-xs font-bold hover:bg-[#005317]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};