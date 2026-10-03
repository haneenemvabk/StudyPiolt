import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, Field, Header, Pill, Screen } from '@/components/Shared';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { addDays, isoDate } from '@/engine/dates';
import { useColors } from '@/hooks/useColors';
import { TaskType, useStudyPilot } from '@/context/StudyPilotContext';

const types: TaskType[] = ['Assignment', 'Exam prep', 'Reading', 'Lecture review', 'Practice', 'Project', 'Quiz prep', 'Custom'];

export default function PlannerScreen() {
  const colors = useColors();
  const { courses, tasks, sessions, availability, generatePlan, addTask, markSessionStatus, rescheduleAutomatically, rescheduleManually, remainingAiActions } = useStudyPilot();
  const [showAdd, setShowAdd] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('45');
  const [deadlineOffset, setDeadlineOffset] = useState('7');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [type, setType] = useState<TaskType>('Assignment');
  const [selectedDay, setSelectedDay] = useState(isoDate());
  const [movingId, setMovingId] = useState<string | null>(null);
  const nextDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), date: date.getDate(), iso };
  }), []);
  const visibleSessions = sessions.filter((session) => session.date === selectedDay);
  const saveTask = () => {
    if (!title.trim() || !courseId) return;
    addTask({ title: title.trim(), courseId, type, deadline: addDays(Number(deadlineOffset) || 7), estimatedMinutes: Number(minutes) || 45, priority: type === 'Exam prep' || type === 'Assignment' ? 'high' : 'medium', difficulty: 2, notes: '' });
    setTitle(''); setShowAdd(false);
  };
  const onGenerate = () => {
    const result = generatePlan();
    if (result.reason === 'ai-limit') setUpgrade(true);
    else if (result.conflict) Alert.alert('Plan created with a conflict', result.conflict.message);
  };
  const missSession = (id: string, title: string) => {
    markSessionStatus(id, 'missed');
    Alert.alert(`You missed your ${title} session.`, 'Redistribute the work across future available days, or pick a new day.', [
      { text: 'Reschedule automatically', onPress: () => {
        const result = rescheduleAutomatically(id);
        if (!result.ok) setUpgrade(true);
      } },
      { text: 'Reschedule manually', onPress: () => setMovingId(id) },
      { text: 'Not now', style: 'cancel' },
    ]);
  };
  return (
    <Screen>
      <Header eyebrow="Plan the week" title="Planner" right={<Pressable onPress={() => setShowAdd(true)} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={20} color={colors.primaryForeground} /></Pressable>} />
      <View style={[styles.planBanner, { backgroundColor: colors.secondary }]}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={[styles.bannerTitle, { color: colors.secondaryForeground }]}>Your week, without the guesswork.</Text>
          <Text style={[styles.bannerBody, { color: colors.mutedForeground }]}>{availability.hoursPerDay} hrs/day · {tasks.filter((task) => task.status !== 'completed').length} open tasks · {Number.isFinite(remainingAiActions) ? `${remainingAiActions} AI plans left` : 'Unlimited AI plans'}</Text>
        </View>
        <Button label="Generate" icon="zap" onPress={onGenerate} />
      </View>
      <View style={styles.weekRow}>{nextDays.map((item) => {
        const selected = selectedDay === item.iso;
        return (
          <Pressable key={item.iso} onPress={() => {
            if (movingId) { rescheduleManually(movingId, item.iso); setMovingId(null); }
            else setSelectedDay(item.iso);
          }} style={[styles.dayCell, { backgroundColor: selected ? colors.navy : colors.card, borderColor: colors.border }]}>
            <Text style={{ color: selected ? '#9fbbc2' : colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>{item.day}</Text>
            <Text style={{ color: selected ? '#fff' : colors.foreground, fontSize: 17, fontWeight: '700' }}>{item.date}</Text>
            <View style={[styles.dayDot, { backgroundColor: sessions.some((session) => session.date === item.iso) ? colors.primary : colors.border }]} />
          </Pressable>
        );
      })}</View>
      {movingId ? <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Tap a day to move the session.</Text> : null}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{selectedDay === isoDate() ? 'Today' : 'Scheduled sessions'}</Text>
      {visibleSessions.length ? (
        <View style={{ gap: 10 }}>{visibleSessions.map((session) => {
          const course = courses.find((item) => item.id === session.courseId);
          return (
            <View key={session.id} style={[styles.session, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.sessionRail, { backgroundColor: course?.color ?? colors.primary }]} />
              <View style={{ flex: 1, gap: 5 }}>
                <View style={styles.sessionTop}>
                  <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>{session.startTime ?? availability.preferredTime} · {session.minutes} MIN</Text>
                  <Pill label={session.status.replace('_', ' ')} color={session.status === 'missed' ? colors.warning : colors.primary} />
                </View>
                <Text style={[styles.sessionTitle, { color: colors.foreground }]}>{session.title}</Text>
                <Text style={[styles.sessionCourse, { color: course?.color ?? colors.primary }]}>{course?.code} · {session.reason}</Text>
                <View style={styles.actions}>
                  <Pressable onPress={() => router.push({ pathname: '/session', params: { sessionId: session.id, taskId: session.taskId ?? '' } })}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>Start</Text></Pressable>
                  <Pressable onPress={() => markSessionStatus(session.id, 'completed')}><Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>Complete</Text></Pressable>
                  <Pressable onPress={() => missSession(session.id, course?.code ?? 'study')}><Text style={{ color: colors.warning, fontWeight: '700', fontSize: 12 }}>Missed</Text></Pressable>
                  <Pressable onPress={() => setMovingId(session.id)}><Text style={{ color: colors.mutedForeground, fontWeight: '700', fontSize: 12 }}>Move</Text></Pressable>
                </View>
              </View>
            </View>
          );
        })}</View>
      ) : (
        <EmptyState icon="calendar" title="No plan yet" body="Generate a realistic plan from your open tasks and available study time." action={<Button label="Generate my plan" onPress={onGenerate} icon="zap" />} />
      )}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Open tasks</Text>
      {tasks.filter((task) => task.status !== 'completed').map((task) => {
        const course = courses.find((item) => item.id === task.courseId);
        return (
          <View key={task.id} style={[styles.taskRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.sessionTitle, { color: colors.foreground }]}>{task.title}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{course?.code} · {task.type} · due {task.deadline} · {task.status.replace('_', ' ')}</Text>
          </View>
        );
      })}
      <UpgradePrompt visible={upgrade} onClose={() => setUpgrade(false)} title="Automatic rescheduling is a Pro feature." body="Let StudyPilot rebuild your schedule when you miss a study session, and unlock more monthly AI planning actions." />
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Add a task</Text><Pressable onPress={() => setShowAdd(false)}><Feather name="x" size={22} color={colors.mutedForeground} /></Pressable></View>
            <Field label="What needs your attention?" value={title} onChangeText={setTitle} placeholder="e.g. Read chapter 4" />
            <Field label="Estimated minutes" value={minutes} onChangeText={setMinutes} placeholder="45" keyboardType="numeric" />
            <Field label="Days until deadline" value={deadlineOffset} onChangeText={setDeadlineOffset} placeholder="7" keyboardType="numeric" />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Course</Text>
            <View style={styles.chips}>{courses.map((course) => <Pressable key={course.id} onPress={() => setCourseId(course.id)} style={[styles.chip, { backgroundColor: courseId === course.id ? colors.navy : colors.card, borderColor: courseId === course.id ? colors.navy : colors.border }]}><Text style={{ color: courseId === course.id ? '#fff' : colors.foreground, fontSize: 12, fontWeight: '700' }}>{course.code}</Text></Pressable>)}</View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Type</Text>
            <View style={styles.chips}>{types.map((item) => <Pressable key={item} onPress={() => setType(item)} style={[styles.chip, { backgroundColor: type === item ? colors.secondary : colors.card, borderColor: type === item ? colors.primary : colors.border }]}><Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>{item}</Text></Pressable>)}</View>
            <Button label="Save task" onPress={saveTask} icon="check" disabled={!title.trim() || !courseId} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  planBanner: { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerTitle: { fontSize: 15, fontWeight: '700' },
  bannerBody: { fontSize: 12 },
  weekRow: { flexDirection: 'row', gap: 7 },
  dayCell: { flex: 1, minHeight: 73, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginTop: 2 },
  session: { borderRadius: 17, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 12 },
  sessionRail: { width: 4, borderRadius: 4 },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionTime: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  sessionTitle: { fontSize: 15, fontWeight: '700' },
  sessionCourse: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  taskRow: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 15, paddingBottom: 38 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  modalTitle: { fontSize: 23, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: -7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 },
});
