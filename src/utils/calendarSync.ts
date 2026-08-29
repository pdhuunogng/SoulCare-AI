import { Appointment } from '../types';
import { parseDateString } from './dateUtils';

/**
 * Parses appointment date and time slot into start and end Date objects.
 * Handles dateStr like "29/08/2026", "2026-08-29" and timeSlot like "19:00 - 20:00", "09:00 - 10:00", "14:00"
 */
export function getAppointmentDateTimeRange(appointment: Appointment): { start: Date; end: Date } {
  const { dateStr, timeSlot } = appointment;
  
  let day = 1;
  let month = 0;
  let year = new Date().getFullYear();

  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    day = parseInt(parts[0], 10) || 1;
    month = (parseInt(parts[1], 10) || 1) - 1;
    year = parseInt(parts[2], 10) || new Date().getFullYear();
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10) || new Date().getFullYear();
    month = (parseInt(parts[1], 10) || 1) - 1;
    day = parseInt(parts[2], 10) || 1;
  }

  let startHours = 19;
  let startMinutes = 0;
  let endHours = 20;
  let endMinutes = 0;

  if (timeSlot) {
    const parts = timeSlot.split('-');
    if (parts[0]) {
      const [h, m] = parts[0].trim().split(':');
      if (h !== undefined) startHours = parseInt(h, 10) || 0;
      if (m !== undefined) startMinutes = parseInt(m, 10) || 0;
    }
    if (parts[1]) {
      const [h, m] = parts[1].trim().split(':');
      if (h !== undefined) endHours = parseInt(h, 10) || 0;
      if (m !== undefined) endMinutes = parseInt(m, 10) || 0;
    } else {
      // Default duration: 60 minutes
      endHours = startHours + 1;
      endMinutes = startMinutes;
    }
  }

  const start = new Date(year, month, day, startHours, startMinutes, 0);
  const end = new Date(year, month, day, endHours, endMinutes, 0);

  return { start, end };
}

/**
 * Formats a Date object into Google Calendar UTC format: YYYYMMDDTHHmmSSZ
 */
function formatGoogleCalendarUtc(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Generates an official, clickable Google Calendar event creation URL
 */
export function getGoogleCalendarUrl(appointment: Appointment): string {
  const { start, end } = getAppointmentDateTimeRange(appointment);
  const dates = `${formatGoogleCalendarUtc(start)}/${formatGoogleCalendarUtc(end)}`;

  const expertName = appointment.expertName || 'Chuyên gia Tâm lý';
  const expertTitle = appointment.expertTitle || 'Bác sĩ / Chuyên gia';
  const title = `[SoulCare] Tư Vấn Tâm Lý 1-1 với ${expertName}`;

  const meetLink = appointment.googleMeetLink || 'https://meet.google.com/air-rise-soulcare';
  const location = appointment.type === 'offline' && appointment.clinicAddress
    ? `${appointment.clinicName || 'Phòng khám SoulCare'} - ${appointment.clinicAddress}`
    : meetLink;

  const details = [
    `🌿 BUỔI TƯ VẤN TÂM LÝ 1-1 TRÊN NỀN TẢNG SOULCARE`,
    `--------------------------------------------------`,
    `👨‍⚕️ Chuyên gia phụ trách: ${expertTitle} ${expertName}`,
    `👤 Bệnh nhân / Thân chủ: ${appointment.userName || 'Người dùng SoulCare'}`,
    `⏰ Thời gian: ${appointment.dateStr} (${appointment.timeSlot})`,
    appointment.type === 'online' ? `🎥 Link Google Meet: ${meetLink}` : `🏥 Địa chỉ khám: ${location}`,
    `📋 Vấn đề / Ghi chú: ${appointment.userNotes || 'Tư vấn sức khỏe tinh thần, hỗ trợ giải tỏa áp lực và cải thiện giấc ngủ'}`,
    `--------------------------------------------------`,
    `💡 Lưu ý: Vui lòng tham gia phòng trước 5 phút để kiểm tra camera và micro.`,
    `🛡️ Bảo mật: Mọi nội dung trao đổi được bảo mật tuyệt đối theo chuẩn đạo đức y tế.`,
  ].join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates standard iCalendar (.ics) RFC 5545 format
 */
export function generateIcsContent(appointment: Appointment): string {
  const { start, end } = getAppointmentDateTimeRange(appointment);
  const startUtc = formatGoogleCalendarUtc(start);
  const endUtc = formatGoogleCalendarUtc(end);
  const nowUtc = formatGoogleCalendarUtc(new Date());

  const expertName = appointment.expertName || 'Chuyên gia Tâm lý';
  const title = `[SoulCare] Tư Vấn Tâm Lý 1-1 với ${expertName}`;
  const meetLink = appointment.googleMeetLink || 'https://meet.google.com/air-rise-soulcare';
  const location = appointment.type === 'offline' && appointment.clinicAddress
    ? `${appointment.clinicName || 'Phòng khám'} - ${appointment.clinicAddress}`
    : meetLink;

  const desc = `Buổi tư vấn tâm lý 1-1 cùng ${expertName} trên SoulCare. Link Meet: ${meetLink}. Ghi chú: ${appointment.userNotes || 'Tư vấn tâm lý'}`;
  const cleanDesc = desc.replace(/\n/g, '\\n').replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SoulCare//SoulCare Mental Health Platform//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:soulcare-apt-${appointment.id}@soulcare.vn`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Nhắc nhở buổi tư vấn SoulCare sắp bắt đầu sau 15 phút',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Downloads .ics calendar file to user's device
 */
export function downloadIcsCalendarFile(appointment: Appointment): void {
  const icsData = generateIcsContent(appointment);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `soulcare-lich-hen-${appointment.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Safely opens Google Calendar sync in a new tab
 */
export function openGoogleCalendarSync(appointment: Appointment): void {
  const gcalUrl = getGoogleCalendarUrl(appointment);
  window.open(gcalUrl, '_blank', 'noopener,noreferrer');
}
