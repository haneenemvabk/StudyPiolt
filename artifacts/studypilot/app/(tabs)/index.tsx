import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, Header, Pill, Screen } from '@/components/Shared';
import { availableMinutesToday, nowReason, todaySessions } from '@/engine/now';
import { computeConflict } from '@/engine/planner';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

const formatDay = () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());

export default function HomeScreen() {
  const colors = useColors();
  const app = useStudyPilot();
  const { courses, tasks, sessions, availability, completedMinutes, remainingMinutes, recommendedSession, generatePlan, isDemo } = app;
  const todays = todaySessions({ sessions });
  const availabilityToday = availableMinutesToday({ availability, sessions });
  const reason = nowReason(app, recommendedSession);
  const recommendedCourse = recommendedSession ? courses.find((course) => course.id === recommendedSession.courseId) : undefined;
  const conflict = useMemo(() => computeConflict(app), [app.tasks, app.availability, app.exams, app.courses]);
  const extras = todays.filter((session) => session.id !== recommendedSession?.id);

  return (
    <Screen>
      <Header eyebrow={formatDay()} title="What should I do now?" right={<View style={[homeStyles.avatar, { backgroundColor: colors.navy }]}><Text style={{ color: '#fff', fontWeight: '700' }}>{isDemo ? 'D' : 'S'}</Text></View>} />
      <Text style={[homeStyles.subhead, { color: colors.mutedForeground }]}>A realistic next step, based on your semester.</Text>
      {isDemo ? <Pill label="DEMO DATA" color={colors.warning} /> : null}
      {recommendedSession && recommendedCourse ? (
        <View style={[homeStyles.heroCard, { backgroundColor: colors.navy }]}>
          <View style={homeStyles.cardTop}><Pill label="NEXT BEST ACTION" color={colors.primary} /><Text style={homeStyles.duration}>{recommendedSession.minutes} min</Text></View>
          <Text style={homeStyles.courseName}>{recommendedCourse.code}  ·  {recommendedCourse.name}</Text>
          <Text style={homeStyles.taskTitle}>{recommendedSession.title}</Text>
          <Text style={homeStyles.reason}>{reason}</Text>
          <Button label="Start my plan" icon="play" onPress={() => router.push({ pathname: '/session', params: { sessionId: recommendedSession.id, taskId: recommendedSession.taskId ?? '' } })} />
        </View>
      ) : (
        <EmptyState icon="compass" title="Tell us about your courses and we’ll build your first plan." body="Add a course, or generate a plan from the work you already have." action={<Button label="Generate my plan" onPress={() => generatePlan()} icon="zap" />} />
      )}
      {conflict ? (
        <View style={[homeStyles.conflict, { backgroundColor: colors.accent }]}>
          <Text style={[homeStyles.conflictTitle, { color: colors.accentForeground }]}>Time conflict</Text>
          <Text style={[homeStyles.conflictBody, { color: colors.accentForeground }]}>{conflict.message} Prioritize: {conflict.priorityTitles.join(', ') || 'the nearest deadlines'}.</Text>
        </View>
      ) : null}
      <View style={[homeStyles.availability, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[homeStyles.availabilityIcon, { backgroundColor: colors.secondary }]}><Feather name="clock" size={18} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[homeStyles.availabilityTitle, { color: colors.foreground }]}>{availabilityToday.remaining} min available today</Text>
          <Text style={[homeStyles.availabilityBody, { color: colors.mutedForeground }]}>{availability.preferredTime} · plan stays within {availability.hoursPerDay}h</Text>
        </View>
        <Pressable onPress={() => router.push('/availability')}><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
      </View>
      <View style={homeStyles.sectionHeading}><Text style={[homeStyles.sectionTitle, { color: colors.foreground }]}>Today’s plan</Text><Text style={[homeStyles.sectionMeta, { color: colors.mutedForeground }]}>{todays.length} sessions</Text></View>
      <View style={{ gap: 10 }}>
        {extras.length ? extras.map((session, index) => {
          const course = courses.find((item) => item.id === session.courseId);
          const task = tasks.find((item) => item.id === session.taskId);
          return (
            <Pressable key={session.id} onPress={() => router.push({ pathname: '/session', params: { sessionId: session.id, taskId: session.taskId ?? '' } })} style={({ pressed }) => [homeStyles.sessionRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}>
              <View style={[homeStyles.sessionIndex, { backgroundColor: course?.color ?? colors.primary }]}><Text style={{ color: '#fff', fontWeight: '700' }}>{String(index + 1).padStart(2, '0')}</Text></View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[homeStyles.sessionCourse, { color: course?.color ?? colors.primary }]}>{course?.code ?? 'STUDY'}</Text>
                <Text style={[homeStyles.sessionTitle, { color: colors.foreground }]}>{session.title}</Text>
                <Text style={[homeStyles.sessionReason, { color: colors.mutedForeground }]}>{task?.estimatedMinutes ?? session.minutes} min · {session.priority} priority</Text>
              </View>
              <Feather name="play-circle" size={22} color={colors.primary} />
            </Pressable>
          );
        }) : (
          <View style={[homeStyles.emptyPlan, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[homeStyles.emptyPlanTitle, { color: colors.foreground }]}>You’re clear for now.</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Generate a plan from the Planner tab when you’re ready.</Text>
          </View>
        )}
      </View>
      <View style={homeStyles.sectionHeading}><Text style={[homeStyles.sectionTitle, { color: colors.foreground }]}>Semester pulse</Text><Text style={[homeStyles.sectionMeta, { color: colors.mutedForeground }]}>{completedMinutes} min logged</Text></View>
      <View style={[homeStyles.pulse, { backgroundColor: colors.lilac }]}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={[homeStyles.pulseTitle, { color: colors.lilacForeground }]}>Keep the rhythm</Text>
          <Text style={[homeStyles.pulseBody, { color: colors.lilacForeground }]}>You have {Math.round(remainingMinutes / 60 * 10) / 10}h of open work remaining. Small sessions add up.</Text>
        </View>
        <Feather name="trending-up" size={27} color={colors.lilacForeground} />
      </View>
      <Text style={[homeStyles.footerHint, { color: colors.mutedForeground }]}>{courses.length} courses · {tasks.filter((task) => task.status === 'completed').length} tasks completed</Text>
    </Screen>
  );
}

const homeStyles = StyleSheet.create({
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  subhead: { fontSize: 14, lineHeight: 20, marginTop: -8 },
  heroCard: { borderRadius: 24, padding: 20, gap: 13, marginTop: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  duration: { color: '#b9c8d5', fontSize: 13, fontWeight: '600' },
  courseName: { color: '#aac0cc', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 10 },
  taskTitle: { color: '#fff', fontSize: 25, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  reason: { color: '#b9c8d5', fontSize: 14, lineHeight: 21, marginBottom: 5 },
  conflict: { borderRadius: 16, padding: 14, gap: 6 },
  conflictTitle: { fontSize: 13, fontWeight: '800' },
  conflictBody: { fontSize: 13, lineHeight: 19 },
  availability: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  availabilityIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  availabilityTitle: { fontSize: 14, fontWeight: '700' },
  availabilityBody: { fontSize: 12, marginTop: 3 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  sectionTitle: { fontSize: 19, fontWeight: '700' },
  sectionMeta: { fontSize: 12, fontWeight: '600' },
  sessionRow: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionIndex: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sessionCourse: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  sessionTitle: { fontSize: 15, fontWeight: '700' },
  sessionReason: { fontSize: 12, textTransform: 'capitalize' },
  emptyPlan: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 6 },
  emptyPlanTitle: { fontSize: 15, fontWeight: '700' },
  pulse: { borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pulseTitle: { fontSize: 16, fontWeight: '700' },
  pulseBody: { fontSize: 13, lineHeight: 19 },
  footerHint: { fontSize: 12, textAlign: 'center', marginTop: -2 },
});
