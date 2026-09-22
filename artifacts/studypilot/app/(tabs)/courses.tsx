import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, Field, Header, ProgressBar, Screen } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

const swatches = ['#4e8f95', '#7168a8', '#c68c5a', '#5e9b72', '#b85d68'];

export default function CoursesScreen() {
  const colors = useColors();
  const { courses, addCourse, toggleTopic } = useStudyPilot();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [color, setColor] = useState(swatches[0]);
  const saveCourse = () => { if (!name.trim() || !code.trim()) return; addCourse({ name: name.trim(), code: code.trim(), instructor: instructor.trim(), color }); setName(''); setCode(''); setInstructor(''); setShowAdd(false); };
  return <Screen><Header eyebrow={`${courses.length} active courses`} title="Courses" right={<Pressable onPress={() => setShowAdd(true)} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={20} color={colors.primaryForeground} /></Pressable>} />{courses.length ? <View style={{ gap: 14 }}>{courses.map((course) => { const reviewed = course.topics.filter((topic) => topic.reviewed).length; return <View key={course.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.cardHeader}><View style={[styles.courseMark, { backgroundColor: course.color }]}><Text style={styles.markText}>{course.code.slice(0, 2)}</Text></View><View style={{ flex: 1, gap: 3 }}><Text style={[styles.code, { color: course.color }]}>{course.code}</Text><Text style={[styles.name, { color: colors.foreground }]}>{course.name}</Text><Text style={[styles.instructor, { color: colors.mutedForeground }]}>{course.instructor || 'Instructor not added'}</Text></View><Feather name="more-horizontal" size={20} color={colors.mutedForeground} /></View><View style={styles.progressHeader}><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Course progress</Text><Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{course.progress}%</Text></View><ProgressBar value={course.progress} color={course.color} /><View style={styles.metaRow}><View><Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>NEXT EXAM</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{course.examDate ? `${Math.max(1, Math.ceil((new Date(course.examDate).getTime() - Date.now()) / 86400000))} days` : 'Not set'}</Text></View><View><Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>TOPICS</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{reviewed} / {course.topics.length || 0} reviewed</Text></View></View>{course.topics.length ? <View style={[styles.topicBox, { backgroundColor: colors.background }]}>{course.topics.map((topic) => <Pressable key={topic.id} onPress={() => toggleTopic(course.id, topic.id)} style={styles.topicRow}><Feather name={topic.reviewed ? 'check-circle' : 'circle'} size={16} color={topic.reviewed ? colors.success : colors.mutedForeground} /><Text style={[styles.topicText, { color: topic.reviewed ? colors.mutedForeground : colors.foreground, textDecorationLine: topic.reviewed ? 'line-through' : 'none' }]}>{topic.name}</Text></Pressable>)}</View> : <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 12 }}>Add topics later to track course readiness.</Text>}</View>; })}</View> : <EmptyState icon="book-open" title="Let’s build your semester." body="Add your first course, or explore the demo to see StudyPilot in motion." action={<Button label="Add course" onPress={() => setShowAdd(true)} icon="plus" />} />}<Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}><View style={styles.modalBackdrop}><View style={[styles.modal, { backgroundColor: colors.background }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Add a course</Text><Pressable onPress={() => setShowAdd(false)}><Feather name="x" size={22} color={colors.mutedForeground} /></Pressable></View><Field label="Course name" value={name} onChangeText={setName} placeholder="e.g. Cognitive Psychology" /><Field label="Course code" value={code} onChangeText={setCode} placeholder="e.g. PSY201" /><Field label="Instructor (optional)" value={instructor} onChangeText={setInstructor} placeholder="e.g. Dr. Samir" /><Text style={[styles.label, { color: colors.mutedForeground }]}>Course color</Text><View style={styles.swatches}>{swatches.map((item) => <Pressable key={item} onPress={() => setColor(item)} style={[styles.swatch, { backgroundColor: item, borderColor: color === item ? colors.foreground : 'transparent' }]} />)}</View><Button label="Add course" onPress={saveCourse} icon="check" disabled={!name.trim() || !code.trim()} /></View></View></Modal></Screen>;
}

const styles = StyleSheet.create({
  add: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 11 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  courseMark: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  code: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  name: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
  instructor: { fontSize: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  metaRow: { flexDirection: 'row', gap: 44, paddingTop: 4 },
  metaLabel: { fontSize: 10, letterSpacing: 0.7, fontWeight: '700' },
  metaValue: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  topicBox: { borderRadius: 14, padding: 11, gap: 10, marginTop: 4 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  topicText: { fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 15, paddingBottom: 38 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 23, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: -7 },
  swatches: { flexDirection: 'row', gap: 13 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 3 },
});