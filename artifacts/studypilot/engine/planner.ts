import { addDays, daysUntil, isoDate, makeId, preferredStartTime, weekdayLabel } from '@/engine/dates';
import type { AppData, PlanConflict, Priority, StudySession, Task } from '@/models/types';

const PRIORITY_SCORE: Record<Priority, number> = { high: 30, medium: 16, low: 8 };

type Candidate = {
  taskId?: string;
  courseId: string;
  title: string;
  topic?: string;
  type?: Task['type'];
  minutes: number;
  priority: Priority;
  deadline?: string;
  score: number;
  reason: string;
};

function nearestExamDate(data: Pick<AppData, 'courses' | 'exams'>, courseId: string) {
  const courseExam = data.courses.find((course) => course.id === courseId)?.examDate;
  const extra = data.exams.filter((exam) => exam.courseId === courseId).map((exam) => exam.date);
  return [courseExam, ...extra].filter(Boolean).sort()[0];
}

function feedbackBoost(data: AppData, task: Task) {
  const related = data.sessions.filter((session) => session.taskId === task.id && session.feedback);
  if (related.some((session) => session.feedback === 'more_practice' || session.feedback === 'difficult')) return 12;
  if (related.some((session) => session.feedback === 'easy')) return -4;
  return 0;
}

