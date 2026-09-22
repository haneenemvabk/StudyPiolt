import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Header, Pill, ProgressBar, Screen } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

export default function ProgressScreen() {
  const colors = useColors();
  const { courses, tasks, completedMinutes, sessions } = useStudyPilot();
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const planned = sessions.length;
  const completion = planned ? Math.round((sessions.filter((session) => session.status === 'completed').length / planned) * 100) : 0;
  return <Screen><Header eyebrow="Your momentum" title="Progress" /><View style={styles.statGrid}><View style={[styles.stat, { backgroundColor: colors.navy }]}><Feather name="clock" size={17} color={colors.primary} /><Text style={styles.statValue}>{Math.round(completedMinutes / 60 * 10) / 10}h</Text><Text style={styles.statLabel}>study time</Text></View><View style={[styles.stat, { backgroundColor: colors.secondary }]}><Feather name="check-circle" size={17} color={colors.primary} /><Text style={[styles.statValue, { color: colors.secondaryForeground }]}>{completedTasks}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>tasks done</Text></View><View style={[styles.stat, { backgroundColor: colors.lilac }]}><Feather name="trending-up" size={17} color={colors.lilacForeground} /><Text style={[styles.statValue, { color: colors.lilacForeground }]}>{completion}%</Text><Text style={[styles.statLabel, { color: colors.lilacForeground }]}>plan follow-through</Text></View></View><View style={styles.headingRow}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Course progress</Text><Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>{courses.length} courses</Text></View><View style={{ gap: 14 }}>{courses.map((course) => <View key={course.id} style={[styles.courseRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.dot, { backgroundColor: course.color }]} /><View style={{ flex: 1, gap: 8 }}><View style={styles.courseTop}><Text style={[styles.courseName, { color: colors.foreground }]}>{course.code}</Text><Text style={[styles.coursePercent, { color: course.color }]}>{course.progress}%</Text></View><ProgressBar value={course.progress} color={course.color} /></View></View>)}</View><View style={styles.headingRow}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exam readiness</Text><Pill label="DESCRIPTIVE ONLY" muted /></View><View style={{ gap: 10 }}>{courses.filter((course) => course.examDate).map((course) => { const days = Math.max(1, Math.ceil((new Date(course.examDate as string).getTime() - Date.now()) / 86400000)); const reviewed = course.topics.filter((topic) => topic.reviewed).length; const ratio = course.topics.length ? reviewed / course.topics.length : course.progress / 100; const label = ratio > 0.7 ? 'Strong preparation' : ratio > 0.45 ? 'Developing' : 'Needs attention'; return <View key={course.id} style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.examTop}><View><Text style={[styles.courseName, { color: colors.foreground }]}>{course.name}</Text><Text style={[styles.examDays, { color: colors.mutedForeground }]}>{days} days remaining</Text></View><Pill label={label} color={label === 'Needs attention' ? colors.warning : colors.primary} /></View><ProgressBar value={ratio * 100} color={course.color} /><Text style={[styles.examReason, { color: colors.mutedForeground }]}>{reviewed} of {course.topics.length || 'your'} topics reviewed. This assessment is based on activity in StudyPilot, not a prediction of exam results.</Text></View>; })}</View></Screen>;
}

const styles = StyleSheet.create({
  statGrid: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, minHeight: 112, borderRadius: 18, padding: 13, justifyContent: 'space-between' },
  statValue: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 10 },
  statLabel: { color: '#b9c8d5', fontSize: 11, lineHeight: 14 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  sectionTitle: { fontSize: 19, fontWeight: '700' },
  sectionMeta: { fontSize: 12, fontWeight: '600' },
  courseRow: { borderRadius: 17, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  courseTop: { flexDirection: 'row', justifyContent: 'space-between' },
  courseName: { fontSize: 14, fontWeight: '700' },
  coursePercent: { fontSize: 13, fontWeight: '800' },
  examCard: { borderRadius: 18, borderWidth: 1, padding: 15, gap: 12 },
  examTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  examDays: { fontSize: 12, marginTop: 3 },
  examReason: { fontSize: 12, lineHeight: 18 },
});