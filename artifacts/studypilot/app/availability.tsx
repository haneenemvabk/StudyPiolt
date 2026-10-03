import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen } from '@/components/Shared';
import { WEEKDAYS } from '@/constants/subscription';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';
import type { PreferredTime } from '@/models/types';

const times: PreferredTime[] = ['Mornings', 'Afternoons', 'Evenings'];

export default function AvailabilityScreen() {
  const colors = useColors();
  const { availability, setAvailability } = useStudyPilot();
  const toggleDay = (day: string) => {
    const days = availability.days.includes(day) ? availability.days.filter((item) => item !== day) : [...availability.days, day];
    setAvailability({ ...availability, days });
  };
  return (
    <Screen>
      <Header title="Study availability" />
      <Text style={{ color: colors.mutedForeground, lineHeight: 21 }}>StudyPilot will not schedule more minutes than you declare for a day.</Text>
      <View style={styles.row}>{WEEKDAYS.map((day) => (
        <Pressable key={day} onPress={() => toggleDay(day)} style={[styles.day, { backgroundColor: availability.days.includes(day) ? colors.primary : colors.card, borderColor: colors.border }]}>
          <Text style={{ color: availability.days.includes(day) ? colors.primaryForeground : colors.foreground, fontWeight: '700', fontSize: 12 }}>{day.slice(0, 3)}</Text>
        </Pressable>
      ))}</View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>Hours per day</Text>
      <View style={styles.row}>{[1, 2, 2.25, 3, 4].map((value) => (
        <Pressable key={value} onPress={() => setAvailability({ ...availability, hoursPerDay: value })} style={[styles.chip, { borderColor: availability.hoursPerDay === value ? colors.primary : colors.border }]}>
          <Text style={{ color: colors.foreground, fontWeight: '700' }}>{value}h</Text>
        </Pressable>
      ))}</View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>Preferred time</Text>
      <View style={styles.row}>{times.map((value) => (
        <Pressable key={value} onPress={() => setAvailability({ ...availability, preferredTime: value })} style={[styles.chip, { borderColor: availability.preferredTime === value ? colors.primary : colors.border }]}>
          <Text style={{ color: colors.foreground, fontWeight: '700' }}>{value}</Text>
        </Pressable>
      ))}</View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>Session length</Text>
      <View style={styles.row}>{[25, 45, 60, 90].map((value) => (
        <Pressable key={value} onPress={() => setAvailability({ ...availability, sessionLength: value })} style={[styles.chip, { borderColor: availability.sessionLength === value ? colors.primary : colors.border }]}>
          <Text style={{ color: colors.foreground, fontWeight: '700' }}>{value}m</Text>
        </Pressable>
      ))}</View>
      <Button label="Done" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10 },
  chip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
});
