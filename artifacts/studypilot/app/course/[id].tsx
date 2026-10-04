import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Field, Header, Pill, ProgressBar, Screen } from '@/components/Shared';
import { addDays } from '@/engine/dates';
import { courseProgress, examReadiness } from '@/engine/readiness';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

const swatches = ['#4e8f95', '#7168a8', '#c68c5a', '#5e9b72', '#b85d68'];

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const app = useStudyPilot();
  const course = app.courses.find((item) => item.id === id);
  const [topicName, setTopicName] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examOffset, setExamOffset] = useState('14');
  const [taskTitle, setTaskTitle] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(course?.name ?? '');
  const [editCode, setEditCode] = useState(course?.code ?? '');
  const [editInstructor, setEditInstructor] = useState(course?.instructor ?? '');
  const [editColor, setEditColor] = useState(course?.color ?? swatches[0]);

  if (!course) return <Screen><Text style={{ color: colors.foreground }}>Course not found.</Text></Screen>;
  const progress = courseProgress(app, course);
  const readiness = examReadiness(app, course);
  const courseTasks = app.tasks.filter((task) => task.courseId === course.id);
  const courseExams = app.exams.filter((exam) => exam.courseId === course.id);
  const materials = app.materials.filter((material) => material.courseId === course.id);

  const saveEdit = () => {
    if (!editName.trim() || !editCode.trim()) return;
    app.updateCourse(course.id, { name: editName.trim(), code: editCode.trim(), instructor: editInstructor.trim(), color: editColor });
    setShowEdit(false);
  };

  return (
    <Screen>
      <Header eyebrow={course.code} title={course.name} right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => setShowEdit(true)} style={[styles.icon, { backgroundColor: colors.muted }]}><Feather name="edit-2" size={16} color={colors.foreground} /></Pressable>
          <Pressable onPress={() => router.back()} style={[styles.icon, { backgroundColor: colors.muted }]}><Feather name="x" size={18} color={colors.foreground} /></Pressable>
        </View>
      } />
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
        <View key={topic.id} style={styles.topicRow}>
          <Pressable onPress={() => app.toggleTopic(course.id, topic.id)} style={styles.topicLeft}>
            <Feather name={topic.reviewed ? 'check-circle' : 'circle'} size={16} color={topic.reviewed ? colors.success : colors.mutedForeground} />
            <Text style={{ color: colors.foreground, textDecorationLine: topic.reviewed ? 'line-through' : 'none' }}>{topic.name}</Text>
          </Pressable>
        </View>
      ))}
      <Field label="Add topic" value={topicName} onChangeText={setTopicName} placeholder="e.g. Implicit differentiation" />
      <Button label="Add topic" variant="secondary" onPress={() => { if (topicName.trim()) { app.addTopics(course.id, [topicName]); setTopicName(''); } }} />
      <Text style={[styles.section, { color: colors.foreground }]}>Exams & deadlines</Text>
      {courseExams.length ? courseExams.map((exam) => (
        <View key={exam.id} style={[styles.itemRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{exam.title}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{exam.date}</Text>
          </View>
          <Pressable onPress={() => Alert.alert('Delete this exam?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => app.deleteExam(exam.id) }])}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </Pressable>
        </View>
      )) : <Text style={{ color: colors.mutedForeground }}>No exams yet.</Text>}
      {courseTasks.map((task) => (
        <View key={task.id} style={[styles.itemRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable onPress={() => app.updateTaskStatus(task.id, task.status === 'completed' ? 'not_started' : 'completed')} style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground }}>{task.status === 'completed' ? '✓' : '○'} {task.title} · {task.deadline}</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert('Delete this task?', 'Associated study sessions will also be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => app.deleteTask(task.id) }])}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </Pressable>
        </View>
      ))}
      <Field label="New exam title" value={examTitle} onChangeText={setExamTitle} placeholder="Midterm" />
      <Field label="Days from today" value={examOffset} onChangeText={setExamOffset} placeholder="14" keyboardType="numeric" />
      <Button label="Add exam" variant="secondary" onPress={() => { if (examTitle.trim()) { app.addExam({ courseId: course.id, title: examTitle.trim(), date: addDays(Number(examOffset) || 14) }); setExamTitle(''); } }} />
      <Field label="New assignment" value={taskTitle} onChangeText={setTaskTitle} placeholder="Assignment 3" />
      <Button label="Add assignment" variant="secondary" onPress={() => { if (taskTitle.trim()) { app.addTask({ title: taskTitle.trim(), courseId: course.id, type: 'Assignment', deadline: addDays(7), estimatedMinutes: 55, priority: 'high', difficulty: 2 }); setTaskTitle(''); } }} />
      <Text style={[styles.section, { color: colors.foreground }]}>Uploaded materials</Text>
      {materials.length ? materials.map((material) => (
        <View key={material.id} style={[styles.itemRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name={material.kind === 'syllabus' ? 'book' : 'file-text'} size={16} color={colors.primary} />
            <View>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{material.filename}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{material.kind} · added {material.addedAt}</Text>
            </View>
          </View>
          <Pressable onPress={() => Alert.alert('Delete this material?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => app.deleteMaterial(material.id) }])}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </Pressable>
        </View>
      )) : <Text style={{ color: colors.mutedForeground }}>No materials yet. Analyze a PDF to add syllabus topics or lecture material.</Text>}
      <Button label="Analyze PDF" icon="file-text" onPress={() => router.push('/material-analysis')} />
      <Button label="Delete course" variant="ghost" onPress={() => Alert.alert('Delete this course?', 'Tasks and sessions for this course will also be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { app.deleteCourse(course.id); router.back(); } }])} />
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit course</Text><Pressable onPress={() => setShowEdit(false)}><Feather name="x" size={22} color={colors.mutedForeground} /></Pressable></View>
            <Field label="Course name" value={editName} onChangeText={setEditName} placeholder="e.g. Cognitive Psychology" />
            <Field label="Course code" value={editCode} onChangeText={setEditCode} placeholder="e.g. PSY201" />
            <Field label="Instructor (optional)" value={editInstructor} onChangeText={setEditInstructor} placeholder="e.g. Dr. Samir" />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Course color</Text>
            <View style={styles.swatches}>{swatches.map((item) => <Pressable key={item} onPress={() => setEditColor(item)} style={[styles.swatch, { backgroundColor: item, borderColor: editColor === item ? colors.foreground : 'transparent' }]} />)}</View>
            <Button label="Save changes" onPress={saveEdit} icon="check" disabled={!editName.trim() || !editCode.trim()} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700' },
  section: { fontSize: 19, fontWeight: '700', marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  topicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  topicLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemRow: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 15, paddingBottom: 38 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  modalTitle: { fontSize: 23, fontWeight: '700' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 3 },
});
