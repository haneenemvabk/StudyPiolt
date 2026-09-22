import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'missed';
export type Priority = 'high' | 'medium' | 'low';
export type TaskType = 'Assignment' | 'Exam prep' | 'Reading' | 'Lecture review' | 'Practice' | 'Project' | 'Quiz prep' | 'Custom';

export type Course = {
  id: string;
  name: string;
  code: string;
  instructor?: string;
  color: string;
  progress: number;
  topics: { id: string; name: string; reviewed: boolean }[];
  examDate?: string;
};

export type Task = {
  id: string;
  title: string;
  courseId: string;
  type: TaskType;
  deadline: string;
  estimatedMinutes: number;
  priority: Priority;
  difficulty: 1 | 2 | 3;
  status: TaskStatus;
  notes?: string;
};

export type StudySession = {
  id: string;
  taskId: string;
  title: string;
  courseId: string;
  date: string;
  minutes: number;
  priority: Priority;
  reason: string;
  status: TaskStatus;
};

type AppData = {
  onboardingComplete: boolean;
  isDemo: boolean;
  courses: Course[];
  tasks: Task[];
  sessions: StudySession[];
  availability: {
    days: string[];
    hoursPerDay: number;
    preferredTime: string;
    sessionLength: number;
  };
  completedMinutes: number;
};

type ContextValue = AppData & {
  hydrated: boolean;
  recommendedTask: Task | undefined;
  recommendedCourse: Course | undefined;
  remainingMinutes: number;
  completeOnboarding: (data?: Partial<AppData>) => void;
  loadDemoData: () => void;
  addCourse: (course: Pick<Course, 'name' | 'code' | 'color' | 'instructor'>) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  toggleTopic: (courseId: string, topicId: string) => void;
  generatePlan: () => void;
  clearDemoData: () => void;
  resetAll: () => void;
};

const STORAGE_KEY = '@studypilot/local-state';
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyData: AppData = {
  onboardingComplete: false,
  isDemo: false,
  courses: [],
  tasks: [],
  sessions: [],
  availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hoursPerDay: 2, preferredTime: 'Evenings', sessionLength: 45 },
  completedMinutes: 0,
};

function demoData(): AppData {
  const calculus = 'course-calculus';
  const cs = 'course-cs';
  const physics = 'course-physics';
  return {
    onboardingComplete: true,
    isDemo: true,
    availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hoursPerDay: 2.25, preferredTime: 'Evenings', sessionLength: 45 },
    completedMinutes: 165,
    courses: [
      {
        id: calculus, name: 'Analytical Geometry & Calculus II', code: 'MATH112', instructor: 'Dr. Nadia Salem', color: '#4e8f95', progress: 63,
        examDate: addDays(6),
        topics: ['Limits', 'Derivatives', 'Applications', 'Integrals', 'Differential equations'].map((name, index) => ({ id: `math-${index}`, name, reviewed: index < 3 })),
      },
      {
        id: cs, name: 'Computer Science', code: 'CSC417', instructor: 'Prof. Karim Youssef', color: '#7168a8', progress: 48,
        examDate: addDays(14),
        topics: ['Data structures', 'Sorting algorithms', 'Graphs', 'Dynamic programming'].map((name, index) => ({ id: `cs-${index}`, name, reviewed: index < 2 })),
      },
      {
        id: physics, name: 'Physics', code: 'PHYS101', instructor: 'Dr. Omar Hassan', color: '#c68c5a', progress: 71,
        examDate: addDays(21),
        topics: ['Kinematics', 'Forces', 'Energy', 'Momentum'].map((name, index) => ({ id: `physics-${index}`, name, reviewed: index < 3 })),
      },
    ],
    tasks: [
      { id: 'task-1', title: 'Review Applications of Derivatives', courseId: calculus, type: 'Lecture review', deadline: addDays(2), estimatedMinutes: 35, priority: 'high', difficulty: 2, status: 'not_started', notes: 'Focus on optimization examples.' },
      { id: 'task-2', title: 'Finish Assignment 2', courseId: cs, type: 'Assignment', deadline: addDays(4), estimatedMinutes: 55, priority: 'high', difficulty: 3, status: 'not_started' },
      { id: 'task-3', title: 'Review Lecture 6', courseId: physics, type: 'Lecture review', deadline: addDays(5), estimatedMinutes: 35, priority: 'medium', difficulty: 1, status: 'not_started' },
      { id: 'task-4', title: 'Practice integration by parts', courseId: calculus, type: 'Practice', deadline: addDays(7), estimatedMinutes: 45, priority: 'medium', difficulty: 3, status: 'in_progress' },
      { id: 'task-5', title: 'Read graph traversal notes', courseId: cs, type: 'Reading', deadline: addDays(9), estimatedMinutes: 30, priority: 'low', difficulty: 2, status: 'completed' },
    ],
    sessions: [
      { id: 'session-1', taskId: 'task-1', title: 'Applications of Derivatives', courseId: calculus, date: today(), minutes: 35, priority: 'high', reason: 'Your exam is in 6 days and this topic has not been reviewed yet.', status: 'not_started' },
      { id: 'session-2', taskId: 'task-2', title: 'Finish Assignment 2', courseId: cs, date: today(), minutes: 55, priority: 'high', reason: 'This assignment is due soon and has a high estimated difficulty.', status: 'not_started' },
      { id: 'session-3', taskId: 'task-3', title: 'Review Lecture 6', courseId: physics, date: today(), minutes: 35, priority: 'medium', reason: 'A short review keeps your weekly rhythm consistent.', status: 'not_started' },
    ],
  };
}

