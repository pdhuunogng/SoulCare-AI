import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  auth,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  MoodEntry,
  QuizResult,
  UserChallengeProgress,
  Appointment,
  SOSBuddy,
  UserRole,
} from '../types';

export interface UserProfileDoc {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  currentOrbTheme?: string;
  sosBuddy?: SOSBuddy;
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper function to recursively remove any fields with undefined values.
 * Firestore throws a runtime error if any object contains `undefined`.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val === undefined) {
      continue;
    }
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      result[key] = cleanFirestoreData(val);
    } else if (Array.isArray(val)) {
      result[key] = val
        .filter((item) => item !== undefined)
        .map((item) => (item !== null && typeof item === 'object' && !(item instanceof Date) ? cleanFirestoreData(item) : item));
    } else {
      result[key] = val;
    }
  }
  return result;
}

// 1. User Profile Management
export async function syncUserProfile(profile: Partial<UserProfileDoc> & { userId: string; email: string; name: string }): Promise<void> {
  const path = `users/${profile.userId}`;
  try {
    const userRef = doc(db, 'users', profile.userId);
    const existingSnap = await getDoc(userRef);
    const now = new Date().toISOString();

    if (!existingSnap.exists()) {
      const newDoc: Record<string, any> = {
        userId: profile.userId,
        name: profile.name || 'Người dùng SoulCare',
        email: profile.email,
        role: profile.role || 'user',
        currentOrbTheme: profile.currentOrbTheme || 'mint',
        createdAt: now,
        updatedAt: now,
      };
      if (profile.sosBuddy) {
        newDoc.sosBuddy = cleanFirestoreData(profile.sosBuddy);
      }
      await setDoc(userRef, cleanFirestoreData(newDoc));
    } else {
      const data = (existingSnap.data() || {}) as UserProfileDoc;
      const updatedData: Record<string, any> = {
        ...data,
        updatedAt: now,
      };
      if (profile.name !== undefined) updatedData.name = profile.name;
      if (profile.email !== undefined) updatedData.email = profile.email;
      if (profile.role !== undefined) updatedData.role = profile.role;
      if (profile.currentOrbTheme !== undefined) updatedData.currentOrbTheme = profile.currentOrbTheme;
      if (profile.sosBuddy !== undefined) {
        if (profile.sosBuddy === null) {
          delete updatedData.sosBuddy;
        } else {
          updatedData.sosBuddy = cleanFirestoreData(profile.sosBuddy);
        }
      }
      const cleaned = cleanFirestoreData(updatedData);
      await setDoc(userRef, cleaned, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(userId: string, onData: (profile: UserProfileDoc | null) => void): Unsubscribe {
  const path = `users/${userId}`;
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as UserProfileDoc);
      } else {
        onData(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// 2. Mood Logs Subcollection (/users/{userId}/moodLogs/{date})
export async function saveMoodLog(userId: string, entry: MoodEntry): Promise<void> {
  const moodDocId = entry.date.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/moodLogs/${moodDocId}`;
  try {
    const moodRef = doc(db, 'users', userId, 'moodLogs', moodDocId);
    const data = cleanFirestoreData({
      userId,
      date: entry.date,
      dayLabel: entry.dayLabel || '',
      emotion: entry.emotion || 'Bình thường',
      note: entry.note || '',
      tags: entry.tags || [],
      timestamp: entry.timestamp || Date.now(),
    });
    await setDoc(moodRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeMoodLogs(userId: string, onData: (entries: MoodEntry[]) => void): Unsubscribe {
  const path = `users/${userId}/moodLogs`;
  const q = query(collection(db, 'users', userId, 'moodLogs'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: MoodEntry[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          date: d.date,
          dayLabel: d.dayLabel,
          emotion: d.emotion,
          note: d.note,
          tags: d.tags,
          timestamp: d.timestamp,
        });
      });
      list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 3. Quiz Results Subcollection (/users/{userId}/quizResults/{quizId})
export async function saveQuizResult(userId: string, result: QuizResult): Promise<void> {
  const quizDocId = `quiz_${Date.now()}`;
  const path = `users/${userId}/quizResults/${quizDocId}`;
  try {
    const quizRef = doc(db, 'users', userId, 'quizResults', quizDocId);
    const data = cleanFirestoreData({
      userId,
      depressionPct: result.depressionPct ?? 0,
      anxietyPct: result.anxietyPct ?? 0,
      stressPct: result.stressPct ?? 0,
      sleepPct: result.sleepPct ?? 0,
      overallSummary: result.overallSummary || '',
      tier: result.tier || 'tier1',
      timestamp: result.timestamp || new Date().toLocaleDateString('vi-VN'),
    });
    await setDoc(quizRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeQuizResults(userId: string, onData: (results: QuizResult[]) => void): Unsubscribe {
  const path = `users/${userId}/quizResults`;
  const q = query(collection(db, 'users', userId, 'quizResults'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: QuizResult[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          depressionPct: d.depressionPct,
          anxietyPct: d.anxietyPct,
          stressPct: d.stressPct,
          sleepPct: d.sleepPct,
          overallSummary: d.overallSummary,
          tier: d.tier,
          timestamp: d.timestamp,
        });
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 4. Challenge Progress (/users/{userId}/challenges/{challengeId})
export async function saveChallengeProgress(userId: string, progress: UserChallengeProgress): Promise<void> {
  const path = `users/${userId}/challenges/${progress.challengeId}`;
  try {
    const chalRef = doc(db, 'users', userId, 'challenges', progress.challengeId);
    const data = cleanFirestoreData({
      userId,
      challengeId: progress.challengeId,
      challengeTitle: progress.challengeTitle || '',
      currentStreak: progress.currentStreak ?? 0,
      totalDays: progress.totalDays ?? 21,
      daysCompletedCount: progress.daysCompletedCount ?? 0,
      todayCompleted: !!progress.todayCompleted,
      lastCheckInDate: progress.lastCheckInDate || new Date().toISOString().split('T')[0],
    });
    await setDoc(chalRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeChallengeProgress(
  userId: string,
  challengeId: string,
  onData: (progress: UserChallengeProgress | null) => void
): Unsubscribe {
  const path = `users/${userId}/challenges/${challengeId}`;
  const chalRef = doc(db, 'users', userId, 'challenges', challengeId);
  return onSnapshot(
    chalRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onData({
          challengeId: d.challengeId,
          challengeTitle: d.challengeTitle,
          currentStreak: d.currentStreak,
          totalDays: d.totalDays,
          daysCompletedCount: d.daysCompletedCount,
          todayCompleted: d.todayCompleted,
          lastCheckInDate: d.lastCheckInDate,
        });
      } else {
        onData(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeUserChallenges(
  userId: string,
  onData: (progress: UserChallengeProgress | null) => void
): Unsubscribe {
  const path = `users/${userId}/challenges`;
  const q = query(collection(db, 'users', userId, 'challenges'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(null);
        return;
      }
      const list: UserChallengeProgress[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          challengeId: d.challengeId,
          challengeTitle: d.challengeTitle,
          currentStreak: d.currentStreak,
          totalDays: d.totalDays,
          daysCompletedCount: d.daysCompletedCount,
          todayCompleted: d.todayCompleted,
          lastCheckInDate: d.lastCheckInDate,
        });
      });
      onData(list[0] || null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 5. Appointments Collection (/appointments/{appointmentId})
export async function saveAppointment(appointment: Appointment): Promise<void> {
  const path = `appointments/${appointment.id}`;
  try {
    const apptRef = doc(db, 'appointments', appointment.id);
    const docData: Record<string, any> = {
      id: appointment.id,
      userId: appointment.userId || 'guest_user',
      userName: appointment.userName || 'Người dùng SoulCare',
      type: appointment.type || 'online',
      expertId: appointment.expertId || '',
      expertName: appointment.expertName || '',
      expertTitle: appointment.expertTitle || '',
      expertAvatar: appointment.expertAvatar || '',
      clinicId: appointment.clinicId || '',
      clinicName: appointment.clinicName || '',
      clinicAddress: appointment.clinicAddress || '',
      dateStr: appointment.dateStr || '',
      timeSlot: appointment.timeSlot || '',
      googleMeetLink: appointment.googleMeetLink || '',
      status: appointment.status || 'upcoming',
      userNotes: appointment.userNotes || '',
      createdAt: new Date().toISOString(),
    };

    if (appointment.doctorRecap) {
      docData.doctorRecap = cleanFirestoreData({
        formattedRecap: appointment.doctorRecap.formattedRecap || '',
        sentAt: appointment.doctorRecap.sentAt || new Date().toLocaleDateString('vi-VN'),
        isApproved: !!appointment.doctorRecap.isApproved,
      });
    }

    await setDoc(apptRef, cleanFirestoreData(docData), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserAppointments(userId: string, onData: (appts: Appointment[]) => void): Unsubscribe {
  const path = 'appointments';
  const q = query(collection(db, 'appointments'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id,
          userId: d.userId,
          userName: d.userName,
          type: d.type,
          expertId: d.expertId,
          expertName: d.expertName,
          expertTitle: d.expertTitle,
          expertAvatar: d.expertAvatar,
          clinicId: d.clinicId,
          clinicName: d.clinicName,
          clinicAddress: d.clinicAddress,
          dateStr: d.dateStr,
          timeSlot: d.timeSlot,
          googleMeetLink: d.googleMeetLink,
          googleCalendarSynced: false,
          status: d.status,
          userNotes: d.userNotes,
          doctorRecap: d.doctorRecap || undefined,
        });
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllAppointments(onData: (appts: Appointment[]) => void): Unsubscribe {
  const path = 'appointments';
  const q = query(collection(db, 'appointments'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id,
          userId: d.userId,
          userName: d.userName,
          type: d.type,
          expertId: d.expertId,
          expertName: d.expertName,
          expertTitle: d.expertTitle,
          expertAvatar: d.expertAvatar,
          clinicId: d.clinicId,
          clinicName: d.clinicName,
          clinicAddress: d.clinicAddress,
          dateStr: d.dateStr,
          timeSlot: d.timeSlot,
          googleMeetLink: d.googleMeetLink,
          googleCalendarSynced: false,
          status: d.status,
          userNotes: d.userNotes,
          doctorRecap: d.doctorRecap || undefined,
        });
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const path = `appointments/${appointmentId}`;
  try {
    const apptRef = doc(db, 'appointments', appointmentId);
    await deleteDoc(apptRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

