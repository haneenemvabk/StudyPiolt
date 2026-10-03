import type { NotificationPrefs } from '@/models/types';

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  sessionReminders: true,
  deadlineReminders: true,
  nowSuggestions: true,
};

export function previewNotificationCopy(kind: keyof NotificationPrefs) {
  if (kind === 'sessionReminders') return 'Your Calculus session starts in 15 minutes.';
  if (kind === 'deadlineReminders') return 'Your CS assignment is due tomorrow.';
  return 'You have 45 minutes available. Here’s what StudyPilot recommends.';
}

/**
 * Local/push notification seam. The MVP stores preferences and message copy.
 * Wire expo-notifications + APNs after an Apple Developer push certificate exists.
 */
export async function requestNotificationPermission() {
  return { granted: false, reason: 'Push delivery needs an Apple Developer push certificate and a production build.' };
}
