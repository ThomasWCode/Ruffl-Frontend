import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { api, ApiError } from '@/src/api/client';
import {
  Avatar,
  Card,
  EmptyState,
  ErrorNotice,
  Eyebrow,
  Loading,
  Pill,
  Screen,
  textStyles,
  Title,
} from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { formatMoney } from '@/src/lib/commission';
import { colours, radii } from '@/src/theme';
import type { MakerResult } from '@/src/types';

export default function MakersScreen() {
  const { token } = useSession();
  const [makers, setMakers] = useState<MakerResult[]>([]);
  const [search, setSearch] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setMakers(await api.makers(token, search, openOnly));
      setError('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load makers.');
    } finally {
      setLoading(false);
    }
  }, [openOnly, search, token]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <Screen>
      <Eyebrow>Find your fit</Eyebrow>
      <Title subtitle="Compare styles, prices, timing, and queue availability.">Discover makers</Title>
      <View style={styles.search}>
        <Ionicons color={colours.inkMuted} name="search" size={20} />
        <TextInput
          accessibilityLabel="Search makers"
          onChangeText={setSearch}
          placeholder="Name or specialism"
          placeholderTextColor={colours.inkMuted}
          style={styles.searchInput}
          value={search}
        />
      </View>
      <View style={styles.filter}>
        <View>
          <Text style={textStyles.label}>Open queues only</Text>
          <Text style={textStyles.muted}>Hide makers currently taking a break</Text>
        </View>
        <Switch
          onValueChange={setOpenOnly}
          thumbColor={colours.white}
          trackColor={{ false: colours.line, true: colours.moss }}
          value={openOnly}
        />
      </View>
      {error ? <ErrorNotice message={error} /> : null}
      {loading ? <Loading /> : null}
      {!loading && makers.length === 0 ? (
        <EmptyState
          body="Try a different name or clear the open-queue filter."
          icon="search-outline"
          title="No makers found"
        />
      ) : null}
      {!loading
        ? makers.map(({ user, profile, rating, completedCount }) => (
            <Link
              href={{ pathname: '/makers/[id]', params: { id: user.id } }}
              key={user.id}
              asChild>
              <Pressable>
                <Card>
                  <View style={styles.makerTop}>
                    <Avatar name={user.displayName} size={58} />
                    <View style={styles.flex}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name}>{user.displayName}</Text>
                        {profile.verified ? (
                          <Ionicons color={colours.moss} name="checkmark-circle" size={17} />
                        ) : null}
                      </View>
                      <Text style={textStyles.muted}>{profile.location || 'Location not added'}</Text>
                    </View>
                    <Pill tone={profile.queueOpen ? 'positive' : 'neutral'}>
                      {profile.queueOpen ? 'OPEN' : 'CLOSED'}
                    </Pill>
                  </View>
                  <View style={styles.tags}>
                    {profile.specialisms.slice(0, 3).map((tag) => (
                      <Pill key={tag}>{tag}</Pill>
                    ))}
                  </View>
                  <View style={styles.meta}>
                    <Text style={styles.metaText}>
                      ★ {rating ? rating.toFixed(1) : 'New'}
                    </Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.metaText}>{completedCount} complete</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.metaText}>from {formatMoney(profile.basePrices.head)}</Text>
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    alignItems: 'center',
    backgroundColor: colours.surface,
    borderColor: colours.line,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: { color: colours.ink, flex: 1, fontSize: 16, minHeight: 50 },
  filter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  makerTop: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  name: { color: colours.ink, fontSize: 18, fontWeight: '800' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaText: { color: colours.inkMuted, fontSize: 12, fontWeight: '700' },
  dot: { color: colours.line },
});
