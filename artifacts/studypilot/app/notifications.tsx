import React from 'react';
import { Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';
import { previewNotificationCopy, requestNotificationPermission } from '@/services/notifications';
import type { NotificationPrefs } from '@/models/types';

const items: { key: keyof NotificationPrefs; title: string }[] = [
  { key: 'sessionReminders', title: 'Session reminders' },
  { key: 'deadlineReminders', title: 'Deadline reminders' },
  { key: 'nowSuggestions', title: 'NOW suggestions' },
];

export default function NotificationsScreen() {
  const colors = useColors();
  const { notifications, setNotifications } = useStudyPilot();
  return (
    <Screen>
      <Header title="Notifications" />
      <Text style={{ color: colors.mutedForeground, lineHeight: 21 }}>Preferences are saved now. Delivery of local/push alerts requires an Apple Developer push certificate and a production iOS build.</Text>
      {items.map((item) => (
        <View key={item.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.foreground, fontWeight: '700' }}>{item.title}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>{previewNotificationCopy(item.key)}</Text>
          </View>
          <Switch value={notifications[item.key]} onValueChange={(value) => setNotifications({ ...notifications, [item.key]: value })} />
        </View>
      ))}
      <Button label="Request permission (when configured)" variant="secondary" onPress={() => { void requestNotificationPermission(); }} />
      <Button label="Done" onPress={() => router.back()} variant="ghost" />
    </Screen>
  );
}
