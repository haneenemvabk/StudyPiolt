import type { AppData } from '@/models/types';

export function studyInsights(data: AppData) {
  const observations: string[] = [];
  const completed = data.sessions.filter((session) => session.status === 'completed');
  const planned = data.sessions.filter((session) => session.status !== 'missed');
  if (planned.length >= 4) {
    const rate = completed.length / planned.length;
    if (rate < 0.5) observations.push('You complete fewer than half of planned sessions, so shorter blocks may be more realistic.');
    if (rate >= 0.75) observations.push('You complete most planned sessions once they are on the calendar.');
  }

  const longTasks = data.tasks.filter((task) => task.estimatedMinutes >= 90);
  const postponedLong = longTasks.filter((task) => task.status === 'missed' || task.status === 'not_started');
  if (longTasks.length >= 2 && postponedLong.length >= 2) {
    observations.push('You frequently postpone tasks with estimated durations over 90 minutes.');
  }

  const evening = data.availability.preferredTime === 'Evenings';
  const weekdayCompletions = completed.filter((session) => {
    const day = new Date(`${session.date}T12:00:00`).getDay();
    return day >= 1 && day <= 5;
  });
  if (evening && weekdayCompletions.length >= 3) {
    observations.push('You complete most study sessions on weekday evenings.');
  }

  const overrun = data.tasks.filter((task) => task.status === 'completed' && task.estimatedMinutes <= 30 && data.sessions.some((session) => session.taskId === task.id && session.minutes > task.estimatedMinutes));
  if (data.tasks.filter((task) => task.status === 'completed').length >= 3) {
    const avgEstimate = data.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0) / Math.max(1, data.tasks.length);
    if (avgEstimate < 40) observations.push('Your estimates cluster under 40 minutes. If sessions often run long, try adding a buffer.');
    if (overrun.length >= 2) observations.push('You usually underestimate assignment duration.');
  }

  if (!observations.length) observations.push('Keep logging sessions. Insights appear from your actual study activity, not personality claims.');
  return observations.slice(0, 4);
}
