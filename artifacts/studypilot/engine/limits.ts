import { SUBSCRIPTION_CONFIG } from '@/constants/subscription';
import { monthKey } from '@/engine/dates';
import type { AppData } from '@/models/types';

export function isPro(data: Pick<AppData, 'subscription'>) {
  return data.subscription.entitlement === 'pro';
}

export function remainingAiActions(data: Pick<AppData, 'subscription' | 'aiUsage'>) {
  if (isPro(data)) return Number.POSITIVE_INFINITY;
  const used = data.aiUsage.monthKey === monthKey() ? data.aiUsage.planningActions : 0;
  return Math.max(0, SUBSCRIPTION_CONFIG.freeAiPlanningPerMonth - used);
}

export function canAddCourse(data: Pick<AppData, 'subscription' | 'courses'>) {
  return isPro(data) || data.courses.length < SUBSCRIPTION_CONFIG.freeCourseLimit;
}

export function canUseLectureAnalysis(data: Pick<AppData, 'subscription'>) {
  return isPro(data);
}

export function canAutoReschedule(data: Pick<AppData, 'subscription'>) {
  return isPro(data);
}

export function canViewAdvancedInsights(data: Pick<AppData, 'subscription'>) {
  return isPro(data);
}

export function canViewExamReadiness(data: Pick<AppData, 'subscription'>) {
  return isPro(data);
}

export function consumePlanningUsage(data: AppData): AppData {
  if (isPro(data)) return data;
  const key = monthKey();
  const current = data.aiUsage.monthKey === key ? data.aiUsage.planningActions : 0;
  return { ...data, aiUsage: { monthKey: key, planningActions: current + 1 } };
}
