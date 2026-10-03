import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { addDays, isoDate, makeId, monthKey } from '@/engine/dates';
import { consumePlanningUsage, remainingAiActions } from '@/engine/limits';
import { pickNowSession } from '@/engine/now';
import { generateStudyPlan, moveSession, redistributeMissed } from '@/engine/planner';
import { courseProgress } from '@/engine/readiness';
import { DEFAULT_NOTIFICATIONS } from '@/services/notifications';
import type {
  AppData,
  ClassMeeting,
  Course,
  PlanConflict,
  Exam,
  NotificationPrefs,
  SessionFeedback,
  StudyAvailability,
  StudySession,
  Task,
  TaskStatus,
  UploadedMaterial,
} from '@/models/types';

export type { Course, Exam, NotificationPrefs, Priority, SessionFeedback, StudyAvailability, StudySession, Task, TaskStatus, TaskType } from '@/models/types';

const STORAGE_KEY = '@studypilot/local-state-v2';
const LEGACY_KEY = '@studypilot/local-state';

const emptyData: AppData = {
  onboardingComplete: false,
  isDemo: false,
  displayName: 'Student',
  courses: [],
  exams: [],
  tasks: [],
  sessions: [],
  materials: [],
  availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hoursPerDay: 2, preferredTime: 'Evenings', sessionLength: 45 },
  completedMinutes: 0,
  subscription: { entitlement: 'free', source: 'none' },
  notifications: DEFAULT_NOTIFICATIONS,
  aiUsage: { monthKey: monthKey(), planningActions: 0 },
};

function demoData(): AppData {
  const calculus = 'course-calculus';
  const cs = 'course-cs';
  const physics = 'course-physics';
  return {
    onboardingComplete: true,
    isDemo: true,
    displayName: 'Haneen',
    availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hoursPerDay: 2.25, preferredTime: 'Evenings', sessionLength: 45 },
    completedMinutes: 165,
    subscription: { entitlement: 'free', source: 'none' },
    notifications: DEFAULT_NOTIFICATIONS,
    aiUsage: { monthKey: monthKey(), planningActions: 2 },
    courses: [
      {
        id: calculus, name: 'Analytical Geometry & Calculus II', code: 'MATH112', instructor: 'Dr. Nadia Salem', color: '#4e8f95',
        examDate: addDays(6),
        schedule: [{ day: 'Mon', start: '10:00', end: '11:15' }, { day: 'Wed', start: '10:00', end: '11:15' }],
        topics: ['Limits', 'Derivatives', 'Applications', 'Integrals', 'Differential equations'].map((name, index) => ({ id: `math-${index}`, name, reviewed: index < 3 })),
      },
      {
        id: cs, name: 'Computer Science', code: 'CSC417', instructor: 'Prof. Karim Youssef', color: '#7168a8',
        examDate: addDays(14),
        schedule: [{ day: 'Tue', start: '13:00', end: '14:30' }],
        topics: ['Data structures', 'Sorting algorithms', 'Graphs', 'Dynamic programming'].map((name, index) => ({ id: `cs-${index}`, name, reviewed: index < 2 })),
      },
      {
        id: physics, name: 'Physics', code: 'PHYS101', instructor: 'Dr. Omar Hassan', color: '#c68c5a',
        examDate: addDays(21),
        schedule: [{ day: 'Thu', start: '09:00', end: '10:30' }],
        topics: ['Kinematics', 'Forces', 'Energy', 'Momentum'].map((name, index) => ({ id: `physics-${index}`, name, reviewed: index < 3 })),
      },
    ],
    exams: [
      { id: 'exam-1', courseId: calculus, title: 'Midterm', date: addDays(6) },
      { id: 'exam-2', courseId: cs, title: 'Algorithms exam', date: addDays(14) },
      { id: 'exam-3', courseId: physics, title: 'Mechanics exam', date: addDays(21) },
    ],
    tasks: [
      { id: 'task-1', title: 'Review Applications of Derivatives', courseId: calculus, type: 'Lecture review', deadline: addDays(2), estimatedMinutes: 35, priority: 'high', difficulty: 2, status: 'not_started', notes: 'Focus on optimization examples.' },
      { id: 'task-2', title: 'Finish Assignment 2', courseId: cs, type: 'Assignment', deadline: addDays(4), estimatedMinutes: 55, priority: 'high', difficulty: 3, status: 'not_started' },
      { id: 'task-3', title: 'Review Lecture 6', courseId: physics, type: 'Lecture review', deadline: addDays(5), estimatedMinutes: 35, priority: 'medium', difficulty: 1, status: 'not_started' },
      { id: 'task-4', title: 'Practice integration by parts', courseId: calculus, type: 'Practice', deadline: addDays(7), estimatedMinutes: 45, priority: 'medium', difficulty: 3, status: 'in_progress' },
      { id: 'task-5', title: 'Read graph traversal notes', courseId: cs, type: 'Reading', deadline: addDays(9), estimatedMinutes: 30, priority: 'low', difficulty: 2, status: 'completed' },
    ],
    sessions: [
      { id: 'session-1', taskId: 'task-1', title: 'Applications of Derivatives', courseId: calculus, topic: 'Applications', date: isoDate(), startTime: '19:00', minutes: 45, priority: 'high', reason: 'Your exam is in 6 days and this topic has not been reviewed yet.', relatedDeadline: addDays(6), status: 'not_started' },
      { id: 'session-2', taskId: 'task-2', title: 'Finish Assignment 2', courseId: cs, date: isoDate(), startTime: '19:45', minutes: 55, priority: 'high', reason: 'This assignment is due soon and has a high estimated difficulty.', relatedDeadline: addDays(4), status: 'not_started' },
      { id: 'session-3', taskId: 'task-3', title: 'Review Lecture 6', courseId: physics, date: isoDate(), minutes: 35, priority: 'medium', reason: 'A short review keeps your weekly rhythm consistent.', status: 'not_started' },
    ],
    materials: [
      { id: 'mat-1', courseId: calculus, filename: 'MATH112-syllabus.pdf', kind: 'syllabus', addedAt: isoDate() },
    ],
  };
}

