export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'missed';
export type Priority = 'high' | 'medium' | 'low';
export type TaskType =
  | 'Assignment'
  | 'Exam prep'
  | 'Reading'
  | 'Lecture review'
  | 'Practice'
  | 'Project'
  | 'Quiz prep'
  | 'Custom';
export type SessionFeedback = 'easy' | 'normal' | 'difficult' | 'more_practice';
export type PreferredTime = 'Mornings' | 'Afternoons' | 'Evenings';
export type MaterialKind = 'syllabus' | 'lecture';

export type ClassMeeting = {
  day: string;
  start: string;
  end: string;
};

export type CourseTopic = {
  id: string;
  name: string;
  reviewed: boolean;
  source?: 'manual' | 'syllabus' | 'lecture';
};

export type Course = {
  id: string;
  name: string;
  code: string;
  instructor?: string;
  color: string;
  schedule: ClassMeeting[];
  topics: CourseTopic[];
  examDate?: string;
};

export type Exam = {
  id: string;
  courseId: string;
  title: string;
  date: string;
  notes?: string;
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
  taskId?: string;
  title: string;
  courseId: string;
  topic?: string;
  date: string;
  startTime?: string;
  minutes: number;
  priority: Priority;
  reason: string;
  relatedDeadline?: string;
  status: TaskStatus;
  feedback?: SessionFeedback;
  notes?: string;
};

export type UploadedMaterial = {
  id: string;
  courseId: string;
  filename: string;
  kind: MaterialKind;
  addedAt: string;
};

export type StudyAvailability = {
  days: string[];
  hoursPerDay: number;
  preferredTime: PreferredTime;
  sessionLength: number;
};

export type NotificationPrefs = {
  sessionReminders: boolean;
  deadlineReminders: boolean;
  nowSuggestions: boolean;
};

export type SubscriptionState = {
  entitlement: 'free' | 'pro';
  source: 'none' | 'mock-storekit' | 'app-store';
  productId?: 'studypilot_pro_monthly' | 'studypilot_pro_yearly';
};

export type AIUsage = {
  monthKey: string;
  planningActions: number;
};

export type PlanConflict = {
  remainingMinutes: number;
  availableMinutes: number;
  beforeLabel: string;
  message: string;
  priorityTitles: string[];
} | null;

export type AppData = {
  onboardingComplete: boolean;
  isDemo: boolean;
  displayName: string;
  courses: Course[];
  exams: Exam[];
  tasks: Task[];
  sessions: StudySession[];
  materials: UploadedMaterial[];
  availability: StudyAvailability;
  completedMinutes: number;
  subscription: SubscriptionState;
  notifications: NotificationPrefs;
  aiUsage: AIUsage;
};
