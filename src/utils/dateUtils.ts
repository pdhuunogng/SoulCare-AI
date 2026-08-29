import { AvailableSlot, Appointment, MoodEntry } from '../types';

export const VIETNAMESE_DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/**
 * Returns Vietnamese day of week label: 'CN' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'
 */
export function getVietnameseDayLabel(d: Date): string {
  return VIETNAMESE_DAY_LABELS[d.getDay()] || 'T2';
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
export function formatDateIso(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Formats a Date object to DD/MM/YYYY string
 */
export function formatDateDisplayVi(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Generates an array of past N days ending at today (real time)
 */
export function getPastNDays(n: number = 7): { date: string; dayLabel: string; isToday: boolean; dateObj: Date }[] {
  const result = [];
  const today = new Date();
  
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    result.push({
      date: formatDateIso(d),
      dayLabel: getVietnameseDayLabel(d),
      isToday: i === 0,
      dateObj: d,
    });
  }
  return result;
}

/**
 * Generates initial realistic mood history with real dates ending at today
 */
export function generateInitialRealtimeMoodHistory(totalDays: number = 14): MoodEntry[] {
  const sampleData = [
    { emotion: 'Mệt mỏi', note: 'Hôm nay deadline dồn dập, hơi mệt mỏi và mất ngủ một chút.', tags: ['#CôngViệc', '#GiấcNgủ'] },
    { emotion: 'Căng thẳng', note: 'Lo lắng về kết quả bài thuyết trình trước công ty vào sáng mai.', tags: ['#CôngViệc'] },
    { emotion: 'Bối rối', note: 'Bực bội vì đồng nghiệp không phối hợp đúng tiến độ dự án.', tags: ['#CôngViệc', '#GiaoTiếp'] },
    { emotion: 'Ổn định', note: 'Thử bài tập thở 4-7-8, tối ngủ sâu và nhẹ nhõm hơn nhiều.', tags: ['#TậpThở', '#GiấcNgủ'] },
    { emotion: 'Tươi vui', note: 'Bác sĩ Minh Anh gửi bản recap rất chu đáo và động viên!', tags: ['#SứcKhỏe', '#BiếtƠn'] },
    { emotion: 'Tươi vui', note: 'Đi dạo công viên cùng bạn bè, tâm trạng nhẹ nhõm, thưởng thức cà phê.', tags: ['#TìnhCảm', '#ThưGiãn'] },
    { emotion: 'Tươi vui', note: 'Dành cả ngày nghỉ ngơi, nấu món ăn yêu thích và đọc sách chữa lành.', tags: ['#BiếtƠn', '#ThưGiãn'] },
    { emotion: 'Ổn định', note: 'Bắt đầu tuần mới với tâm thế tích cực, duy trì uống đủ 2 lít nước.', tags: ['#SứcKhỏe'] },
    { emotion: 'Căng thẳng', note: 'Khối lượng công việc phát sinh đột xuất khiến đầu óc hơi căng cứng.', tags: ['#CôngViệc'] },
    { emotion: 'Ổn định', note: 'Nghe podcast thiền buông thư 10 phút, cảm thấy dịu bớt áp lực.', tags: ['#ThảLỏngTâmTrí'] },
    { emotion: 'Hạnh phúc', note: 'Hoàn thành tốt buổi báo cáo, được sếp và đồng nghiệp khen ngợi.', tags: ['#CôngViệc', '#BiếtƠn'] },
    { emotion: 'Biết ơn', note: 'Nhận được lời hỏi thăm ấm áp từ gia đình và người bạn thân.', tags: ['#GiaĐình', '#BiếtƠn'] },
    { emotion: 'Mệt mỏi', note: 'Thời tiết thay đổi làm người hơi ê ẩm, đi ngủ sớm lúc 22h.', tags: ['#SứcKhỏe', '#GiấcNgủ'] },
    { emotion: 'Tươi vui', note: 'Hôm nay thức dậy đón ánh nắng sớm và uống trà thảo mộc thật thảnh thơi.', tags: ['#BiếtƠn', '#ThưGiãn'] },
  ];

  const days = getPastNDays(totalDays);
  return days.map((day, idx) => {
    const sampleIdx = (days.length - 1 - idx) % sampleData.length;
    const sample = sampleData[sampleIdx];
    return {
      date: day.date,
      dayLabel: day.dayLabel,
      emotion: sample.emotion,
      note: sample.note,
      tags: sample.tags,
      timestamp: day.dateObj.getTime(),
    };
  });
}

/**
 * Parses a DD/MM/YYYY date string and optional time into a Date object.
 * Format examples: '29/08/2026', '2026-08-29', 'Hôm nay, 29/08/2026'
 */
export function parseDateString(dateStr: string, timeStr?: string): Date {
  try {
    let day = 1;
    let month = 0;
    let year = new Date().getFullYear();

    // Check for DD/MM/YYYY or DD/MM pattern
    const dmyMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10) || 1;
      month = (parseInt(dmyMatch[2], 10) || 1) - 1;
      if (dmyMatch[3]) {
        let y = parseInt(dmyMatch[3], 10);
        if (y < 100) y += 2000;
        year = y;
      }
    } else {
      // Try YYYY-MM-DD
      const ymdMatch = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (ymdMatch) {
        year = parseInt(ymdMatch[1], 10) || new Date().getFullYear();
        month = (parseInt(ymdMatch[2], 10) || 1) - 1;
        day = parseInt(ymdMatch[3], 10) || 1;
      }
    }

    let hours = 23;
    let minutes = 59;

    if (timeStr) {
      // E.g. '19:00 - 20:00' or '19:00'
      const startPart = timeStr.split('-')[0].trim();
      const [h, m] = startPart.split(':');
      if (h !== undefined) hours = parseInt(h, 10) || 0;
      if (m !== undefined) minutes = parseInt(m, 10) || 0;
    }

    return new Date(year, month, day, hours, minutes);
  } catch {
    return new Date();
  }
}

