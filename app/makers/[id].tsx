import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api, ApiError } from '@/src/api/client';
import {
  Avatar,
  Button,
  Card,
  ErrorNotice,
  Loading,
  Pill,
  Screen,
  SectionTitle,
  textStyles,
  Title,
} from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { formatMoney } from '@/src/lib/commission';
import { colours } from '@/src/theme';
import type { MakerResult } from '@/src/types';

export default function MakerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useSession();
  const [maker, setMaker] = useState<MakerResult | null>(null);
  const [error, setError] = useState('');
  const [waitlisted, setWaitlisted] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    api
      .maker(token, id)
      .then(setMaker)
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Could not load this maker.'));
  }, [id, token]);

  const joinWaitlist = async () => {
    if (!token || !id) return;
    try {
      await api.joinWaitlist(token, id, 'Please let me know when your queue reopens.');
      setWaitlisted(true);
      setError('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not join the waitlist.');
    }
  };

  if (!maker) {
    return (
      <Screen>
        {error ? <ErrorNotice message={error} /> : <Loading />}
      </Screen>
    );
  }

  const { profile } = maker;
  return (
    <Screen>
      <View style={styles.identity}>
        <Avatar name={maker.user.displayName} size={76} />
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Title>{maker.user.displayName}</Title>
            {profile.verified ? <Ionicons color={colours.moss} name="checkmark-circle" size={22} /> : null}
          </View>
          <Text style={textStyles.muted}>{profile.location}</Text>
          <View style={styles.tags}>
            {profile.trusted ? <Pill tone="positive">TRUSTED</Pill> : null}
            <Pill tone={profile.queueOpen ? 'positive' : 'neutral'}>
              {profile.queueOpen ? 'QUEUE OPEN' : 'QUEUE CLOSED'}
            </Pill>
          </View>
        </View>
      </View>
      {error ? <ErrorNotice message={error} /> : null}
      <Text style={textStyles.body}>{profile.bio || maker.user.bio || 'This maker has not added a bio yet.'}</Text>
      <View style={styles.tags}>
        {profile.specialisms.map((tag) => (
          <Pill key={tag}>{tag}</Pill>
        ))}
      </View>
      <View style={styles.stats}>
        <Card>
          <Text style={styles.statValue}>{maker.rating ? maker.rating.toFixed(1) : 'New'}</Text>
          <Text style={styles.statLabel}>Average rating</Text>
        </Card>
        <Card>
          <Text style={styles.statValue}>{maker.completedCount}</Text>
          <Text style={styles.statLabel}>Commissions</Text>
        </Card>
        <Card>
          <Text style={styles.statValue}>{profile.turnaroundWeeks}</Text>
          <Text style={styles.statLabel}>Weeks estimated</Text>
        </Card>
      </View>
      <SectionTitle>Starting prices</SectionTitle>
      <Card>
        {Object.entries(profile.basePrices).map(([name, price], index) => (
          <View key={name} style={[styles.priceRow, index > 0 && styles.rule]}>
            <Text style={textStyles.label}>{name[0]?.toUpperCase()}{name.slice(1)} suit</Text>
            <Text style={styles.price}>{formatMoney(price)}</Text>
          </View>
        ))}
      </Card>
      <SectionTitle>Add-ons</SectionTitle>
      <Card>
        <View style={styles.priceRow}>
          <Text style={textStyles.label}>Moving jaw</Text>
          <Text style={styles.price}>{formatMoney(profile.addOnPrices.movingJaw)}</Text>
        </View>
        <View style={[styles.priceRow, styles.rule]}>
          <Text style={textStyles.label}>Follow-me eyes</Text>
          <Text style={styles.price}>{formatMoney(profile.addOnPrices.followMeEyes)}</Text>
        </View>
        <View style={[styles.priceRow, styles.rule]}>
          <Text style={textStyles.label}>Cooling fan</Text>
          <Text style={styles.price}>{formatMoney(profile.addOnPrices.coolingFan)}</Text>
        </View>
      </Card>
      {user?.role === 'commissioner' ? (
        profile.queueOpen ? (
          <Button
            label="Request a commission"
            onPress={() =>
              router.push({
                pathname: '/request/[makerId]',
                params: { makerId: maker.user.id },
              })
            }
            icon="sparkles-outline"
          />
        ) : (
          <Button
            disabled={waitlisted}
            label={waitlisted ? 'You are on the waitlist' : 'Join the waitlist'}
            onPress={() => void joinWaitlist()}
            variant="secondary"
          />
        )
      ) : null}
      <SectionTitle>Reviews</SectionTitle>
      {maker.reviews.length === 0 ? (
        <Card>
          <Text style={textStyles.muted}>No completed-commission reviews yet.</Text>
        </Card>
      ) : (
        maker.reviews.map((review) => (
          <Card key={review.id}>
            <Text style={styles.stars}>★★★★★</Text>
            <Text style={textStyles.body}>{review.comment}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', flexDirection: 'row', gap: 15 },
  flex: { flex: 1 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7 },
  stats: { flexDirection: 'row', gap: 7 },
  statValue: { color: colours.ink, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  statLabel: { color: colours.inkMuted, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rule: { borderTopColor: colours.line, borderTopWidth: 1, paddingTop: 14 },
  price: { color: colours.moss, fontSize: 16, fontWeight: '900' },
  stars: { color: colours.amber, fontSize: 17, letterSpacing: 2 },
});
