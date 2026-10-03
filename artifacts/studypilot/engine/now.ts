import { daysUntil, isoDate, weekdayLabel } from '@/engine/dates';
import type { AppData, StudySession } from '@/models/types';

export function todaySessions(data: Pick<AppData, 'sessions'>) {
  const today = isoDate();
  return data.sessions.filter((session) => session.date === today && session.status !== 'completed');
}

export function isStudyWindowOpen(data: Pick<AppData, 'availability'>, now = new Date()) {
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
  return data.availability.days.includes(day);
}

export function pickNowSession(data: AppData): StudySession | undefined {
  const today = isoDate();
  const openToday = data.sessions
    .filter((session) => session.date === today && session.status !== 'completed' && session.status !== 'missed')
    .sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return rank[b.priority] - rank[a.priority] || a.minutes - b.minutes;
    });
  if (openToday[0]) return openToday[0];

  const upcoming = data.sessions
    .filter((session) => session.status !== 'completed' && session.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0];
}

export function nowReason(data: AppData, session?: StudySession) {
  if (!session) return 'Add a course or generate a plan to get a next best action.';
  const task = data.tasks.find((item) => item.id === session.taskId);
  const course = data.courses.find((item) => item.id === session.courseId);
  const exam = course?.examDate ?? data.exams.find((item) => item.courseId === session.courseId)?.date;
  if (exam && daysUntil(exam) <= 7 && session.topic) {
    return `Your exam is in ${Math.max(0, daysUntil(exam))} days and ${session.topic} has not been reviewed yet.`;
  }
  if (task) {
    const until = daysUntil(task.deadline);
    if (until <= 1) return 'This deadline is here. Starting now protects the rest of your week.';
    if (task.status === 'missed') return 'This was missed earlier, so it is the highest-leverage catch-up.';
  }
  return session.reason;
}

export function availableMinutesToday(data: Pick<AppData, 'availability' | 'sessions'>) {
  const planned = todaySessions(data).reduce((sum, session) => sum + session.minutes, 0);
  const cap = Math.round(data.availability.hoursPerDay * 60);
  return { cap, planned, weekday: weekdayLabel(isoDate()) };
}
