import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SessionProvider, useSession } from '@/src/context/session';
import { colours } from '@/src/theme';

if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ??
      (__DEV__ ? 'development' : 'production'),
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}

function RootLayout() {
  return (
    <SessionProvider>
      <Navigation />
    </SessionProvider>
  );
}

export default Sentry.wrap(RootLayout);

function Navigation() {
  const { dismissWarning, restriction, warning } = useSession();

  useEffect(() => {
    if (restriction) router.replace('/suspended');
  }, [restriction]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colours.cream },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colours.cream },
          headerTintColor: colours.ink,
          headerTitleStyle: { fontWeight: '800' },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="suspended" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="makers/[id]" options={{ title: 'Maker profile' }} />
        <Stack.Screen name="request/[makerId]" options={{ title: 'Request commission' }} />
        <Stack.Screen name="commissions/[id]" options={{ title: 'Commission' }} />
        <Stack.Screen name="messages/[id]" options={{ title: 'Conversation' }} />
        <Stack.Screen name="tools" options={{ title: 'Maker calculator' }} />
      </Stack>
      <Modal
        animationType="fade"
        onRequestClose={() => void dismissWarning()}
        transparent
        visible={Boolean(warning)}>
        <View style={styles.warningOverlay}>
          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Ionicons color={colours.danger} name="warning-outline" size={26} />
            </View>
            <Text style={styles.warningEyebrow}>Message from Ruffl support</Text>
            <Text style={styles.warningTitle}>Account warning</Text>
            <Text style={styles.warningMessage}>{warning?.message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void dismissWarning()}
              style={({ pressed }) => [styles.warningButton, pressed && styles.warningButtonPressed]}>
              <Text style={styles.warningButtonText}>I understand</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  warningOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(29, 42, 36, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  warningCard: {
    backgroundColor: colours.surface,
    borderRadius: 24,
    gap: 10,
    maxWidth: 440,
    padding: 22,
    width: '100%',
  },
  warningIcon: {
    alignItems: 'center',
    backgroundColor: colours.coralSoft,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 4,
    width: 48,
  },
  warningEyebrow: {
    color: colours.coral,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  warningTitle: { color: colours.ink, fontSize: 23, fontWeight: '900' },
  warningMessage: { color: colours.ink, fontSize: 15, lineHeight: 22 },
  warningButton: {
    alignItems: 'center',
    backgroundColor: colours.moss,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  warningButtonPressed: { opacity: 0.7 },
  warningButtonText: { color: colours.white, fontSize: 15, fontWeight: '800' },
});
