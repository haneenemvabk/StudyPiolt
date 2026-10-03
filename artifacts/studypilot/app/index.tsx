import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Field, LoadingState, Pill } from '@/components/Shared';
import { WEEKDAYS } from '@/constants/subscription';
import { addDays, makeId, monthKey } from '@/engine/dates';
import { generateStudyPlan } from '@/engine/planner';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';
import { DEFAULT_NOTIFICATIONS } from '@/services/notifications';
import type { AppData, PreferredTime } from '@/models/types';

const times: PreferredTime[] = ['Mornings', 'Afternoons', 'Evenings'];

export default function OnboardingScreen() {
  const colors = useColors();
  const { hydrated, onboardingComplete, completeOnboarding, loadDemoData } = useStudyPilot();
  const [step, setStep] = useState(0);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDays, setExamDays] = useState('21');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [hours, setHours] = useState(2);
  const [preferredTime, setPreferredTime] = useState<PreferredTime>('Evenings');
  const [sessionLength, setSessionLength] = useState(45);

  useEffect(() => {
    if (hydrated && onboardingComplete) router.replace('/(tabs)');
  }, [hydrated, onboardingComplete]);

  useEffect(() => {
    if (step !== 5) return;
    const timer = setTimeout(() => {
      const courseId = makeId('course');
      const hasCourse = Boolean(courseName.trim());
      const draft: AppData = {
        onboardingComplete: true,
        isDemo: false,
        displayName: 'Student',
        availability: { days: selectedDays, hoursPerDay: hours, preferredTime, sessionLength },
        completedMinutes: 0,
        subscription: { entitlement: 'free', source: 'none' },
        notifications: DEFAULT_NOTIFICATIONS,
        aiUsage: { monthKey: monthKey(), planningActions: 1 },
        materials: [],
        sessions: [],
        courses: hasCourse ? [{
          id: courseId,
          name: courseName.trim(),
          code: courseCode.trim() || 'NEW101',
          instructor: instructor.trim() || undefined,
          color: colors.primary,
          schedule: selectedDays.slice(0, 2).map((day) => ({ day, start: '10:00', end: '11:15' })),
          topics: [],
          examDate: examTitle.trim() ? addDays(Number(examDays) || 21) : undefined,
        }] : [],
        exams: hasCourse && examTitle.trim() ? [{ id: makeId('exam'), courseId, title: examTitle.trim(), date: addDays(Number(examDays) || 21) }] : [],
        tasks: hasCourse && assignmentTitle.trim() ? [{
          id: makeId('task'),
          title: assignmentTitle.trim(),
          courseId,
          type: 'Assignment',
          deadline: addDays(10),
          estimatedMinutes: 55,
          priority: 'high',
          difficulty: 2,
          status: 'not_started',
        }] : [],
      };
      const planned = generateStudyPlan(draft);
      completeOnboarding({ ...draft, sessions: planned.sessions });
      router.replace('/(tabs)');
    }, 1400);
    return () => clearTimeout(timer);
  }, [step]);

  if (!hydrated || onboardingComplete) return <LoadingState />;

  const toggleDay = (day: string) => setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  const next = () => setStep((value) => Math.min(5, value + 1));
  const back = () => setStep((value) => Math.max(0, value - 1));

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <View style={styles.top}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}><Feather name="navigation" size={24} color={colors.primaryForeground} /></View>
        <Text style={[styles.brand, { color: '#fff' }]}>StudyPilot</Text>
      </View>
      <View style={styles.hero}>
        {step === 0 ? <>
          <Pill label="YOUR ACADEMIC OS" color={colors.primary} />
          <Text style={styles.title}>Your academic life, intelligently organized.</Text>
          <Text style={styles.body}>StudyPilot turns your courses, deadlines, exams, and study materials into an adaptive study plan — then answers one question every time you open the app: what should I do now?</Text>
        </> : null}
        {step === 1 ? <>
          <Text style={[styles.kicker, { color: colors.primary }]}>STEP 2 OF 6</Text>
          <Text style={styles.title}>Add your first course.</Text>
          <Text style={styles.body}>You can add more later. Three courses are included on the free plan.</Text>
          <View style={styles.form}>
            <Field label="Course name" value={courseName} onChangeText={setCourseName} placeholder="e.g. Calculus II" />
            <Field label="Course code" value={courseCode} onChangeText={setCourseCode} placeholder="e.g. MATH112" />
            <Field label="Instructor (optional)" value={instructor} onChangeText={setInstructor} placeholder="e.g. Dr. Nadia Salem" />
          </View>
        </> : null}
        {step === 2 ? <>
          <Text style={[styles.kicker, { color: colors.primary }]}>STEP 3 OF 6</Text>
          <Text style={styles.title}>Capture academic dates.</Text>
          <Text style={styles.body}>Exams, assignments, projects, quizzes — anything with a deadline shapes the plan. You can skip and add these later.</Text>
          <View style={styles.form}>
            <Field label="Next exam (optional)" value={examTitle} onChangeText={setExamTitle} placeholder="e.g. Calculus midterm" />
            <Field label="Days until that exam" value={examDays} onChangeText={setExamDays} placeholder="21" keyboardType="numeric" />
            <Field label="Assignment or project (optional)" value={assignmentTitle} onChangeText={setAssignmentTitle} placeholder="e.g. Problem set 2" />
          </View>
        </> : null}
        {step === 3 ? <>
          <Text style={[styles.kicker, { color: colors.primary }]}>STEP 4 OF 6</Text>
          <Text style={styles.title}>When can you actually study?</Text>
          <Text style={styles.body}>StudyPilot will never schedule more work than the time you give it.</Text>
          <Text style={styles.label}>Days available</Text>
          <View style={styles.dayRow}>{WEEKDAYS.map((day) => <Pressable key={day} onPress={() => toggleDay(day)} style={[styles.day, { backgroundColor: selectedDays.includes(day) ? colors.primary : '#22344b' }]}><Text style={{ color: selectedDays.includes(day) ? colors.primaryForeground : '#b9c8d5', fontWeight: '700', fontSize: 12 }}>{day.slice(0, 1)}</Text></Pressable>)}</View>
          <Text style={styles.label}>Hours available per day</Text>
          <View style={styles.hoursRow}>{[1, 2, 3, 4].map((value) => <Pressable key={value} onPress={() => setHours(value)} style={[styles.hour, { borderColor: hours === value ? colors.primary : '#3b4c60', backgroundColor: hours === value ? '#1b5558' : 'transparent' }]}><Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{value}</Text></Pressable>)}</View>
          <Text style={styles.label}>Preferred study time</Text>
          <View style={styles.hoursRow}>{times.map((value) => <Pressable key={value} onPress={() => setPreferredTime(value)} style={[styles.timeChip, { borderColor: preferredTime === value ? colors.primary : '#3b4c60' }]}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{value}</Text></Pressable>)}</View>
          <Text style={styles.label}>Preferred session length</Text>
          <View style={styles.hoursRow}>{[25, 45, 60, 90].map((value) => <Pressable key={value} onPress={() => setSessionLength(value)} style={[styles.timeChip, { borderColor: sessionLength === value ? colors.primary : '#3b4c60' }]}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{value}m</Text></Pressable>)}</View>
        </> : null}
        {step === 4 ? <>
          <Text style={[styles.kicker, { color: colors.primary }]}>STEP 5 OF 6</Text>
          <Text style={styles.title}>Import academic information.</Text>
          <Text style={styles.body}>Upload a syllabus or lecture PDF later from Courses. AI extracts topics and dates, then you confirm every item before it enters your plan.</Text>
          <View style={styles.importCard}>
            <Feather name="file-text" size={22} color={colors.primary} />
            <Text style={styles.importTitle}>PDFs are parsed on the server</Text>
            <Text style={styles.body}>Nothing is added silently. Uncertain dates stay as “needs confirmation.”</Text>
          </View>
        </> : null}
        {step === 5 ? <>
          <Text style={[styles.kicker, { color: colors.primary }]}>STEP 6 OF 6</Text>
          <Text style={styles.title}>Analyzing your semester…</Text>
          <Text style={styles.body}>StudyPilot is building a first plan from your courses, dates, and available hours.</Text>
        </> : null}
      </View>
      <View style={styles.bottom}>
        {step === 0 ? <>
          <Button label="Get started" onPress={() => setStep(1)} icon="arrow-right" />
          <Button label="Explore with demo data" onPress={() => { loadDemoData(); router.replace('/(tabs)'); }} variant="ghost" />
        </> : step === 5 ? null : (
          <View style={styles.navRow}>
            <Button label="Back" onPress={back} variant="ghost" />
            <View style={{ flex: 1 }} />
            <Button label={step === 4 ? 'Generate first plan' : 'Continue'} onPress={next} icon={step === 4 ? 'zap' : 'arrow-right'} />
          </View>
        )}
        <Text style={styles.footnote}>Your data stays on this device in this MVP. Cloud sync can be added later.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 28 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  hero: { flex: 1, justifyContent: 'center', gap: 14 },
  title: { color: '#fff', fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1.1 },
  body: { color: '#b9c8d5', fontSize: 15, lineHeight: 23, maxWidth: 360 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4 },
  form: { gap: 12, marginTop: 4 },
  label: { color: '#b9c8d5', fontSize: 13, fontWeight: '700', marginTop: 4 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  hoursRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  hour: { flex: 1, minHeight: 54, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  timeChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  importCard: { backgroundColor: '#1b2d44', borderRadius: 18, padding: 16, gap: 8 },
  importTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bottom: { gap: 12 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footnote: { textAlign: 'center', fontSize: 12, color: '#7f93a8', marginTop: 4 },
});
