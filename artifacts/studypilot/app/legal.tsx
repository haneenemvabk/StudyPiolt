import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { Button, Header, Screen } from '@/components/Shared';
import { useColors } from '@/hooks/useColors';

const privacy = `StudyPilot Privacy Policy (placeholder)

StudyPilot is designed to help you plan academic work. In this MVP, courses, tasks, exams, notes, and study sessions are stored on your device.

Uploaded PDFs are sent to the StudyPilot API server only to extract reviewable topics and dates. The extraction flow does not save the file after analysis. Findings are suggestions until you confirm them.

We do not put AI API keys in the mobile app. Do not upload documents you are not allowed to process.

Account deletion: use Delete all local data in Profile. Cloud accounts are not enabled yet.

This placeholder must be replaced with legal review before App Store submission.`;

const terms = `StudyPilot Terms of Use (placeholder)

StudyPilot is an adaptive academic planning system. It is not a homework-completion or cheating tool, and it does not guarantee exam outcomes.

Exam readiness labels are descriptive summaries of activity in the app (topics reviewed, tasks completed, sessions logged). They are not scientifically validated probabilities of passing.

Subscription prices are configurable in the app’s subscription configuration. Payments will use Apple In-App Purchase when StoreKit products are connected.

This placeholder must be replaced with legal review before App Store submission.`;

export default function LegalScreen() {
  const colors = useColors();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const isPrivacy = doc !== 'terms';
  return (
    <Screen>
      <Header title={isPrivacy ? 'Privacy Policy' : 'Terms of Use'} />
      <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 22 }}>{isPrivacy ? privacy : terms}</Text>
      <Button label="Close" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