function migrate(raw: Record<string, unknown>): AppData {
  const courses = Array.isArray(raw.courses) ? raw.courses.map((item) => {
    const course = item as Course & { progress?: number; schedule?: ClassMeeting[] };
    return { ...course, schedule: course.schedule ?? [], topics: course.topics ?? [] };
  }) : [];
  return {
    ...emptyData,
    ...raw,
    displayName: typeof raw.displayName === 'string' ? raw.displayName : emptyData.displayName,
    courses,
    exams: Array.isArray(raw.exams) ? raw.exams as Exam[] : courses.filter((course) => course.examDate).map((course) => ({ id: makeId('exam'), courseId: course.id, title: `${course.code} exam`, date: course.examDate as string })),
    tasks: Array.isArray(raw.tasks) ? raw.tasks as Task[] : [],
    sessions: Array.isArray(raw.sessions) ? raw.sessions as StudySession[] : [],
    materials: Array.isArray(raw.materials) ? raw.materials as UploadedMaterial[] : [],
    availability: { ...emptyData.availability, ...(raw.availability as StudyAvailability | undefined) },
    notifications: { ...DEFAULT_NOTIFICATIONS, ...(raw.notifications as NotificationPrefs | undefined) },
    subscription: { ...emptyData.subscription, ...(raw.subscription as AppData['subscription'] | undefined) },
    aiUsage: { monthKey: monthKey(), planningActions: (raw.aiUsage as AppData['aiUsage'] | undefined)?.planningActions ?? 0 },
    onboardingComplete: Boolean(raw.onboardingComplete),
    isDemo: Boolean(raw.isDemo),
    completedMinutes: Number(raw.completedMinutes ?? 0),
  };
}

