import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Header, Pill, Screen } from '@/components/Shared';
import { SUBSCRIPTION_CONFIG } from '@/constants/subscription';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

export default function ProfileScreen() {
  const colors = useColors();
  const { availability, isDemo, courses, subscription, remainingAiActions, clearDemoData, resetAll } = useStudyPilot();
  const confirmReset = () => Alert.alert('Delete account data?', 'This removes courses, tasks, plans, and local files from this device. Cloud accounts are not enabled in this MVP.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: resetAll }]);
  const rows = [
    { icon: 'clock' as const, title: 'Study availability', body: `${availability.hoursPerDay} hours · ${availability.days.join(', ')}`, href: '/availability' },
    { icon: 'bell' as const, title: 'Notifications', body: 'Session, deadline, and NOW reminder preferences.', href: '/notifications' },
    { icon: 'shield' as const, title: 'Privacy Policy', body: 'How academic materials are handled in this MVP.', href: '/legal?doc=privacy' },
    { icon: 'file-text' as const, title: 'Terms of Use', body: 'StudyPilot is a planning tool, not a cheating aid.', href: '/legal?doc=terms' },
  ];
  return (
    <Screen>
      <Header eyebrow="Your workspace" title="Profile" right={<View style={[styles.profileIcon, { backgroundColor: colors.navy }]}><Feather name="user" size={19} color="#fff" /></View>} />
      <View style={[styles.identity, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.bigAvatar, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontWeight: '800', fontSize: 24 }}>S</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.identityName, { color: colors.foreground }]}>Student workspace</Text>
          <Text style={[styles.identityMeta, { color: colors.mutedForeground }]}>{courses.length} courses · local mode · {Number.isFinite(remainingAiActions) ? `${remainingAiActions}/${SUBSCRIPTION_CONFIG.freeAiPlanningPerMonth} AI plans` : 'unlimited AI plans'}</Text>
        </View>
        <Pill label={subscription.entitlement === 'pro' ? 'PRO' : 'FREE'} color={colors.primary} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Unlock more focus</Text>
      <View style={[styles.proCard, { backgroundColor: colors.navy }]}>
        <View style={styles.proTop}><Pill label="STUDYPILOT PRO" color={colors.primary} /><Feather name="zap" size={20} color={colors.primary} /></View>
        <Text style={styles.proTitle}>Let your plan adapt with you.</Text>
        <Text style={styles.proBody}>Automatic rescheduling, lecture PDF analysis, exam readiness, and deeper insights.</Text>
        <Button label="View Pro plans" onPress={() => router.push('/subscription')} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Workspace</Text>
      <View style={{ gap: 1 }}>{rows.map((row) => (
        <Pressable key={row.title} onPress={() => router.push(row.href as never)} style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.muted }]}><Feather name={row.icon} size={16} color={colors.mutedForeground} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingTitle, { color: colors.foreground }]}>{row.title}</Text>
            <Text style={[styles.settingBody, { color: colors.mutedForeground }]}>{row.body}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      ))}</View>
      {isDemo ? <Button label="Remove demo data" onPress={clearDemoData} variant="ghost" icon="trash-2" /> : null}
      <Pressable onPress={confirmReset} style={styles.delete}><Text style={{ color: colors.destructive, fontSize: 13, fontWeight: '700' }}>Delete all local data / account placeholder</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  identity: { borderRadius: 20, borderWidth: 1, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigAvatar: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  identityName: { fontSize: 16, fontWeight: '700' },
  identityMeta: { fontSize: 12, marginTop: 3 },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginTop: 4 },
  proCard: { borderRadius: 22, padding: 18, gap: 11 },
  proTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proTitle: { color: '#fff', fontSize: 21, fontWeight: '700' },
  proBody: { color: '#b9c8d5', fontSize: 13, lineHeight: 19, marginBottom: 4 },
  settingRow: { borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  settingIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 14, fontWeight: '700' },
  settingBody: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  delete: { alignItems: 'center', paddingVertical: 4 },
});
