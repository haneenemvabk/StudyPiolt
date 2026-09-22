import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : View;
  const contentStyle = scroll ? [styles.scrollContent, { paddingTop: Math.max(18, insets.top + 8), paddingBottom: Math.max(110, insets.bottom + 90) }] : [styles.screenContent, { paddingTop: Math.max(18, insets.top + 8), paddingBottom: Math.max(30, insets.bottom + 18) }];
  return <Container style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>{children}</Container>;
}

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.header}><View style={styles.headerCopy}>{eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}<Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text></View>{right}</View>;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled = false }: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost'; icon?: keyof typeof Feather.glyphMap; disabled?: boolean }) {
  const colors = useColors();
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.secondary : 'transparent';
  const textColor = variant === 'primary' ? colors.primaryForeground : variant === 'ghost' ? colors.primary : colors.secondaryForeground;
  return <Pressable testID={`button-${label.toLowerCase().replaceAll(' ', '-')}`} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor, borderColor: variant === 'ghost' ? colors.border : backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.72 : 1 }, variant === 'ghost' && styles.ghostButton]}><Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>{icon ? <Feather name={icon} size={17} color={textColor} /> : null}</Pressable>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' }) {
  const colors = useColors();
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} keyboardType={keyboardType} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /></View>;
}

export function Pill({ label, color, muted = false }: { label: string; color?: string; muted?: boolean }) {
  const colors = useColors();
  return <View style={[styles.pill, { backgroundColor: muted ? colors.muted : color ? `${color}22` : colors.secondary }]}><View style={[styles.pillDot, { backgroundColor: color ?? colors.primary }]} /><Text style={[styles.pillText, { color: muted ? colors.mutedForeground : color ?? colors.secondaryForeground }]}>{label}</Text></View>;
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color ?? colors.primary }]} /></View>;
}

export function EmptyState({ icon = 'zap', title, body, action }: { icon?: keyof typeof Feather.glyphMap; title: string; body: string; action?: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={24} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{body}</Text>{action}</View>;
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 130, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  headerCopy: { flex: 1, gap: 5 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, lineHeight: 37, fontWeight: '700', letterSpacing: -0.8 },
  button: { minHeight: 50, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ghostButton: { borderWidth: 1 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { minHeight: 50, borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, fontSize: 16 },
  pill: { alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 7, borderRadius: 7, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 280 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});