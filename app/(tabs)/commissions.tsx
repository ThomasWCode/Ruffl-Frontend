import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api, ApiError } from '@/src/api/client';
import {
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
import { formatMoney, statusLabel } from '@/src/lib/commission';
import { colours, radii } from '@/src/theme';
import type { Commission } from '@/src/types';

const filters = ['all', 'active', 'complete'] as const;

export default function CommissionsScreen() {
  const { token, user } = useSession();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setCommissions((await api.commissions(token)).commissions);
      setError('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = commissions.filter((commission) => {
    if (filter === 'all') return true;
    if (filter === 'complete') return commission.status === 'complete';
    return !['complete', 'cancelled'].includes(commission.status);
  });

  return (
    <Screen>
      <Eyebrow>{user?.role === 'maker' ? 'Your queue' : 'Your builds'}</Eyebrow>
      <Title subtitle="Every agreement, update, and approval in one place.">Projects</Title>
      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filter, filter === item && styles.filterSelected]}>
            <Text style={[styles.filterText, filter === item && styles.filterTextSelected]}>
              {item[0]?.toUpperCase()}
              {item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? <ErrorNotice message={error} /> : null}
      {loading ? <Loading /> : null}
      {!loading && shown.length === 0 ? (
        <EmptyState
          body={
            user?.role === 'maker'
              ? 'Accepted commission requests will build your queue here.'
              : 'Choose a maker from Discover to send your first request.'
          }
          icon="layers-outline"
          title="No projects here"
        />
      ) : null}
      {!loading
        ? shown
            .slice()
            .reverse()
            .map((commission) => (
              <Link
                href={{ pathname: '/commissions/[id]', params: { id: commission.id } }}
                key={commission.id}
                asChild>
                <Pressable>
                  <Card>
                    <View style={styles.rowBetween}>
                      <View style={styles.flex}>
                        <Text style={styles.title}>{commission.title}</Text>
                        <Text style={textStyles.muted}>
                          {commission.species} · {commission.suitType}
                        </Text>
                      </View>
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
                    <View style={styles.rule} />
                    <View style={styles.rowBetween}>
                      <Text style={textStyles.muted}>
                        {commission.agreedTotal ? 'Agreed total' : 'Budget'}
                      </Text>
                      <Text style={textStyles.label}>
                        {formatMoney(commission.agreedTotal ?? commission.budget)}
                      </Text>
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
  filters: { backgroundColor: '#EAE6DD', borderRadius: radii.medium, flexDirection: 'row', padding: 4 },
  filter: { alignItems: 'center', borderRadius: 12, flex: 1, paddingVertical: 10 },
  filterSelected: { backgroundColor: colours.surface },
  filterText: { color: colours.inkMuted, fontSize: 13, fontWeight: '700' },
  filterTextSelected: { color: colours.ink },
  rowBetween: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  flex: { flex: 1 },
  title: { color: colours.ink, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  rule: { backgroundColor: colours.line, height: 1 },
});
