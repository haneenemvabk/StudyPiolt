import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, Field, Header, ProgressBar, Screen } from '@/components/Shared';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { courseProgress } from '@/engine/readiness';
import { SUBSCRIPTION_CONFIG } from '@/constants/subscription';
import { WEEKDAYS } from '@/constants/subscription';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

const swatches = ['#4e8f95', '#7168a8', '#c68c5a', '#5e9b72', '#b85d68'];

export default function CoursesScreen() {
  const colors = useColors();
  const app = useStudyPilot();
  const { courses, tasks, sessions, addCourse, isDemo } = app;
  const [showAdd, setShowAdd] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [color, setColor] = useState(swatches[0]);
  const [scheduleDays, setScheduleDays] = useState<string[]>(['Mon', 'Wed']);
  const saveCourse = () => {
    if (!name.trim() || !code.trim()) return;
    const result = addCourse({ name: name.trim(), code: code.trim(), instructor: instructor.trim(), color, schedule: scheduleDays.map((day) => ({ day, start: '10:00', end: '11:15' })) });
    if (!result.ok) { setUpgrade(true); return; }
    setName(''); setCode(''); setInstructor(''); setShowAdd(false);
  };
  return (
    <Screen>
      <Header eyebrow={`${courses.length} active courses`} title="Courses" right={<View style={styles.headerActions}><Pressable testID="analyze-material" onPress={() => router.push('/material-analysis')} style={[styles.iconButton, { backgroundColor: colors.secondary }]}><Feather name="file-text" size={17} color={colors.primary} /></Pressable><Pressable onPress={() => setShowAdd(true)} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={20} color={colors.primaryForeground} /></Pressable></View>} />
      {isDemo ? <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Demo semester is loaded. You can delete it from Profile.</Text> : null}
      {courses.length ? (
        <View style={{ gap: 14 }}>{courses.map((course) => {
          const progress = courseProgress(app, course);
          const reviewed = course.topics.filter((topic) => topic.reviewed).length;
          const nextTask = tasks.filter((task) => task.courseId === course.id && task.status !== 'completed').sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
          return (
            <Pressable key={course.id} onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.courseMark, { backgroundColor: course.color }]}><Text style={styles.markText}>{course.code.slice(0, 2)}</Text></View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.code, { color: course.color }]}>{course.code}</Text>
                  <Text style={[styles.name, { color: colors.foreground }]}>{course.name}</Text>
                  <Text style={[styles.instructor, { color: colors.mutedForeground }]}>{course.instructor || 'Instructor not added'}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
              </View>
              <View style={styles.progressHeader}><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Course progress</Text><Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{progress}%</Text></View>
              <ProgressBar value={progress} color={course.color} />
              <View style={styles.metaRow}>
                <View><Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>NEXT EXAM</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{course.examDate ? `${Math.max(0, Math.ceil((new Date(`${course.examDate}T12:00:00`).getTime() - Date.now()) / 86400000))} days` : 'Not set'}</Text></View>
                <View><Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>UPCOMING</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{nextTask ? nextTask.title : 'None'}</Text></View>
              </View>
              {course.topics.length ? <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{reviewed} / {course.topics.length} topics reviewed · {sessions.filter((session) => session.courseId === course.id).length} sessions</Text> : <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Add topics to track readiness.</Text>}
            </Pressable>
          );
        })}</View>
      ) : (
        <EmptyState icon="book-open" title="Let’s build your semester." body="Add your first course, or explore the demo to see StudyPilot in motion." action={<Button label="Add course" onPress={() => setShowAdd(true)} icon="plus" />} />
      )}
      <UpgradePrompt visible={upgrade} onClose={() => setUpgrade(false)} title="Free includes up to 3 courses." body={`Upgrade to Pro for unlimited courses. This limit keeps the free plan useful without blocking basic planning.`} />
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Add a course</Text><Pressable onPress={() => setShowAdd(false)}><Feather name="x" size={22} color={colors.mutedForeground} /></Pressable></View>
            <Field label="Course name" value={name} onChangeText={setName} placeholder="e.g. Cognitive Psychology" />
            <Field label="Course code" value={code} onChangeText={setCode} placeholder="e.g. PSY201" />
            <Field label="Instructor (optional)" value={instructor} onChangeText={setInstructor} placeholder="e.g. Dr. Samir" />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Class days</Text>
            <View style={styles.swatches}>{WEEKDAYS.map((day) => <Pressable key={day} onPress={() => setScheduleDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} style={[styles.dayChip, { backgroundColor: scheduleDays.includes(day) ? colors.navy : colors.card, borderColor: colors.border }]}><Text style={{ color: scheduleDays.includes(day) ? '#fff' : colors.foreground, fontSize: 11, fontWeight: '700' }}>{day}</Text></Pressable>)}</View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Course color</Text>
            <View style={styles.swatches}>{swatches.map((item) => <Pressable key={item} onPress={() => setColor(item)} style={[styles.swatch, { backgroundColor: item, borderColor: color === item ? colors.foreground : 'transparent' }]} />)}</View>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Free plan: {SUBSCRIPTION_CONFIG.freeCourseLimit} courses. You have {courses.length}.</Text>
            <Button label="Add course" onPress={saveCourse} icon="check" disabled={!name.trim() || !code.trim()} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  add: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 11 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  courseMark: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  code: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  name: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
  instructor: { fontSize: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  metaRow: { flexDirection: 'row', gap: 24, paddingTop: 4 },
  metaLabel: { fontSize: 10, letterSpacing: 0.7, fontWeight: '700' },
  metaValue: { fontSize: 13, fontWeight: '700', marginTop: 3, maxWidth: 160 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 15, paddingBottom: 38 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 23, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: -7 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 3 },
  dayChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 },
});