/**
 * Prioritizes and sorts appointments:
 * 1. Upcoming appointments come first, sorted chronologically ascending (closest upcoming first)
 * 2. Completed appointments next, sorted descending (most recent first)
 * 3. Cancelled appointments last
 */
export function sortAppointmentsByUpcoming(appointments: Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => {
    const statusOrder: Record<string, number> = { upcoming: 1, completed: 2, cancelled: 3 };
    const orderA = statusOrder[a.status] || 99;
    const orderB = statusOrder[b.status] || 99;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const timeA = parseDateString(a.dateStr, a.timeSlot).getTime();
    const timeB = parseDateString(b.dateStr, b.timeSlot).getTime();

    if (a.status === 'upcoming') {
      // Closest upcoming on top
      return timeA - timeB;
    } else {
      // Most recent completed/cancelled on top
      return timeB - timeA;
    }
  });
}

/**
 * Returns true if the appointment date & time has already passed compared to now.
 */
export function isPastAppointment(appointment: Appointment): boolean {
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return true;
  }
  const dateObj = parseDateString(appointment.dateStr, appointment.timeSlot);
  // Compare with current time
  return dateObj.getTime() < Date.now();
}

/**
 * Returns true if a slot's date and time is in the past.
 */
export function isPastSlot(slot: AvailableSlot): boolean {
  const dateObj = parseDateString(slot.dateStr, slot.time);
  return dateObj.getTime() < Date.now();
}

/**
 * Filters out past or booked slots.
 */
export function filterUpcomingSlots(slots: AvailableSlot[]): AvailableSlot[] {
  return slots.filter((slot) => !slot.isBooked && !isPastSlot(slot));
}

/**
 * Helper to generate dynamic upcoming slots for the next 7 days
 */
export function generateUpcomingSlotsForExpert(
  expertId: string,
  preferredTimes: string[] = ['19:00 - 20:00', '20:30 - 21:30', '14:00 - 15:00', '09:00 - 10:00']
): AvailableSlot[] {
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const slots: AvailableSlot[] = [];
  const now = new Date();

  // Generate slots for today and next 7 days
  for (let offset = 0; offset <= 7; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dayOfWeek = dayNames[d.getDay()];
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    // Add 1 or 2 slots per day
    const time1 = preferredTimes[offset % preferredTimes.length];
    const slot1: AvailableSlot = {
      id: `slot-${expertId}-${offset}-1`,
      dayOfWeek,
      dateStr,
      time: time1,
      isBooked: false,
    };

    if (!isPastSlot(slot1)) {
      slots.push(slot1);
    }

    if (offset % 2 === 0) {
      const time2 = preferredTimes[(offset + 1) % preferredTimes.length];
      const slot2: AvailableSlot = {
        id: `slot-${expertId}-${offset}-2`,
        dayOfWeek,
        dateStr,
        time: time2,
        isBooked: false,
      };
      if (!isPastSlot(slot2)) {
        slots.push(slot2);
      }
    }
  }

  return slots;
}
