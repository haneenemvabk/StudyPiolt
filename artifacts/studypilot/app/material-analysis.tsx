import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { analyzeAcademicMaterial, type AnalyzeMaterialOutput } from '@workspace/api-client-react';
import { Button, Field, Pill, ProgressBar, Screen } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';

type MaterialKind = 'syllabus' | 'lecture';

export default function MaterialAnalysisScreen() {
  const colors = useColors();
  const { courses, addTopics, addTask, addMaterial } = useStudyPilot();
  const [kind, setKind] = useState<MaterialKind>('syllabus');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [filename, setFilename] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeMaterialOutput | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDeadlines, setSelectedDeadlines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedCourse = courses.find((course) => course.id === courseId);
  const confidence = useMemo(() => analysis?.topics.length ? Math.round((analysis.topics.reduce((sum, topic) => sum + topic.confidence, 0) / analysis.topics.length) * 100) : 0, [analysis]);

  const pickAndAnalyze = async () => {
    if (busy) return;
    setError('');
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 8 * 1024 * 1024) {
      setError('That PDF is larger than 8 MB. Choose a smaller file.');
      return;
    }
    setFilename(asset.name);
    setBusy(true);
    try {
      const file = new File(asset.uri);
      const contentBase64 = await file.base64();
      const output = await analyzeAcademicMaterial({ kind, filename: asset.name, courseName: selectedCourse?.name, contentBase64 });
      setAnalysis(output);
      setSelectedTopics(output.topics.map((topic) => topic.title));
      setSelectedDeadlines(output.deadlines.map((deadline) => deadline.title));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'StudyPilot could not analyze this file right now.');
    } finally {
      setBusy(false);
    }
  };

  const toggleTopic = (title: string) => setSelectedTopics((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  const toggleDeadline = (title: string) => setSelectedDeadlines((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  const confirmFindings = () => {
    if (!analysis) return;
    if (!selectedCourse) {
      Alert.alert('Choose a course first', 'Select the course that owns these findings before confirming them.');
      return;
    }
    if (selectedTopics.length) addTopics(selectedCourse.id, selectedTopics);
    addMaterial({ courseId: selectedCourse.id, filename: analysis.filename, kind });
    analysis.deadlines.filter((deadline) => selectedDeadlines.includes(deadline.title) && /^\d{4}-\d{2}-\d{2}$/.test(deadline.dueDate)).forEach((deadline) => {
      const type = deadline.type.toLowerCase().includes('exam') ? 'Exam prep' : deadline.type.toLowerCase().includes('project') ? 'Project' : 'Assignment';
      addTask({ title: deadline.title, courseId: selectedCourse.id, type, deadline: deadline.dueDate, estimatedMinutes: 45, priority: 'medium', difficulty: 2, notes: `Found in ${analysis.filename}. Verify the source before relying on this deadline.` });
    });
    Alert.alert('Saved for review', 'Confirmed topics and clear dates were added to your local course plan. Dates that need confirmation were left out.', [{ text: 'Done', onPress: () => router.back() }]);
  };

  return <Screen><View style={styles.top}><Pressable onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.muted }]}><Feather name="x" size={20} color={colors.foreground} /></Pressable><View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.primary }]}>IMPORT & UNDERSTAND</Text><Text style={[styles.title, { color: colors.foreground }]}>Analyze material</Text></View></View><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>StudyPilot will find topics and possible dates, then let you verify everything before it touches your plan.</Text><View style={[styles.kindRow, { backgroundColor: colors.muted }]}>{(['syllabus', 'lecture'] as MaterialKind[]).map((item) => <Pressable key={item} onPress={() => setKind(item)} style={[styles.kindItem, kind === item && { backgroundColor: colors.card }]}><Text style={{ color: kind === item ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '700' }}>{item === 'syllabus' ? 'Syllabus PDF' : 'Lecture PDF'}</Text></Pressable>)}</View>{courses.length ? <><Text style={[styles.label, { color: colors.mutedForeground }]}>Review into course</Text><View style={styles.chips}>{courses.map((course) => <Pressable key={course.id} onPress={() => setCourseId(course.id)} style={[styles.chip, { backgroundColor: courseId === course.id ? colors.navy : colors.card, borderColor: courseId === course.id ? colors.navy : colors.border }]}><Text style={{ color: courseId === course.id ? '#fff' : colors.foreground, fontSize: 12, fontWeight: '700' }}>{course.code}</Text></Pressable>)}</View></> : null}{!analysis ? <View style={[styles.uploadCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.uploadIcon, { backgroundColor: colors.secondary }]}><Feather name="upload-cloud" size={25} color={colors.primary} /></View><Text style={[styles.uploadTitle, { color: colors.foreground }]}>Choose a PDF to understand</Text><Text style={[styles.uploadBody, { color: colors.mutedForeground }]}>PDFs are sent to the secure server for parsing. They are not stored by this flow.</Text><Button label={busy ? 'Analyzing…' : 'Choose PDF'} onPress={pickAndAnalyze} icon="file-text" disabled={busy} />{busy ? <ActivityIndicator color={colors.primary} /> : null}{filename ? <Text style={[styles.fileName, { color: colors.mutedForeground }]}>{filename}</Text> : null}{error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}</View> : <><View style={[styles.summary, { backgroundColor: colors.secondary }]}><View style={{ flex: 1, gap: 5 }}><Pill label={`${confidence}% CONFIDENCE`} color={colors.primary} /><Text style={[styles.summaryText, { color: colors.secondaryForeground }]}>{analysis.summary}</Text></View><Feather name="check-circle" size={23} color={colors.primary} /></View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Topics to review</Text><View style={{ gap: 8 }}>{analysis.topics.length ? analysis.topics.map((topic) => <Pressable key={topic.title} onPress={() => toggleTopic(topic.title)} style={[styles.finding, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name={selectedTopics.includes(topic.title) ? 'check-square' : 'square'} size={18} color={selectedTopics.includes(topic.title) ? colors.primary : colors.mutedForeground} /><View style={{ flex: 1, gap: 3 }}><Text style={[styles.findingTitle, { color: colors.foreground }]}>{topic.title}</Text><Text style={[styles.findingBody, { color: colors.mutedForeground }]}>{topic.description}</Text></View></Pressable>) : <Text style={{ color: colors.mutedForeground }}>No topics found.</Text>}</View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Possible dates to verify</Text><View style={{ gap: 8 }}>{analysis.deadlines.length ? analysis.deadlines.map((deadline) => <Pressable key={deadline.title} onPress={() => toggleDeadline(deadline.title)} style={[styles.finding, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name={selectedDeadlines.includes(deadline.title) ? 'check-square' : 'square'} size={18} color={selectedDeadlines.includes(deadline.title) ? colors.primary : colors.mutedForeground} /><View style={{ flex: 1, gap: 3 }}><Text style={[styles.findingTitle, { color: colors.foreground }]}>{deadline.title}</Text><Text style={[styles.findingBody, { color: colors.mutedForeground }]}>{deadline.type} · {deadline.dueDate} · {Math.round(deadline.confidence * 100)}% confidence</Text><Text style={[styles.evidence, { color: colors.mutedForeground }]}>“{deadline.evidence}”</Text></View></Pressable>) : <Text style={{ color: colors.mutedForeground }}>No dates found.</Text>}</View>{analysis.warnings.length ? <View style={[styles.warning, { backgroundColor: colors.accent }]}><Feather name="alert-circle" size={17} color={colors.warning} /><Text style={[styles.findingBody, { color: colors.accentForeground }]}>{analysis.warnings.join(' ')}</Text></View> : null}<Button label="Confirm selected findings" onPress={confirmFindings} icon="check" /><Button label="Analyze another PDF" onPress={() => { setAnalysis(null); setFilename(''); }} variant="ghost" icon="refresh-cw" /></>}</Screen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.7, marginTop: 3 },
  subtitle: { fontSize: 14, lineHeight: 21 },
  kindRow: { borderRadius: 14, padding: 4, flexDirection: 'row', gap: 4 },
  kindItem: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 11 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9 },
  uploadCard: { borderWidth: 1, borderRadius: 22, padding: 20, alignItems: 'center', gap: 12, marginTop: 4 },
  uploadIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  uploadTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  uploadBody: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 290 },
  fileName: { fontSize: 12 },
  error: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
  summary: { borderRadius: 18, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  summaryText: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginTop: 3 },
  finding: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  findingTitle: { fontSize: 14, fontWeight: '700' },
  findingBody: { fontSize: 12, lineHeight: 17 },
  evidence: { fontSize: 11, fontStyle: 'italic', lineHeight: 16 },
  warning: { borderRadius: 15, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
});