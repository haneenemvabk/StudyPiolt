import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, Field, Header, Pill, Screen } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { TaskType, useStudyPilot } from '@/context/StudyPilotContext';

const addDays = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); };
const types: TaskType[] = ['Assignment', 'Exam prep', 'Reading', 'Lecture review', 'Practice', 'Project'];

export default function PlannerScreen() {
  const colors = useColors();
  const { courses, tasks, sessions, availability, generatePlan, addTask } = useStudyPilot();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('45');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [type, setType] = useState<TaskType>('Assignment');
  const nextDays = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), date: date.getDate(), iso: date.toISOString().slice(0, 10) }; }), []);
  const saveTask = () => {
    if (!title.trim() || !courseId) return;
    addTask({ title: title.trim(), courseId, type, deadline: addDays(7), estimatedMinutes: Number(minutes) || 45, priority: 'medium', difficulty: 2, notes: '' });
    setTitle(''); setShowAdd(false);
  };
  return <Screen><Header eyebrow="Plan the week" title="Planner" right={<Pressable onPress={() => setShowAdd(true)} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={20} color={colors.primaryForeground} /></Pressable>} /><View style={[styles.planBanner, { backgroundColor: colors.secondary }]}><View style={{ flex: 1, gap: 5 }}><Text style={[styles.bannerTitle, { color: colors.secondaryForeground }]}>Your week, without the guesswork.</Text><Text style={[styles.bannerBody, { color: colors.mutedForeground }]}>{availability.hoursPerDay} hrs/day available · {tasks.filter((task) => task.status !== 'completed').length} open tasks</Text></View><Button label="Generate" icon="zap" onPress={generatePlan} /></View><View style={styles.weekRow}>{nextDays.map((item, index) => <View key={item.iso} style={[styles.dayCell, { backgroundColor: index === 0 ? colors.navy : colors.card, borderColor: colors.border }]}><Text style={{ color: index === 0 ? '#9fbbc2' : colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>{item.day}</Text><Text style={{ color: index === 0 ? '#fff' : colors.foreground, fontSize: 17, fontWeight: '700' }}>{item.date}</Text><View style={[styles.dayDot, { backgroundColor: sessions.some((session) => session.date === item.iso) ? colors.primary : colors.border }]} /></View>)}</View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scheduled sessions</Text>{sessions.length ? <View style={{ gap: 10 }}>{sessions.map((session) => { const course = courses.find((item) => item.id === session.courseId); return <View key={session.id} style={[styles.session, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.sessionRail, { backgroundColor: course?.color ?? colors.primary }]} /><View style={{ flex: 1, gap: 5 }}><View style={styles.sessionTop}><Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>{session.date === nextDays[0]?.iso ? 'TODAY' : new Date(session.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} · {session.minutes} MIN</Text><Pill label={session.priority} color={session.priority === 'high' ? colors.warning : colors.primary} /></View><Text style={[styles.sessionTitle, { color: colors.foreground }]}>{session.title}</Text><Text style={[styles.sessionCourse, { color: course?.color ?? colors.primary }]}>{course?.code}</Text></View></View>; })}</View> : <EmptyState icon="calendar" title="No plan yet" body="Generate a realistic plan from your open tasks and available study time." action={<Button label="Generate my plan" onPress={generatePlan} icon="zap" />} />}<Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}><View style={styles.modalBackdrop}><View style={[styles.modal, { backgroundColor: colors.background }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Add a task</Text><Pressable onPress={() => setShowAdd(false)}><Feather name="x" size={22} color={colors.mutedForeground} /></Pressable></View><Field label="What needs your attention?" value={title} onChangeText={setTitle} placeholder="e.g. Read chapter 4" /><Field label="Estimated minutes" value={minutes} onChangeText={setMinutes} placeholder="45" keyboardType="numeric" /><Text style={[styles.label, { color: colors.mutedForeground }]}>Course</Text><View style={styles.chips}>{courses.map((course) => <Pressable key={course.id} onPress={() => setCourseId(course.id)} style={[styles.chip, { backgroundColor: courseId === course.id ? colors.navy : colors.card, borderColor: courseId === course.id ? colors.navy : colors.border }]}><Text style={{ color: courseId === course.id ? '#fff' : colors.foreground, fontSize: 12, fontWeight: '700' }}>{course.code}</Text></Pressable>)}</View><Text style={[styles.label, { color: colors.mutedForeground }]}>Type</Text><View style={styles.chips}>{types.map((item) => <Pressable key={item} onPress={() => setType(item)} style={[styles.chip, { backgroundColor: type === item ? colors.secondary : colors.card, borderColor: type === item ? colors.primary : colors.border }]}><Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>{item}</Text></Pressable>)}</View><Button label="Save task" onPress={saveTask} icon="check" disabled={!title.trim() || !courseId} /></View></View></Modal></Screen>;
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
  sessionCourse: { fontSize: 12, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 15, paddingBottom: 38 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  modalTitle: { fontSize: 23, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: -7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 },
});