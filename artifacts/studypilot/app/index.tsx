import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Field, LoadingState, Pill } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function OnboardingScreen() {
  const colors = useColors();
  const { hydrated, onboardingComplete, completeOnboarding, loadDemoData } = useStudyPilot();
  const [step, setStep] = useState(0);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [hours, setHours] = useState(2);

  useEffect(() => {
    if (hydrated && onboardingComplete) router.replace('/(tabs)');
  }, [hydrated, onboardingComplete]);

  if (!hydrated || onboardingComplete) return <LoadingState />;

  const toggleDay = (day: string) => setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  const finish = () => {
    completeOnboarding({
      availability: { days: selectedDays, hoursPerDay: hours, preferredTime: 'Evenings', sessionLength: 45 },
      courses: courseName.trim() ? [{ id: `course-${Date.now()}`, name: courseName.trim(), code: courseCode.trim() || 'NEW101', color: colors.primary, progress: 0, topics: [] }] : [],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <View style={styles.top}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}><Feather name="navigation" size={24} color={colors.primaryForeground} /></View>
        <Text style={[styles.brand, { color: colors.primaryForeground }]}>StudyPilot</Text>
      </View>
      <View style={styles.hero}>
        {step === 0 ? <><Pill label="YOUR ACADEMIC COPILOT" color={colors.primary} /><Text style={[styles.title, { color: colors.primaryForeground }]}>Your academic life, intelligently organized.</Text><Text style={[styles.body, { color: '#b9c8d5' }]}>Turn courses, deadlines, exams, and study time into a plan you can actually follow.</Text></> : null}
        {step === 1 ? <><Text style={[styles.kicker, { color: colors.primary }]}>STEP 1 OF 2</Text><Text style={[styles.title, { color: colors.primaryForeground }]}>Start with one course.</Text><Text style={[styles.body, { color: '#b9c8d5' }]}>You can add more courses anytime. StudyPilot will use them to shape your next best action.</Text><View style={styles.form}><Field label="Course name" value={courseName} onChangeText={setCourseName} placeholder="e.g. Calculus II" /><Field label="Course code" value={courseCode} onChangeText={setCourseCode} placeholder="e.g. MATH112" /></View></> : null}
        {step === 2 ? <><Text style={[styles.kicker, { color: colors.primary }]}>STEP 2 OF 2</Text><Text style={[styles.title, { color: colors.primaryForeground }]}>Make room for progress.</Text><Text style={[styles.body, { color: '#b9c8d5' }]}>We’ll never schedule more work than the time you give us.</Text><Text style={[styles.label, { color: '#b9c8d5' }]}>Days you usually study</Text><View style={styles.dayRow}>{days.map((day) => <Pressable key={day} onPress={() => toggleDay(day)} style={[styles.day, { backgroundColor: selectedDays.includes(day) ? colors.primary : '#22344b' }]}><Text style={{ color: selectedDays.includes(day) ? colors.primaryForeground : '#b9c8d5', fontWeight: '700', fontSize: 12 }}>{day.slice(0, 1)}</Text></Pressable>)}</View><Text style={[styles.label, { color: '#b9c8d5' }]}>Hours available per day</Text><View style={styles.hoursRow}>{[1, 2, 3, 4].map((value) => <Pressable key={value} onPress={() => setHours(value)} style={[styles.hour, { borderColor: hours === value ? colors.primary : '#3b4c60', backgroundColor: hours === value ? '#1b5558' : 'transparent' }]}><Text style={{ color: colors.primaryForeground, fontSize: 18, fontWeight: '700' }}>{value}</Text><Text style={{ color: '#b9c8d5', fontSize: 11 }}>hr{value > 1 ? 's' : ''}</Text></Pressable>)}</View></> : null}
      </View>
      <View style={styles.bottom}>
        {step === 0 ? <><Button label="Get started" onPress={() => setStep(1)} icon="arrow-right" /><Button label="Explore with demo data" onPress={() => { loadDemoData(); router.replace('/(tabs)'); }} variant="ghost" /></> : <View style={styles.navRow}>{step > 0 ? <Button label="Back" onPress={() => setStep(step - 1)} variant="ghost" /> : null}<View style={{ flex: 1 }} /><Button label={step === 2 ? 'Build my plan' : 'Continue'} onPress={() => step === 2 ? finish() : setStep(2)} icon={step === 2 ? 'zap' : 'arrow-right'} /></View>}
        <Text style={[styles.footnote, { color: '#7f93a8' }]}>Your data stays on this device for now.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 28 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  hero: { flex: 1, justifyContent: 'center', gap: 18 },
  title: { fontSize: 40, lineHeight: 45, fontWeight: '700', letterSpacing: -1.3 },
  body: { fontSize: 16, lineHeight: 25, maxWidth: 340 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4 },
  form: { gap: 15, marginTop: 8 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 7 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  hoursRow: { flexDirection: 'row', gap: 10 },
  hour: { flex: 1, minHeight: 64, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 2 },
  bottom: { gap: 12 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footnote: { textAlign: 'center', fontSize: 12, marginTop: 4 },
});