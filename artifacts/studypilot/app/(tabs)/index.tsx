import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, Header, Pill, Screen } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

const formatDay = () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());

export default function HomeScreen() {
  const colors = useColors();
  const { courses, tasks, sessions, availability, completedMinutes, remainingMinutes, recommendedTask, recommendedCourse, updateTaskStatus } = useStudyPilot();
  const todaySessions = sessions.filter((session) => session.date === new Date().toISOString().slice(0, 10) && session.status !== 'completed');
  const availableMinutes = Math.round(availability.hoursPerDay * 60);

  return (
    <Screen>
      <Header eyebrow={formatDay()} title="What should I do now?" right={<View style={[homeStyles.avatar, { backgroundColor: colors.navy }]}><Text style={{ color: '#fff', fontWeight: '700' }}>S</Text></View>} />
      <Text style={[homeStyles.subhead, { color: colors.mutedForeground }]}>A realistic next step, based on your semester.</Text>
      {recommendedTask && recommendedCourse ? <View style={[homeStyles.heroCard, { backgroundColor: colors.navy }]}>
        <View style={homeStyles.cardTop}><Pill label="NEXT BEST ACTION" color={colors.primary} /><Text style={[homeStyles.duration, { color: '#b9c8d5' }]}>{recommendedTask.estimatedMinutes} min</Text></View>
        <Text style={homeStyles.courseName}>{recommendedCourse.code}  ·  {recommendedCourse.name}</Text>
        <Text style={homeStyles.taskTitle}>{recommendedTask.title}</Text>
        <Text style={homeStyles.reason}>Your {recommendedTask.priority === 'high' ? 'priority is high and ' : ''}deadline is {new Date(recommendedTask.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.</Text>
        <Button label="Start this session" icon="play" onPress={() => router.push({ pathname: '/session', params: { taskId: recommendedTask.id } })} />
      </View> : <EmptyState icon="compass" title="Your plan starts here" body="Add a course or explore the demo to get your first next best action." action={<Button label="Open Courses" onPress={() => router.push('/(tabs)/courses')} icon="arrow-right" />} />}
      <View style={[homeStyles.availability, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[homeStyles.availabilityIcon, { backgroundColor: colors.secondary }]}><Feather name="clock" size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[homeStyles.availabilityTitle, { color: colors.foreground }]}>{availableMinutes} min available today</Text><Text style={[homeStyles.availabilityBody, { color: colors.mutedForeground }]}>StudyPilot will keep your plan within this limit.</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></View>
      <View style={homeStyles.sectionHeading}><Text style={[homeStyles.sectionTitle, { color: colors.foreground }]}>Today’s plan</Text><Text style={[homeStyles.sectionMeta, { color: colors.mutedForeground }]}>{todaySessions.length} sessions</Text></View>
      <View style={{ gap: 10 }}>{todaySessions.length ? todaySessions.map((session, index) => {
        const course = courses.find((item) => item.id === session.courseId);
        const task = tasks.find((item) => item.id === session.taskId);
        return <Pressable key={session.id} onPress={() => router.push({ pathname: '/session', params: { taskId: session.taskId } })} style={({ pressed }) => [homeStyles.sessionRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}><View style={[homeStyles.sessionIndex, { backgroundColor: course?.color ?? colors.primary }]}><Text style={{ color: '#fff', fontWeight: '700' }}>{String(index + 1).padStart(2, '0')}</Text></View><View style={{ flex: 1, gap: 4 }}><Text style={[homeStyles.sessionCourse, { color: course?.color ?? colors.primary }]}>{course?.code ?? 'STUDY'}</Text><Text style={[homeStyles.sessionTitle, { color: colors.foreground }]}>{session.title}</Text><Text style={[homeStyles.sessionReason, { color: colors.mutedForeground }]}>{task?.estimatedMinutes ?? session.minutes} min · {session.priority} priority</Text></View><Pressable testID={`complete-${session.taskId}`} onPress={() => updateTaskStatus(session.taskId, 'completed')} hitSlop={10} style={[homeStyles.check, { borderColor: colors.border }]}><Feather name="check" size={16} color={colors.primary} /></Pressable></Pressable>;
      }) : <View style={[homeStyles.emptyPlan, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[homeStyles.emptyPlanTitle, { color: colors.foreground }]}>You’re clear for now.</Text><Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Generate a plan from the Planner tab when you’re ready.</Text></View>}</View>
      <View style={homeStyles.sectionHeading}><Text style={[homeStyles.sectionTitle, { color: colors.foreground }]}>Semester pulse</Text><Text style={[homeStyles.sectionMeta, { color: colors.mutedForeground }]}>{completedMinutes} min logged</Text></View>
      <View style={homeStyles.pulse}><View style={{ flex: 1, gap: 5 }}><Text style={[homeStyles.pulseTitle, { color: colors.lilacForeground }]}>Keep the rhythm</Text><Text style={[homeStyles.pulseBody, { color: colors.lilacForeground }]}>You have {Math.round(remainingMinutes / 60 * 10) / 10}h of open work remaining. Small sessions add up.</Text></View><Feather name="trending-up" size={27} color={colors.lilacForeground} /></View>
      <Text style={[homeStyles.footerHint, { color: colors.mutedForeground }]}>{courses.length} courses · {tasks.filter((task) => task.status === 'completed').length} tasks completed</Text>
    </Screen>
  );
}

const homeStyles = StyleSheet.create({
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  subhead: { fontSize: 14, lineHeight: 20, marginTop: -8 },
  heroCard: { borderRadius: 24, padding: 20, gap: 13, marginTop: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  duration: { fontSize: 13, fontWeight: '600' },
  courseName: { color: '#aac0cc', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 10 },
  taskTitle: { color: '#fff', fontSize: 25, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  reason: { color: '#b9c8d5', fontSize: 14, lineHeight: 21, marginBottom: 5 },
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
  check: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyPlan: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 6 },
  emptyPlanTitle: { fontSize: 15, fontWeight: '700' },
  pulse: { backgroundColor: '#e9e6f5', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pulseTitle: { fontSize: 16, fontWeight: '700' },
  pulseBody: { fontSize: 13, lineHeight: 19 },
  footerHint: { fontSize: 12, textAlign: 'center', marginTop: -2 },
});
