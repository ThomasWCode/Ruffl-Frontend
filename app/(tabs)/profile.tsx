import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api, ApiError } from '@/src/api/client';
import {
  Avatar,
  Button,
  Card,
  ErrorNotice,
  Eyebrow,
  Pill,
  Screen,
  textStyles,
  Title,
} from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { colours } from '@/src/theme';

export default function ProfileScreen() {
  const { signOut, token, user } = useSession();
  const [supportError, setSupportError] = useState('');
  const [openingSupport, setOpeningSupport] = useState(false);
  if (!user) return null;

  const openSupport = async () => {
    if (!token) return;
    setOpeningSupport(true);
    try {
      const { conversation } = await api.supportConversation(token);
      setSupportError('');
      router.push({ pathname: '/messages/[id]', params: { id: conversation.id } });
    } catch (caught) {
      setSupportError(caught instanceof ApiError ? caught.message : 'Could not contact support.');
    } finally {
      setOpeningSupport(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>Your Ruffl</Eyebrow>
      <Title subtitle="Manage your marketplace identity and development tools.">Account</Title>
      <Card tone="moss">
        <View style={styles.identity}>
          <Avatar name={user.displayName} size={64} />
          <View style={styles.flex}>
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={textStyles.muted}>{user.email}</Text>
            <Pill tone="positive">{user.role.toUpperCase()}</Pill>
          </View>
        </View>
        {user.bio ? <Text style={textStyles.body}>{user.bio}</Text> : null}
      </Card>
      {user.role === 'maker' ? (
        <>
          <Text style={styles.section}>Maker tools</Text>
          <Pressable onPress={() => router.push('/tools')}>
            <Card>
              <View style={styles.row}>
                <View style={styles.icon}>
                  <Ionicons color={colours.moss} name="calculator-outline" size={22} />
                </View>
                <View style={styles.flex}>
                  <Text style={textStyles.label}>Price and payout calculator</Text>
                  <Text style={textStyles.muted}>Estimate totals, deposits, fees, and maker payout locally.</Text>
                </View>
                <Ionicons color={colours.inkMuted} name="chevron-forward" size={18} />
              </View>
            </Card>
          </Pressable>
        </>
      ) : null}
      <Text style={styles.section}>Trust and safety</Text>
      {supportError ? <ErrorNotice message={supportError} /> : null}
      <Card>
        <View style={styles.row}>
          <Ionicons color={colours.moss} name="shield-checkmark-outline" size={22} />
          <View style={styles.flex}>
            <Text style={textStyles.label}>Account status</Text>
            <Text style={textStyles.muted}>Active · no restrictions</Text>
          </View>
        </View>
      </Card>
      <Button
        disabled={openingSupport}
        label={openingSupport ? 'Opening support…' : 'Contact Ruffl support'}
        onPress={() => void openSupport()}
        variant="secondary"
      />
      <Card tone="coral">
        <Text style={textStyles.label}>Payments are simulated</Text>
        <Text style={textStyles.muted}>
          This development build records symbolic deposits and milestone releases. It does not move money.
        </Text>
      </Card>
      <Button label="Sign out" onPress={() => void signOut()} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  flex: { flex: 1, gap: 5 },
  name: { color: colours.ink, fontSize: 21, fontWeight: '800' },
  section: { color: colours.ink, fontSize: 19, fontWeight: '800', marginTop: 6 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  icon: {
    alignItems: 'center',
    backgroundColor: colours.mossSoft,
    borderRadius: 19,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
