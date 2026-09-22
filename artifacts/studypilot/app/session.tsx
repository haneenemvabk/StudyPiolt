import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Pill } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

export default function SessionScreen() {
  const colors = useColors();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { tasks, courses, updateTaskStatus } = useStudyPilot();
  const task = tasks.find((item) => item.id === taskId) ?? tasks[0];
  const course = courses.find((item) => item.id === task?.courseId);
  const [seconds, setSeconds] = useState((task?.estimatedMinutes ?? 45) * 60);
  const [running, setRunning] = useState(true);
  useEffect(() => { if (!running) return; const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [running]);
  const clock = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);
  if (!task) return <View style={[styles.container, { backgroundColor: colors.background }]}><Text style={{ color: colors.foreground }}>No task selected.</Text></View>;
  const complete = () => { updateTaskStatus(task.id, 'completed'); router.back(); };
  return <View style={[styles.container, { backgroundColor: colors.navy }]}><View style={styles.top}><Pressable onPress={() => router.back()} style={styles.close}><Feather name="x" size={21} color="#d7e2eb" /></Pressable><Text style={styles.topLabel}>FOCUS SESSION</Text><View style={{ width: 38 }} /></View><View style={styles.body}><Pill label={course?.code ?? 'STUDY'} color={colors.primary} /><Text style={styles.title}>{task.title}</Text><Text style={styles.course}>{course?.name ?? 'Your study plan'}</Text><View style={styles.timerRing}><View style={styles.timerInner}><Text style={styles.timer}>{clock}</Text><Text style={styles.timerCaption}>{running ? 'IN FOCUS' : 'PAUSED'}</Text></View></View><Text style={styles.helper}>Keep going. You only need to focus on this one thing right now.</Text></View><View style={styles.actions}><Button label={running ? 'Pause timer' : 'Resume timer'} onPress={() => setRunning((value) => !value)} variant="ghost" icon={running ? 'pause' : 'play'} /><Button label="Complete session" onPress={complete} icon="check" /></View></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 58, paddingBottom: 30 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#23364d', alignItems: 'center', justifyContent: 'center' },
  topLabel: { color: '#9eb2c2', fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  title: { color: '#fff', fontSize: 30, lineHeight: 35, fontWeight: '700', textAlign: 'center', letterSpacing: -0.6 },
  course: { color: '#a8bac8', fontSize: 14, textAlign: 'center' },
  timerRing: { width: 230, height: 230, borderRadius: 115, borderWidth: 12, borderColor: '#2a6c70', alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  timerInner: { width: 188, height: 188, borderRadius: 94, backgroundColor: '#17283d', alignItems: 'center', justifyContent: 'center', gap: 5 },
  timer: { color: '#fff', fontSize: 46, fontWeight: '700', letterSpacing: -1.6 },
  timerCaption: { color: '#8fc8c4', fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  helper: { color: '#a8bac8', fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 290 },
  actions: { gap: 10 },
});