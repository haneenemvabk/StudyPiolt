import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Pill, Screen } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';
import { useStudyPilot } from '@/context/StudyPilotContext';
import { storeKit } from '@/services/storeKit';

export default function SubscriptionScreen() {
  const colors = useColors();
  const { subscription, activateMockPro, restorePurchases } = useStudyPilot();
  const [annual, setAnnual] = useState(true);
  const features = ['Unlimited courses', 'Advanced AI planning', 'Automatic rescheduling', 'PDF & lecture analysis', 'Exam readiness insights', 'Deeper progress analytics'];
  const purchase = async () => {
    const productId = annual ? 'studypilot_pro_yearly' : 'studypilot_pro_monthly';
    const entitlement = await storeKit.purchase(productId);
    if (entitlement.active && entitlement.productId) activateMockPro(entitlement.productId);
  };
  const restore = async () => {
    await storeKit.restorePurchases();
    restorePurchases();
  };
  return <Screen><View style={styles.top}><Pressable onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.muted }]}><Feather name="x" size={20} color={colors.foreground} /></Pressable><Pill label={subscription.entitlement === 'pro' ? 'PRO ACTIVE' : 'STUDYPILOT PRO'} color={colors.primary} /><View style={{ width: 38 }} /></View><Text style={[styles.title, { color: colors.foreground }]}>Make your plan adapt.</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>More context in. Better next steps out. Pro helps StudyPilot keep pace when your semester changes.</Text><View style={[styles.priceCard, { backgroundColor: colors.navy }]}><View style={styles.toggle}><Pressable onPress={() => setAnnual(false)} style={[styles.toggleItem, !annual && { backgroundColor: '#31465e' }]}><Text style={styles.toggleText}>Monthly</Text></Pressable><Pressable onPress={() => setAnnual(true)} style={[styles.toggleItem, annual && { backgroundColor: colors.primary }]}><Text style={[styles.toggleText, annual && { color: colors.primaryForeground }]}>Yearly</Text></Pressable></View><Text style={styles.price}>{annual ? '$39.99' : '$4.99'}<Text style={styles.priceSuffix}>{annual ? ' / year' : ' / month'}</Text></Text><Text style={styles.priceNote}>{annual ? 'That’s $3.33 per month · save 33%' : 'Cancel anytime'}</Text><Button label={subscription.entitlement === 'pro' ? 'Pro is active' : 'Try Pro in review mode'} onPress={() => { void purchase(); }} icon="arrow-right" /></View><Text style={[styles.compareTitle, { color: colors.foreground }]}>Everything in Pro</Text><View style={{ gap: 14 }}>{features.map((feature) => <View key={feature} style={styles.feature}><View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}><Feather name="check" size={14} color={colors.primary} /></View><Text style={[styles.featureText, { color: colors.foreground }]}>{feature}</Text></View>)}</View><Button label="Restore Purchases" onPress={() => { void restore(); }} variant="ghost" icon="rotate-ccw" /><Text style={[styles.legal, { color: colors.mutedForeground }]}>The reviewer-safe mock StoreKit provider is active until App Store Connect products are connected. Restore Purchases · Terms · Privacy Policy</Text></Screen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1 },
  subtitle: { fontSize: 15, lineHeight: 23, marginTop: 10 },
  priceCard: { borderRadius: 23, padding: 18, gap: 12, marginTop: 24 },
  toggle: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: '#1b2a3d', borderRadius: 12, padding: 3 },
  toggleItem: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9 },
  toggleText: { color: '#b9c8d5', fontSize: 12, fontWeight: '700' },
  price: { color: '#fff', fontSize: 39, fontWeight: '700', marginTop: 9 },
  priceSuffix: { color: '#b9c8d5', fontSize: 15, fontWeight: '500' },
  priceNote: { color: '#b9c8d5', fontSize: 12, marginBottom: 5 },
  compareTitle: { fontSize: 19, fontWeight: '700', marginTop: 10 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  featureIcon: { width: 25, height: 25, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, fontWeight: '600' },
  legal: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 12 },
});