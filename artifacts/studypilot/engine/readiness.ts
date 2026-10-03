import { daysUntil } from '@/engine/dates';
import type { AppData, Course } from '@/models/types';

export type ReadinessLevel = 'Early preparation' | 'Developing' | 'Strong preparation' | 'Needs attention';

export function courseProgress(data: Pick<AppData, 'tasks' | 'sessions'>, course: Course) {
  const reviewed = course.topics.filter((topic) => topic.reviewed).length;
  const topicScore = course.topics.length ? reviewed / course.topics.length : 0;
  const courseTasks = data.tasks.filter((task) => task.courseId === course.id);
  const assignmentScore = courseTasks.length ? courseTasks.filter((task) => task.status === 'completed').length / courseTasks.length : topicScore;
  const practiceSessions = data.sessions.filter((session) => session.courseId === course.id);
  const practiceScore = practiceSessions.length ? practiceSessions.filter((session) => session.status === 'completed').length / practiceSessions.length : topicScore;
  return Math.round((topicScore * 0.45 + assignmentScore * 0.35 + practiceScore * 0.2) * 100);
}

export function examReadiness(data: AppData, course: Course) {
  const examDate = course.examDate ?? data.exams.find((exam) => exam.courseId === course.id)?.date;
  const reviewed = course.topics.filter((topic) => topic.reviewed).length;
  const topicsTotal = course.topics.length;
  const courseTasks = data.tasks.filter((task) => task.courseId === course.id);
  const assignmentsDone = courseTasks.filter((task) => task.status === 'completed').length;
  const courseSessions = data.sessions.filter((session) => session.courseId === course.id);
  const practice = courseSessions.length ? Math.round((courseSessions.filter((session) => session.status === 'completed').length / courseSessions.length) * 100) : 0;
  const ratio = topicsTotal ? reviewed / topicsTotal : courseProgress(data, course) / 100;
  let level: ReadinessLevel = 'Early preparation';
  if (!examDate) level = 'Early preparation';
  else if (ratio < 0.4 || practice < 25) level = 'Needs attention';
  else if (ratio < 0.7) level = 'Developing';
  else level = 'Strong preparation';

  const days = examDate ? Math.max(0, daysUntil(examDate)) : undefined;
  const remainingTopics = Math.max(0, topicsTotal - reviewed);
  const explanation = level === 'Needs attention'
    ? `Your preparation needs attention because ${remainingTopics || 'several'} topic${remainingTopics === 1 ? '' : 's'} remain unreviewed and your practice activity is limited.`
    : level === 'Strong preparation'
      ? 'Your preparation looks strong because most tracked topics are reviewed and recent study sessions are being completed.'
      : level === 'Developing'
        ? 'Your preparation is developing. Keep reviewing remaining topics and complete the next planned sessions.'
        : 'It is still early. StudyPilot is tracking activity in the app, not predicting exam results.';

  return {
    examDate,
    daysRemaining: days,
    reviewed,
    topicsTotal,
    assignmentsDone,
    assignmentsTotal: courseTasks.length,
    practice,
    level,
    explanation,
  };
}