const StudyPilotContext = createContext<ContextValue | null>(null);

export function StudyPilotProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        try { setData(JSON.parse(value) as AppData); } catch { setData(emptyData); }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const update = (updater: (current: AppData) => AppData) => setData((current) => updater(current));
  const coursesById = useMemo(() => new Map(data.courses.map((course) => [course.id, course])), [data.courses]);
  const remainingMinutes = useMemo(() => data.tasks.filter((task) => task.status !== 'completed').reduce((sum, task) => sum + task.estimatedMinutes, 0), [data.tasks]);
  const recommendedTask = useMemo(() => {
    const unfinished = data.tasks.filter((task) => task.status !== 'completed');
    return [...unfinished].sort((a, b) => {
      const priorityValue = { high: 3, medium: 2, low: 1 };
      const deadlineA = new Date(a.deadline).getTime();
      const deadlineB = new Date(b.deadline).getTime();
      return (priorityValue[b.priority] - priorityValue[a.priority]) * 100000000 + deadlineA - deadlineB;
    })[0];
  }, [data.tasks]);
  const recommendedCourse = recommendedTask ? coursesById.get(recommendedTask.courseId) : undefined;

  const haptic = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); };
  const completeOnboarding = (extra: Partial<AppData> = {}) => { update((current) => ({ ...current, onboardingComplete: true, ...extra })); haptic(); };
  const loadDemoData = () => { setData(demoData()); haptic(); };
  const addCourse = (course: Pick<Course, 'name' | 'code' | 'color' | 'instructor'>) => {
    update((current) => ({ ...current, courses: [...current.courses, { ...course, id: makeId('course'), progress: 0, topics: [] }] }));
    haptic();
  };
  const addTask = (task: Omit<Task, 'id' | 'status'>) => {
    update((current) => ({ ...current, tasks: [...current.tasks, { ...task, id: makeId('task'), status: 'not_started' }] }));
    haptic();
  };
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
  const toggleTopic = (courseId: string, topicId: string) => update((current) => ({
    ...current,
    courses: current.courses.map((course) => course.id === courseId ? { ...course, topics: course.topics.map((topic) => topic.id === topicId ? { ...topic, reviewed: !topic.reviewed } : topic) } : course),
  }));
  const generatePlan = () => {
    update((current) => {
      const existingTaskIds = new Set(current.sessions.map((session) => session.taskId));
      const candidates = current.tasks.filter((task) => task.status !== 'completed' && !existingTaskIds.has(task.id)).slice(0, 4);
      const newSessions = candidates.map((task) => ({
        id: makeId('session'), taskId: task.id, title: task.title, courseId: task.courseId, date: today(), minutes: Math.min(task.estimatedMinutes, current.availability.sessionLength), priority: task.priority,
        reason: task.priority === 'high' ? 'Prioritized because the deadline is approaching.' : 'Added to keep your weekly review rhythm consistent.', status: 'not_started' as TaskStatus,
      }));
      return { ...current, sessions: [...current.sessions, ...newSessions] };
    });
    haptic();
  };
  const clearDemoData = () => update((current) => ({ ...emptyData, onboardingComplete: true, availability: current.availability }));
  const resetAll = () => { setData(emptyData); haptic(); };

  return (
    <StudyPilotContext.Provider value={{ ...data, hydrated, recommendedTask, recommendedCourse, remainingMinutes, completeOnboarding, loadDemoData, addCourse, addTask, updateTaskStatus, toggleTopic, generatePlan, clearDemoData, resetAll }}>
      {children}
    </StudyPilotContext.Provider>
  );
}

export function useStudyPilot() {
  const value = useContext(StudyPilotContext);
  if (!value) throw new Error('useStudyPilot must be used inside StudyPilotProvider');
  return value;
}