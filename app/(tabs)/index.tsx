import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, ApiError } from '@/src/api/client';
import {
  Avatar,
  Card,
  ErrorNotice,
  Eyebrow,
  Pill,
  SectionTitle,
  textStyles,
} from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { formatMoney, statusLabel } from '@/src/lib/commission';
import { colours, radii } from '@/src/theme';
import type { Commission, Notification } from '@/src/types';

export default function HomeScreen() {
  const { token, user } = useSession();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [commissionResult, notificationResult] = await Promise.all([
        api.commissions(token),
        api.notifications(token),
      ]);
      setCommissions(commissionResult.commissions);
      setNotifications(notificationResult.notifications);
      setError('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not refresh Ruffl.');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = commissions.filter((commission) =>
    ['pending', 'negotiating', 'price_proposed', 'accepted', 'active', 'shipping', 'disputed'].includes(
      commission.status,
    ),
  );
  const needsAttention = active.filter((commission) =>
    user?.role === 'maker'
      ? ['pending', 'negotiating'].includes(commission.status)
      : ['price_proposed', 'accepted', 'shipping'].includes(commission.status),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.screen}
        refreshControl={<RefreshControl onRefresh={() => { setRefreshing(true); void load(); }} refreshing={refreshing} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View>
            <Eyebrow>{user?.role === 'maker' ? 'Maker studio' : 'Commission desk'}</Eyebrow>
            <Text style={styles.greeting}>Hi, {user?.displayName.split(' ')[0]}</Text>
          </View>
          <Avatar name={user?.displayName ?? 'Ruffl'} />
        </View>
        {error ? <ErrorNotice message={error} /> : null}
        <Card tone="moss">
          <View style={styles.heroTop}>
            <View style={styles.flex}>
              <Text style={styles.heroKicker}>
                {needsAttention.length ? 'NEEDS YOUR ATTENTION' : 'EVERYTHING IS ON TRACK'}
              </Text>
              <Text style={styles.heroTitle}>
                {needsAttention.length
                  ? `${needsAttention.length} ${needsAttention.length === 1 ? 'project' : 'projects'} waiting`
                  : `${active.length} active ${active.length === 1 ? 'project' : 'projects'}`}
              </Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons color={colours.moss} name="paw" size={24} />
            </View>
          </View>
          <Text style={textStyles.muted}>
            {user?.role === 'maker'
              ? 'Respond to requests, post progress, and keep your queue moving.'
              : 'Review prices and progress updates when they arrive.'}
          </Text>
          <Link href="/(tabs)/commissions" asChild>
            <Pressable style={styles.textLink}>
              <Text style={styles.textLinkLabel}>Open projects</Text>
              <Ionicons color={colours.moss} name="arrow-forward" size={16} />
            </Pressable>
          </Link>
        </Card>
        <View style={styles.stats}>
          <Card>
            <Text style={styles.statNumber}>{active.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </Card>
          <Card>
            <Text style={styles.statNumber}>
              {commissions.filter((commission) => commission.status === 'complete').length}
            </Text>
            <Text style={styles.statLabel}>Complete</Text>
          </Card>
          <Card>
            <Text style={styles.statNumber}>{notifications.filter((item) => !item.read).length}</Text>
            <Text style={styles.statLabel}>New alerts</Text>
          </Card>
        </View>
        <SectionTitle>Recent projects</SectionTitle>
        {commissions.length === 0 ? (
          <Card>
            <Text style={textStyles.label}>No commissions yet</Text>
            <Text style={textStyles.muted}>
              {user?.role === 'maker'
                ? 'New requests will appear here.'
                : 'Discover a maker to start a structured request.'}
            </Text>
          </Card>
        ) : (
          commissions
            .slice()
            .reverse()
            .slice(0, 3)
            .map((commission) => (
              <Link
                href={{ pathname: '/commissions/[id]', params: { id: commission.id } }}
                key={commission.id}
                asChild>
                <Pressable>
                  <Card>
                    <View style={styles.rowBetween}>
                      <Text style={[textStyles.label, styles.flex]}>{commission.title}</Text>
                      <Pill
                        tone={
                          commission.status === 'complete'
                            ? 'positive'
                            : commission.status === 'disputed'
                              ? 'danger'
                              : 'warning'
                        }>
                        {statusLabel(commission.status)}
                      </Pill>
                    </View>
                    <Text style={textStyles.muted}>
                      {commission.species} · {commission.suitType} ·{' '}
                      {formatMoney(commission.agreedTotal ?? commission.budget)}
                    </Text>
                  </Card>
                </Pressable>
              </Link>
            ))
        )}
        <SectionTitle>Latest activity</SectionTitle>
        <Card>
          {notifications.length === 0 ? (
            <Text style={textStyles.muted}>You are all caught up.</Text>
          ) : (
            notifications
              .slice()
              .reverse()
              .slice(0, 4)
              .map((notification, index) => (
                <View
                  key={notification.id}
                  style={[styles.activity, index > 0 && styles.activityBorder]}>
                  <View style={styles.activityDot} />
                  <View style={styles.flex}>
                    <Text style={textStyles.label}>{notification.title}</Text>
                    <Text style={textStyles.muted}>{notification.body}</Text>
                  </View>
                </View>
              ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colours.cream, flex: 1 },
  screen: { gap: 18, paddingBottom: 110, paddingHorizontal: 20, paddingTop: 18 },
  top: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  greeting: { color: colours.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.7, marginTop: 3 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  rowBetween: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  flex: { flex: 1 },
  heroTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  heroKicker: { color: colours.moss, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: colours.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colours.surface,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  textLink: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 6, paddingVertical: 4 },
  textLinkLabel: { color: colours.moss, fontSize: 14, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: 8 },
  statNumber: { color: colours.ink, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  statLabel: { color: colours.inkMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  activity: { flexDirection: 'row', gap: 11, paddingVertical: 8 },
  activityBorder: { borderTopColor: colours.line, borderTopWidth: 1, paddingTop: 14 },
  activityDot: {
    backgroundColor: colours.coral,
    borderRadius: radii.pill,
    height: 8,
    marginTop: 6,
    width: 8,
  },
});
