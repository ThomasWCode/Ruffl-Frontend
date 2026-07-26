import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { Loading, Screen } from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { colours } from '@/src/theme';

interface TabIconProps {
  color: string;
  focused: boolean;
  size: number;
}

function tabIcon(
  active: keyof typeof Ionicons.glyphMap,
  inactive: keyof typeof Ionicons.glyphMap,
) {
  return function TabBarIcon({ color, focused, size }: TabIconProps) {
    return <Ionicons color={color} name={focused ? active : inactive} size={size} />;
  };
}

export default function TabLayout() {
  const { loading, restriction, user } = useSession();
  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }
  if (restriction) return <Redirect href="/suspended" />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colours.moss,
        tabBarInactiveTintColor: colours.inkMuted,
        tabBarStyle: {
          backgroundColor: colours.surface,
          borderTopColor: colours.line,
          height: 80,
          paddingBottom: 18,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="makers"
        options={{
          title: 'Discover',
          tabBarIcon: tabIcon('search', 'search-outline'),
        }}
      />
      <Tabs.Screen
        name="commissions"
        options={{
          title: 'Projects',
          tabBarIcon: tabIcon('layers', 'layers-outline'),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Messages',
          tabBarIcon: tabIcon('chatbubble-ellipses', 'chatbubble-ellipses-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: tabIcon('person-circle', 'person-circle-outline'),
        }}
      />
    </Tabs>
  );
}