type ContextValue = AppData & {
  hydrated: boolean;
  lastConflict: PlanConflict;
  recommendedSession: StudySession | undefined;
  remainingMinutes: number;
  remainingAiActions: number;
  completeOnboarding: (data?: Partial<AppData>) => void;
  loadDemoData: () => void;
  addCourse: (course: Pick<Course, 'name' | 'code' | 'color' | 'instructor' | 'schedule'>) => { ok: boolean; reason?: 'course-limit' };
  updateCourse: (id: string, patch: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  addExam: (exam: Omit<Exam, 'id'>) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  toggleTopic: (courseId: string, topicId: string) => void;
  addTopics: (courseId: string, topicNames: string[], source?: Course['topics'][number]['source']) => void;
  addMaterial: (material: Omit<UploadedMaterial, 'id' | 'addedAt'>) => void;
  setAvailability: (availability: StudyAvailability) => void;
  setNotifications: (notifications: NotificationPrefs) => void;
  generatePlan: () => { ok: boolean; conflict: PlanConflict; reason?: 'ai-limit' };
  markSessionStatus: (id: string, status: TaskStatus) => void;
  recordFeedback: (sessionId: string, feedback: SessionFeedback) => void;
  rescheduleAutomatically: (sessionId: string) => { ok: boolean; reason?: 'pro-required' | 'ai-limit' };
  rescheduleManually: (sessionId: string, date: string) => void;
  clearDemoData: () => void;
  resetAll: () => void;
  activateMockPro: (productId: 'studypilot_pro_monthly' | 'studypilot_pro_yearly') => void;
  restorePurchases: () => void;
};

const StudyPilotContext = createContext<ContextValue | null>(null);

export function StudyPilotProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [hydrated, setHydrated] = useState(false);
  const [lastConflict, setLastConflict] = useState<PlanConflict>(null);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(LEGACY_KEY)]).then(([current, legacy]) => {
      const source = current ?? legacy;
      if (source) {
        try { setData(migrate(JSON.parse(source) as Record<string, unknown>)); } catch { setData(emptyData); }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const update = (updater: (current: AppData) => AppData) => setData((current) => updater(current));
  const remainingMinutes = useMemo(() => data.tasks.filter((task) => task.status !== 'completed').reduce((sum, task) => sum + task.estimatedMinutes, 0), [data.tasks]);
  const recommendedSession = useMemo(() => pickNowSession(data), [data]);
  const haptic = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); };

  const completeOnboarding = (extra: Partial<AppData> = {}) => { update((current) => ({ ...current, ...extra, onboardingComplete: true })); haptic(); };
  const loadDemoData = () => { setData(demoData()); haptic(); };
  const addCourse = (course: Pick<Course, 'name' | 'code' | 'color' | 'instructor' | 'schedule'>) => {
    let result: { ok: boolean; reason?: 'course-limit' } = { ok: true };
    update((current) => {
      if (current.subscription.entitlement !== 'pro' && current.courses.length >= 3) {
        result = { ok: false, reason: 'course-limit' };
        return current;
      }
      return { ...current, courses: [...current.courses, { ...course, schedule: course.schedule ?? [], id: makeId('course'), topics: [] }] };
    });
    haptic();
    return result;
  };
  const updateCourse = (id: string, patch: Partial<Course>) => update((current) => ({
    ...current,
    courses: current.courses.map((course) => course.id === id ? { ...course, ...patch } : course),
  }));
  const deleteCourse = (id: string) => update((current) => ({
    ...current,
    courses: current.courses.filter((course) => course.id !== id),
    tasks: current.tasks.filter((task) => task.courseId !== id),
    sessions: current.sessions.filter((session) => session.courseId !== id),
    exams: current.exams.filter((exam) => exam.courseId !== id),
    materials: current.materials.filter((material) => material.courseId !== id),
  }));
  const addTask = (task: Omit<Task, 'id' | 'status'>) => {
    update((current) => ({ ...current, tasks: [...current.tasks, { ...task, id: makeId('task'), status: 'not_started' }] }));
    haptic();
  };
  const updateTask = (id: string, patch: Partial<Task>) => update((current) => ({
    ...current,
    tasks: current.tasks.map((task) => task.id === id ? { ...task, ...patch } : task),
  }));
  const updateTaskStatus = (id: string, status: TaskStatus) => {
    update((current) => {
      const task = current.tasks.find((item) => item.id === id);
      const delta = task && status === 'completed' && task.status !== 'completed' ? task.estimatedMinutes : 0;
      return {
        ...current,
        completedMinutes: current.completedMinutes + delta,
        tasks: current.tasks.map((item) => item.id === id ? { ...item, status } : item),
        sessions: current.sessions.map((session) => session.taskId === id ? { ...session, status } : session),
      };
    });
    haptic();
  };
  const addExam = (exam: Omit<Exam, 'id'>) => update((current) => ({
    ...current,
    exams: [...current.exams, { ...exam, id: makeId('exam') }],
    courses: current.courses.map((course) => {
      if (course.id !== exam.courseId) return course;
      if (!course.examDate || exam.date < course.examDate) return { ...course, examDate: exam.date };
      return course;
    }),
  }));
  const updateExam = (id: string, patch: Partial<Exam>) => update((current) => {
    const exams = current.exams.map((exam) => exam.id === id ? { ...exam, ...patch } : exam);
    const courses = current.courses.map((course) => {
      const next = exams.filter((exam) => exam.courseId === course.id).map((exam) => exam.date).sort()[0];
      return next ? { ...course, examDate: next } : course;
    });
    return { ...current, exams, courses };
  });
  const toggleTopic = (courseId: string, topicId: string) => update((current) => ({
    ...current,
    courses: current.courses.map((course) => course.id === courseId ? { ...course, topics: course.topics.map((topic) => topic.id === topicId ? { ...topic, reviewed: !topic.reviewed } : topic) } : course),
  }));
  const addTopics = (courseId: string, topicNames: string[], source: Course['topics'][number]['source'] = 'manual') => update((current) => ({
    ...current,
    courses: current.courses.map((course) => {
      if (course.id !== courseId) return course;
      const existing = new Set(course.topics.map((topic) => topic.name.toLowerCase()));
      const additions = topicNames.filter((name) => name.trim() && !existing.has(name.trim().toLowerCase())).map((name) => ({ id: makeId('topic'), name: name.trim(), reviewed: false, source }));
      return { ...course, topics: [...course.topics, ...additions] };
    }),
  }));
  const addMaterial = (material: Omit<UploadedMaterial, 'id' | 'addedAt'>) => update((current) => ({
    ...current,
    materials: [...current.materials, { ...material, id: makeId('material'), addedAt: isoDate() }],
  }));
  const setAvailability = (availability: StudyAvailability) => update((current) => ({ ...current, availability }));
  const setNotifications = (notifications: NotificationPrefs) => update((current) => ({ ...current, notifications }));
  const generatePlan = () => {
    let result: { ok: boolean; conflict: PlanConflict; reason?: 'ai-limit' } = { ok: true, conflict: null };
    update((current) => {
      if (remainingAiActions(current) <= 0) {
        result = { ok: false, conflict: null, reason: 'ai-limit' };
        return current;
      }
      const withUsage = consumePlanningUsage(current);
      const planned = generateStudyPlan(withUsage);
      result = { ok: true, conflict: planned.conflict };
      setLastConflict(planned.conflict);
      return { ...withUsage, sessions: planned.sessions };
    });
    haptic();
    return result;
  };
  const markSessionStatus = (id: string, status: TaskStatus) => update((current) => {
    const session = current.sessions.find((item) => item.id === id);
    const minutes = session && status === 'completed' && session.status !== 'completed' ? session.minutes : 0;
    return {
      ...current,
      completedMinutes: current.completedMinutes + minutes,
      sessions: current.sessions.map((item) => item.id === id ? { ...item, status } : item),
      tasks: session?.taskId ? current.tasks.map((task) => task.id === session.taskId ? { ...task, status } : task) : current.tasks,
    };
  });
  const recordFeedback = (sessionId: string, feedback: SessionFeedback) => update((current) => ({
    ...current,
    sessions: current.sessions.map((session) => session.id === sessionId ? { ...session, feedback } : session),
  }));
  const rescheduleAutomatically = (sessionId: string) => {
    let result: { ok: boolean; reason?: 'pro-required' | 'ai-limit' } = { ok: true };
    update((current) => {
      if (current.subscription.entitlement !== 'pro') {
        result = { ok: false, reason: 'pro-required' };
        return current;
      }
      if (remainingAiActions(current) <= 0) {
        result = { ok: false, reason: 'ai-limit' };
        return current;
      }
      const withUsage = consumePlanningUsage(current);
      return { ...withUsage, sessions: redistributeMissed(withUsage, sessionId) };
    });
    haptic();
    return result;
  };
  const rescheduleManually = (sessionId: string, date: string) => update((current) => ({
    ...current,
    sessions: moveSession(current.sessions, sessionId, date),
  }));
  const clearDemoData = () => update((current) => ({ ...emptyData, onboardingComplete: true, availability: current.availability, subscription: current.subscription }));
  const resetAll = () => { setData(emptyData); haptic(); };
  const activateMockPro = (productId: 'studypilot_pro_monthly' | 'studypilot_pro_yearly') => {
    update((current) => ({ ...current, subscription: { entitlement: 'pro', source: 'mock-storekit', productId } }));
    haptic();
  };
  const restorePurchases = () => haptic();

  return (
    <StudyPilotContext.Provider value={{
      ...data,
      hydrated,
      lastConflict,
      recommendedSession,
      remainingMinutes,
      remainingAiActions: remainingAiActions(data),
      completeOnboarding,
      loadDemoData,
      addCourse,
      updateCourse,
      deleteCourse,
      addTask,
      updateTask,
      updateTaskStatus,
      addExam,
      updateExam,
      toggleTopic,
      addTopics,
      addMaterial,
      setAvailability,
      setNotifications,
      generatePlan,
      markSessionStatus,
      recordFeedback,
      rescheduleAutomatically,
      rescheduleManually,
      clearDemoData,
      resetAll,
      activateMockPro,
      restorePurchases,
    }}>
      {children}
    </StudyPilotContext.Provider>
  );
}

export function useStudyPilot() {
  const value = useContext(StudyPilotContext);
  if (!value) throw new Error('useStudyPilot must be used inside StudyPilotProvider');
  return value;
}

export function useCourseProgress(course: Course) {
  const { tasks, sessions } = useStudyPilot();
  return courseProgress({ tasks, sessions }, course);
}
