import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SessionProvider, useSession } from '@/src/context/session';
import { colours } from '@/src/theme';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Navigation />
    </SessionProvider>
  );
}

function Navigation() {
  const { restriction } = useSession();

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
    </>
  );
}
