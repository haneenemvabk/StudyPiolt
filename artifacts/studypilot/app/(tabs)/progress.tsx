import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Pill, ProgressBar, Screen } from '@/components/Shared';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { studyInsights } from '@/engine/insights';
import { canViewAdvancedInsights, canViewExamReadiness } from '@/engine/limits';
import { courseProgress, examReadiness } from '@/engine/readiness';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

export default function ProgressScreen() {
  const colors = useColors();
  const app = useStudyPilot();
  const { courses, tasks, completedMinutes, sessions } = app;
  const [upgrade, setUpgrade] = useState(false);
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const planned = sessions.length;
  const completion = planned ? Math.round((sessions.filter((session) => session.status === 'completed').length / planned) * 100) : 0;
  const insights = studyInsights(app);
  return (
    <Screen>
      <Header eyebrow="Your momentum" title="Progress" />
      <View style={styles.statGrid}>
        <View style={[styles.stat, { backgroundColor: colors.navy }]}><Feather name="clock" size={17} color={colors.primary} /><Text style={styles.statValue}>{Math.round(completedMinutes / 60 * 10) / 10}h</Text><Text style={styles.statLabel}>study time</Text></View>
        <View style={[styles.stat, { backgroundColor: colors.secondary }]}><Feather name="check-circle" size={17} color={colors.primary} /><Text style={[styles.statValue, { color: colors.secondaryForeground }]}>{completedTasks}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>tasks done</Text></View>
        <View style={[styles.stat, { backgroundColor: colors.lilac }]}><Feather name="trending-up" size={17} color={colors.lilacForeground} /><Text style={[styles.statValue, { color: colors.lilacForeground }]}>{completion}%</Text><Text style={[styles.statLabel, { color: colors.lilacForeground }]}>plan follow-through</Text></View>
      </View>
      <View style={styles.headingRow}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Course progress</Text><Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>{courses.length} courses</Text></View>
      <View style={{ gap: 14 }}>{courses.map((course) => {
        const value = courseProgress(app, course);
        return (
          <View key={course.id} style={[styles.courseRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.dot, { backgroundColor: course.color }]} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={styles.courseTop}><Text style={[styles.courseName, { color: colors.foreground }]}>{course.code}</Text><Text style={[styles.coursePercent, { color: course.color }]}>{value}%</Text></View>
              <ProgressBar value={value} color={course.color} />
            </View>
          </View>
        );
      })}</View>
      <View style={styles.headingRow}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exam readiness</Text><Pill label="DESCRIPTIVE ONLY" muted /></View>
      {canViewExamReadiness(app) ? (
        <View style={{ gap: 10 }}>{courses.filter((course) => course.examDate || app.exams.some((exam) => exam.courseId === course.id)).map((course) => {
          const ready = examReadiness(app, course);
          return (
            <View key={course.id} style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.examTop}>
                <View>
                  <Text style={[styles.courseName, { color: colors.foreground }]}>{course.name}</Text>
                  <Text style={[styles.examDays, { color: colors.mutedForeground }]}>{ready.daysRemaining ?? '—'} days remaining</Text>
                </View>
                <Pill label={ready.level} color={ready.level === 'Needs attention' ? colors.warning : colors.primary} />
              </View>
              <ProgressBar value={courseProgress(app, course)} color={course.color} />
              <Text style={[styles.examReason, { color: colors.mutedForeground }]}>{ready.explanation}</Text>
            </View>
          );
        })}</View>
      ) : (
        <View style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.courseName, { color: colors.foreground }]}>Exam readiness is included in Pro</Text>
          <Text style={[styles.examReason, { color: colors.mutedForeground }]}>Free still tracks course progress and completed sessions. Pro adds a descriptive readiness snapshot for each exam.</Text>
          <Button label="See Pro" onPress={() => router.push('/subscription')} variant="secondary" />
        </View>
      )}
      <View style={styles.headingRow}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Study insights</Text></View>
      {canViewAdvancedInsights(app) ? insights.map((item) => (
        <View key={item} style={[styles.examCard, { backgroundColor: colors.secondary, borderColor: colors.secondary }]}>
          <Text style={{ color: colors.secondaryForeground, fontSize: 14, lineHeight: 21 }}>{item}</Text>
        </View>
      )) : (
        <View style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontWeight: '700' }}>Deeper observations are a Pro feature</Text>
          <Text style={[styles.examReason, { color: colors.mutedForeground }]}>They are generated from your actual StudyPilot activity, not psychological claims.</Text>
          <Button label="Try Pro" onPress={() => setUpgrade(true)} />
        </View>
      )}
      <UpgradePrompt visible={upgrade} onClose={() => setUpgrade(false)} title="Advanced analytics is a Pro feature." body="See observations from your actual study data, such as when you complete sessions and which estimates tend to slip." />
    </Screen>
  );
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
