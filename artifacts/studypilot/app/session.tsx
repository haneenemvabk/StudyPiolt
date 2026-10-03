import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Pill } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';
import type { SessionFeedback } from '@/models/types';

const feedbackOptions: { id: SessionFeedback; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'normal', label: 'Normal' },
  { id: 'difficult', label: 'Difficult' },
  { id: 'more_practice', label: 'I need more practice' },
];

export default function SessionScreen() {
  const colors = useColors();
  const { sessionId, taskId } = useLocalSearchParams<{ sessionId?: string; taskId?: string }>();
  const { tasks, courses, sessions, markSessionStatus, updateTaskStatus, recordFeedback, updateSessionNotes } = useStudyPilot();
  const session = sessions.find((item) => item.id === sessionId);
  const task = tasks.find((item) => item.id === (session?.taskId ?? taskId)) ?? tasks[0];
  const course = courses.find((item) => item.id === (session?.courseId ?? task?.courseId));
  const totalSeconds = (session?.minutes ?? task?.estimatedMinutes ?? 45) * 60;
  const [seconds, setSeconds] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [endTimestamp, setEndTimestamp] = useState<number>(() => Date.now() + totalSeconds * 1000);
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [askFeedback, setAskFeedback] = useState(false);

  useEffect(() => {
    if (!running || askFeedback) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
      setSeconds(remaining);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [running, askFeedback, endTimestamp]);

  const toggleRunning = () => {
    setRunning((prev) => {
      if (prev) {
        setPausedAt(Date.now());
      } else if (pausedAt) {
        setEndTimestamp(Date.now() + seconds * 1000);
        setPausedAt(null);
      }
      return !prev;
    });
  };

  const clock = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);
  if (!task && !session) return <View style={[styles.container, { backgroundColor: colors.background }]}><Text style={{ color: colors.foreground }}>No task selected.</Text></View>;
  const finish = (feedback?: SessionFeedback) => {
    if (session) {
      if (notes.trim()) updateSessionNotes(session.id, notes.trim());
      markSessionStatus(session.id, 'completed');
      if (feedback) recordFeedback(session.id, feedback);
    } else if (task) updateTaskStatus(task.id, 'completed');
    router.back();
  };
  if (askFeedback) {
    return (
      <View style={[styles.container, { backgroundColor: colors.navy }]}>
        <Text style={styles.topLabel}>SESSION COMPLETE</Text>
        <Text style={styles.title}>How did this session feel?</Text>
        <Text style={styles.helper}>This stays on-device and only adjusts future session length and review emphasis.</Text>
        <View style={{ gap: 10, width: '100%' }}>{feedbackOptions.map((option) => <Button key={option.id} label={option.label} onPress={() => finish(option.id)} />)}</View>
        <Button label="Skip" variant="ghost" onPress={() => finish()} />
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={styles.close}><Feather name="x" size={21} color="#d7e2eb" /></Pressable>
        <Text style={styles.topLabel}>FOCUS SESSION</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.body}>
        <Pill label={course?.code ?? 'STUDY'} color={colors.primary} />
        <Text style={styles.title}>{session?.title ?? task?.title}</Text>
        <Text style={styles.course}>{course?.name ?? 'Your study plan'}</Text>
        <View style={styles.timerRing}>
          <View style={styles.timerInner}>
            <Text style={styles.timer}>{clock}</Text>
            <Text style={styles.timerCaption}>{running ? 'IN FOCUS' : 'PAUSED'}</Text>
          </View>
        </View>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor="#7f93a8" style={styles.notes} multiline />
      </View>
      <View style={styles.actions}>
        <Button label={running ? 'Pause' : 'Resume'} onPress={toggleRunning} variant="ghost" icon={running ? 'pause' : 'play'} />
        <Button label="Mark as difficult" variant="secondary" onPress={() => { if (session) recordFeedback(session.id, 'difficult'); setAskFeedback(true); }} />
        <Button label="Complete session" onPress={() => setAskFeedback(true)} icon="check" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 58, paddingBottom: 30 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#23364d', alignItems: 'center', justifyContent: 'center' },
  topLabel: { color: '#9eb2c2', fontSize: 11, letterSpacing: 1.5, fontWeight: '700', textAlign: 'center' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  title: { color: '#fff', fontSize: 30, lineHeight: 35, fontWeight: '700', textAlign: 'center', letterSpacing: -0.6 },
  course: { color: '#a8bac8', fontSize: 14, textAlign: 'center' },
  timerRing: { width: 230, height: 230, borderRadius: 115, borderWidth: 12, borderColor: '#2a6c70', alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  timerInner: { width: 188, height: 188, borderRadius: 94, backgroundColor: '#17283d', alignItems: 'center', justifyContent: 'center', gap: 5 },
  timer: { color: '#fff', fontSize: 46, fontWeight: '700', letterSpacing: -1.6 },
  timerCaption: { color: '#8fc8c4', fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  helper: { color: '#a8bac8', fontSize: 14, textAlign: 'center', lineHeight: 21, marginVertical: 16 },
  notes: { width: '100%', minHeight: 70, borderRadius: 14, borderWidth: 1, borderColor: '#31465e', color: '#fff', padding: 12, textAlignVertical: 'top' },
  actions: { gap: 10 },
});
