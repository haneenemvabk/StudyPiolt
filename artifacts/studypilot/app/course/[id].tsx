import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Field, Header, Pill, ProgressBar, Screen } from '@/components/Shared';
import { addDays } from '@/engine/dates';
import { courseProgress, examReadiness } from '@/engine/readiness';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const app = useStudyPilot();
  const course = app.courses.find((item) => item.id === id);
  const [topicName, setTopicName] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examOffset, setExamOffset] = useState('14');
  const [taskTitle, setTaskTitle] = useState('');
  if (!course) return <Screen><Text style={{ color: colors.foreground }}>Course not found.</Text></Screen>;
  const progress = courseProgress(app, course);
  const readiness = examReadiness(app, course);
  const courseTasks = app.tasks.filter((task) => task.courseId === course.id);
  const courseExams = app.exams.filter((exam) => exam.courseId === course.id);
  const materials = app.materials.filter((material) => material.courseId === course.id);
  return (
    <Screen>
      <Header eyebrow={course.code} title={course.name} right={<Pressable onPress={() => router.back()} style={[styles.icon, { backgroundColor: colors.muted }]}><Feather name="x" size={18} color={colors.foreground} /></Pressable>} />
      <Text style={{ color: colors.mutedForeground }}>{course.instructor || 'No instructor'} · {course.schedule.map((item) => `${item.day} ${item.start}`).join(' · ') || 'No class times yet'}</Text>
      <View style={styles.row}><Text style={[styles.label, { color: colors.mutedForeground }]}>Progress</Text><Text style={{ color: colors.foreground, fontWeight: '700' }}>{progress}%</Text></View>
      <ProgressBar value={progress} color={course.color} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}><Text style={[styles.section, { color: colors.foreground }]}>Exam readiness</Text><Pill label={readiness.level} color={readiness.level === 'Needs attention' ? colors.warning : colors.primary} /></View>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>{readiness.explanation} This is a descriptive snapshot from app activity, not a prediction of passing.</Text>
        <Text style={{ color: colors.foreground, fontSize: 13 }}>{readiness.reviewed} / {readiness.topicsTotal} topics reviewed · {readiness.practice}% of planned sessions completed · {readiness.assignmentsDone}/{readiness.assignmentsTotal} tasks done</Text>
      </View>
      <Text style={[styles.section, { color: colors.foreground }]}>Topics</Text>
      {course.topics.map((topic) => (
        <Pressable key={topic.id} onPress={() => app.toggleTopic(course.id, topic.id)} style={styles.topicRow}>
          <Feather name={topic.reviewed ? 'check-circle' : 'circle'} size={16} color={topic.reviewed ? colors.success : colors.mutedForeground} />
          <Text style={{ color: colors.foreground, textDecorationLine: topic.reviewed ? 'line-through' : 'none' }}>{topic.name}</Text>
        </Pressable>
      ))}
      <Field label="Add topic" value={topicName} onChangeText={setTopicName} placeholder="e.g. Implicit differentiation" />
      <Button label="Add topic" variant="secondary" onPress={() => { if (topicName.trim()) { app.addTopics(course.id, [topicName]); setTopicName(''); } }} />
      <Text style={[styles.section, { color: colors.foreground }]}>Exams & deadlines</Text>
      {courseExams.map((exam) => <Text key={exam.id} style={{ color: colors.foreground }}>{exam.title} · {exam.date}</Text>)}
      {courseTasks.map((task) => <Pressable key={task.id} onPress={() => app.updateTaskStatus(task.id, task.status === 'completed' ? 'not_started' : 'completed')}><Text style={{ color: colors.foreground }}>{task.status === 'completed' ? '✓' : '○'} {task.title} · {task.deadline}</Text></Pressable>)}
      <Field label="New exam title" value={examTitle} onChangeText={setExamTitle} placeholder="Midterm" />
      <Field label="Days from today" value={examOffset} onChangeText={setExamOffset} placeholder="14" keyboardType="numeric" />
      <Button label="Add exam" variant="secondary" onPress={() => { if (examTitle.trim()) { app.addExam({ courseId: course.id, title: examTitle.trim(), date: addDays(Number(examOffset) || 14) }); setExamTitle(''); } }} />
      <Field label="New assignment" value={taskTitle} onChangeText={setTaskTitle} placeholder="Assignment 3" />
      <Button label="Add assignment" variant="secondary" onPress={() => { if (taskTitle.trim()) { app.addTask({ title: taskTitle.trim(), courseId: course.id, type: 'Assignment', deadline: addDays(7), estimatedMinutes: 55, priority: 'high', difficulty: 2 }); setTaskTitle(''); } }} />
      <Text style={[styles.section, { color: colors.foreground }]}>Uploaded materials</Text>
      {materials.length ? materials.map((material) => <Text key={material.id} style={{ color: colors.mutedForeground }}>{material.filename} · {material.kind}</Text>) : <Text style={{ color: colors.mutedForeground }}>None yet. Analyze a PDF to add one after confirmation.</Text>}
      <Button label="Analyze PDF" icon="file-text" onPress={() => router.push('/material-analysis')} />
      <Button label="Delete course" variant="ghost" onPress={() => Alert.alert('Delete this course?', 'Tasks and sessions for this course will also be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { app.deleteCourse(course.id); router.back(); } }])} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700' },
  section: { fontSize: 19, fontWeight: '700', marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
});