function buildCandidates(data: AppData): Candidate[] {
  const openTasks = data.tasks.filter((task) => task.status !== 'completed');
  const fromTasks = openTasks.map((task) => {
    const until = daysUntil(task.deadline);
    const exam = nearestExamDate(data, task.courseId);
    const examUntil = exam ? daysUntil(exam) : 40;
    const missed = task.status === 'missed' ? 18 : 0;
    const reason = until <= 3
      ? `This is due ${until <= 0 ? 'today' : `in ${until} day${until === 1 ? '' : 's'}`} and should stay at the front of your plan.`
      : examUntil <= 7
        ? `Your exam is in ${examUntil} day${examUntil === 1 ? '' : 's'}, so this work still belongs in the next available block.`
        : task.priority === 'high'
          ? 'This is a high-priority unfinished task.'
          : 'Scheduled to keep your weekly study rhythm realistic.';
    return {
      taskId: task.id,
      courseId: task.courseId,
      title: task.title,
      type: task.type,
      minutes: Math.max(15, task.estimatedMinutes),
      priority: task.priority,
      deadline: task.deadline,
      score: PRIORITY_SCORE[task.priority] + Math.max(0, 18 - until) + Math.max(0, 12 - examUntil) + missed + task.difficulty * 2 + feedbackBoost(data, task),
      reason,
    } satisfies Candidate;
  });

  const fromTopics = data.courses.flatMap((course) => {
    const exam = nearestExamDate(data, course.id);
    return course.topics.filter((topic) => !topic.reviewed).map((topic) => {
      const examUntil = exam ? daysUntil(exam) : 30;
      return {
        taskId: undefined,
        courseId: course.id,
        title: `Review ${topic.name}`,
        topic: topic.name,
        minutes: data.availability.sessionLength,
        priority: examUntil <= 7 ? 'high' : 'medium',
        deadline: exam,
        score: 10 + Math.max(0, 14 - examUntil),
        reason: exam
          ? `Your exam is in ${Math.max(0, examUntil)} days and ${topic.name} has not been reviewed yet.`
          : `${topic.name} is still unmarked, so a short review keeps the course moving.`,
      } satisfies Candidate;
    });
  });

  const merged = [...fromTasks, ...fromTopics];
  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = `${item.courseId}:${item.taskId ?? item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.score - a.score);
}

function availableDays(data: AppData, horizon = 14) {
  const days: { date: string; remaining: number }[] = [];
  for (let index = 0; index < horizon; index += 1) {
    const date = addDays(index);
    if (!data.availability.days.includes(weekdayLabel(date))) continue;
    days.push({ date, remaining: Math.round(data.availability.hoursPerDay * 60) });
  }
  return days;
}

export function computeConflict(data: AppData): PlanConflict {
  const remainingMinutes = data.tasks.filter((task) => task.status !== 'completed').reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const examDates = [
    ...data.courses.map((course) => course.examDate).filter(Boolean) as string[],
    ...data.exams.map((exam) => exam.date),
  ].sort();
  const nextExam = examDates[0];
  if (!nextExam) return remainingMinutes > data.availability.hoursPerDay * 60 * 7
    ? {
      remainingMinutes,
      availableMinutes: Math.round(data.availability.hoursPerDay * 60 * 7),
      beforeLabel: 'this week',
      message: `You have ${Math.round(remainingMinutes / 60 * 10) / 10} hours of work remaining and about ${data.availability.hoursPerDay * 7} available study hours this week.`,
      priorityTitles: data.tasks.filter((task) => task.status !== 'completed').sort((a, b) => PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority]).slice(0, 3).map((task) => task.title),
    }
    : null;

  const daysLeft = Math.max(1, daysUntil(nextExam));
  const availableMinutes = availableDays(data, daysLeft).reduce((sum, day) => sum + day.remaining, 0);
  if (remainingMinutes <= availableMinutes) return null;
  const priorityTitles = data.tasks.filter((task) => task.status !== 'completed').sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline)).slice(0, 3).map((task) => task.title);
  return {
    remainingMinutes,
    availableMinutes,
    beforeLabel: `your exam on ${nextExam}`,
    message: `You have ${Math.round(remainingMinutes / 60 * 10) / 10} hours of work remaining but only ${Math.round(availableMinutes / 60 * 10) / 10} available study hours before your exam.`,
    priorityTitles,
  };
}

export function generateStudyPlan(data: AppData): { sessions: StudySession[]; conflict: PlanConflict } {
  const days = availableDays(data);
  const kept = data.sessions.filter((session) => session.status === 'completed' || session.status === 'in_progress');
  const occupied = new Map<string, number>();
  kept.forEach((session) => occupied.set(session.date, (occupied.get(session.date) ?? 0) + session.minutes));
  days.forEach((day) => {
    day.remaining = Math.max(0, day.remaining - (occupied.get(day.date) ?? 0));
  });

  const sessions: StudySession[] = [...kept];
  const candidates = buildCandidates(data);
  const startTime = preferredStartTime(data.availability.preferredTime);

  for (const candidate of candidates) {
    const remainingWork = candidate.minutes;
    let leftover = remainingWork;
    for (const day of days) {
      if (leftover <= 0) break;
      if (day.remaining < 15) continue;
      const chunk = Math.min(leftover, day.remaining, data.availability.sessionLength);
      if (chunk < 15) continue;
      sessions.push({
        id: makeId('session'),
        taskId: candidate.taskId,
        title: candidate.title,
        courseId: candidate.courseId,
        topic: candidate.topic,
        type: candidate.type,
        date: day.date,
        startTime,
        minutes: chunk,
        priority: candidate.priority,
        reason: candidate.reason,
        relatedDeadline: candidate.deadline,
        status: 'not_started',
      });
      day.remaining -= chunk;
      leftover -= chunk;
    }
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  return { sessions, conflict: computeConflict({ ...data, sessions }) };
}

export function redistributeMissed(data: AppData, missedSessionId: string): StudySession[] {
  const missed = data.sessions.find((session) => session.id === missedSessionId);
  if (!missed) return data.sessions;
  const without = data.sessions.map((session) => session.id === missedSessionId ? { ...session, status: 'missed' as const } : session);
  const days = availableDays({ ...data, sessions: without }, 16).filter((day) => day.date > isoDate());
  const occupied = new Map<string, number>();
  without.forEach((session) => {
    if (session.status === 'completed' || session.status === 'missed') return;
    occupied.set(session.date, (occupied.get(session.date) ?? 0) + session.minutes);
  });
  let leftover = missed.minutes;
  const additions: StudySession[] = [];
  for (const day of days) {
    const remaining = Math.max(0, Math.round(data.availability.hoursPerDay * 60) - (occupied.get(day.date) ?? 0));
    if (remaining < 15 || leftover <= 0) continue;
    const chunk = Math.min(leftover, remaining, data.availability.sessionLength);
    additions.push({
      ...missed,
      id: makeId('session'),
      date: day.date,
      minutes: chunk,
      status: 'not_started',
      reason: `Redistributed after a missed ${missed.title} session so one day does not absorb the entire catch-up.`,
    });
    occupied.set(day.date, (occupied.get(day.date) ?? 0) + chunk);
    leftover -= chunk;
  }
  return [...without, ...additions];
}

export function moveSession(sessions: StudySession[], sessionId: string, date: string): StudySession[] {
  return sessions.map((session) => session.id === sessionId ? { ...session, date, status: session.status === 'missed' ? 'not_started' : session.status } : session);
}

export function wouldExceedCapacity(sessions: StudySession[], sessionId: string, date: string, hoursPerDay: number): boolean {
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) return false;
  const dailyCap = Math.round(hoursPerDay * 60);
  const otherMinutes = sessions.filter((item) => item.id !== sessionId && item.date === date && item.status !== 'completed' && item.status !== 'missed').reduce((sum, item) => sum + item.minutes, 0);
  return otherMinutes + session.minutes > dailyCap;
}
