export type PlatformType = 'ios' | 'android' | 'responsive';

export type UserRole = 'user' | 'expert' | 'admin';

export interface SOSBuddy {
  name: string;
  phone: string;
  relationship: string;
  customMessage: string;
  isNotified: boolean;
}

export type EmotionType = 'Tươi vui' | 'Ổn định' | 'Mệt mỏi' | 'Căng thẳng' | 'Bối rối' | 'happiness' | 'sadness' | 'fear' | 'anger' | 'surprise' | 'disgust' | string;

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  dayLabel: string; // T2, T3, ...
  emotion: EmotionType;
  note?: string;
  tags?: string[];
  timestamp?: number;
}

export interface Challenge {
  id: string;
  title: string;
  durationDays: number;
  category: '7-days' | '14-21-days' | '30-days';
  description: string;
  dailyPrompt: string;
  badgeIcon: string;
}

export interface UserChallengeProgress {
  challengeId: string;
  challengeTitle: string;
  totalDays: number;
  currentStreak: number;
  daysCompletedCount: number;
  todayCompleted: boolean;
  lastCheckInDate?: string; // YYYY-MM-DD
  isCompleted?: boolean;
}

export interface QuizQuestion {
  id: number;
  text: string;
  group: 'depression' | 'anxiety' | 'stress' | 'sleep';
  tier: 1 | 2;
  isReversed?: boolean; // for PSS-10 reverse scored questions
  categoryName: string;
}

export interface QuizResult {
  completedAt?: string;
  tier?: 'tier1' | 'tier2';
  overallSummary?: string;
  depressionPct: number;
  anxietyPct: number;
  stressPct: number;
  sleepPct: number;
  tier2TriggeredGroup?: 'depression' | 'anxiety' | 'stress' | null;
  sosTriggered?: boolean;
  timestamp?: string;
}

export interface ExpertReview {
  id: string;
  userName: string;
  isAnonymous: boolean;
  rating: number; // 1-5
  date: string;
  text: string;
  tags: string[];
  isVerifiedSession: boolean;
}

export interface AvailableSlot {
  id: string;
  dayOfWeek: string; // 'T2', 'T3', ...
  dateStr: string; // '18/08/2026'
  time: string; // '19:00 - 20:00'
  isBooked: boolean;
}

export interface ExpertProfile {
  id: string;
  userId?: string; // Links to account ID when user role is 'expert' / doctor
  name: string;
  title: string; // TS. Bác sĩ / Thạc sĩ Tâm lý
  avatar: string;
  bio: string;
  introCaption: string;
  degrees: string[];
  certifications?: string[];
  licenseNumber?: string; // Số Chứng Chỉ Hành Nghề Y Tế (CCHN) do Bộ Y Tế / Sở Y Tế cấp
  hospitalAffiliation?: string; // Bệnh viện / Cơ quan y tế công tác chính
  yearsOfExperience?: number; // Số năm kinh nghiệm hành nghề lâm sàng
  languages?: string[]; // Ngôn ngữ tham vấn (VD: ['Tiếng Việt', 'Tiếng Anh'])
  consultationModes?: string[]; // ['Google Meet Video HD', 'Cuộc gọi thoại bảo mật']
  isVerified: boolean;
  verifiedBadgeText?: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  phone: string;
  email: string;
  pricing: {
    firstSession: number; // 0
    singleSession: number; // 500.000đ
    package3: number; // 1.350.000đ
    package5: number; // 2.100.000đ
    package10: number; // 3.800.000đ
  };
  availableSlots: AvailableSlot[];
  reviews: ExpertReview[];
  aiSummary?: string;
}

export interface OfflineClinic {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  phone: string;
  googleMapsUrl: string;
  bookingUrl: string;
  image: string;
  tags: string[];
  lat: number;
  lng: number;
  openHours?: string;
  aiRecommendationReason?: string;
  departments?: string[];
  isEmergencyAvailable?: boolean;
  priceEstimate?: string;
}

export interface Appointment {
  id: string;
  type: 'online' | 'offline';
  userId: string;
  userName: string;
  expertId?: string;
  expertName?: string;
  expertTitle?: string;
  expertAvatar?: string;
  clinicId?: string;
  clinicName?: string;
  clinicAddress?: string;
  dateStr: string;
  timeSlot: string;
  googleMeetLink?: string;
  googleCalendarSynced: boolean;
  status: 'upcoming' | 'completed' | 'cancelled';
  userNotes?: string;
  cancellationReason?: string;
  cancelledBy?: 'user' | 'expert';
  cancelledAt?: string;
  preSessionBriefing?: string;
  doctorRecap?: {
    rawNotes?: string;
    formattedRecap?: string;
    createdAt?: string;
    sentAt?: string;
    isSentToUser?: boolean;
    isApproved?: boolean;
  };
  hasUserReviewed?: boolean;
}

export type ChatActionType =
  | 'NAVIGATE_BREATHING'
  | 'NAVIGATE_HEALING_HUB'
  | 'NAVIGATE_STREAK'
  | 'NAVIGATE_BOOKING'
  | 'NAVIGATE_BOOKING_FREE'
  | 'VIEW_CARE_PLANS'
  | 'TRIGGER_SOS'
  | 'TRIGGER_SOS_DRAWER'
  | 'NONE';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
  actionFlag?: ChatActionType;
  actionButtonText?: string | null;
  contextInsight?: string;
  isCrisis?: boolean;
}

export type SynthType =
  | 'ocean'
  | 'rain'
  | 'alpha'
  | 'tibetan'
  | 'solfeggio528'
  | 'solfeggio396'
  | 'solfeggio639'
  | 'solfeggio852'
  | 'deltaSleep'
  | 'deltaDeep05'
  | 'campfire'
  | 'cricketsNight'
  | 'lofiCafe'
  | 'gammaFocus';

export interface SoundTrack {
  id: string;
  title: string;
  tag: '#GiảmCăngThẳng' | '#KhóNgủ' | '#TậpTrung' | '#ThảLỏngTâmTrí';
  tagLabel: string;
  frequency: string;
  description: string;
  color: string;
  synthType: SynthType;
  bpm?: number;
  acousticProfile?: string;
  audioUrl?: string;
}

export type PodcastSourceType = 'AI_LYRIA' | 'YOUTUBE';

export interface PodcastItem {
  id: string;
  title: string;
  host: string;
  hostRole?: string;
  duration: string;
  tag: string;
  desc: string;
  sourceType: PodcastSourceType;
  youtubeId?: string;
  playlistId?: string;
  audioUrl?: string;
  lyriaMusicStyle?: string;
  transcriptSummary?: string[];
  medicalTakeaways?: string;
  narrationAudioText?: string;
}
