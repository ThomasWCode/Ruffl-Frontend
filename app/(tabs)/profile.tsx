import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
import { pickAndUploadImage } from '@/src/services/media-upload';
import {
  disablePushNotifications,
  enablePushNotifications,
  pushNotificationsEnabled,
} from '@/src/services/push-notifications';
import { colours } from '@/src/theme';

export default function ProfileScreen() {
  const { deleteAccount, refresh, signOut, token, user } = useSession();
  const [supportError, setSupportError] = useState('');
  const [openingSupport, setOpeningSupport] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    void pushNotificationsEnabled().then(setPushEnabled);
  }, []);

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

  const enablePush = async () => {
    if (!token) return;
    setPushBusy(true);
    setPushError('');
    try {
      const pushToken = await enablePushNotifications();
      if (!pushToken) {
        setPushError('Notification permission was not granted on this device.');
        return;
      }
      await api.updateMe(token, { pushToken });
      setPushEnabled(true);
    } catch (caught) {
      setPushError(
        caught instanceof Error
          ? caught.message
          : 'Could not enable push notifications.',
      );
    } finally {
      setPushBusy(false);
    }
  };

  const disablePush = async () => {
    if (!token) return;
    setPushBusy(true);
    setPushError('');
    try {
      await api.updateMe(token, { pushToken: '' });
      await disablePushNotifications();
      setPushEnabled(false);
    } catch (caught) {
      setPushError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not disable push notifications.',
      );
    } finally {
      setPushBusy(false);
    }
  };

  const updateAvatar = async () => {
    if (!token) return;
    setAvatarBusy(true);
    setAvatarError('');
    try {
      const attachment = await pickAndUploadImage(token, 'avatar');
      if (!attachment) return;
      await api.updateMe(token, { avatarUrl: attachment.url });
      await refresh();
    } catch (caught) {
      setAvatarError(
        caught instanceof ApiError || caught instanceof Error
          ? caught.message
          : 'Could not update the profile image.',
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAccount = async () => {
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await deleteAccount();
    } catch (caught) {
      setDeleteError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not delete this account.',
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>Your Ruffl</Eyebrow>
      <Title subtitle="Manage your marketplace identity and development tools.">Account</Title>
      <Card tone="moss">
        <View style={styles.identity}>
          <Avatar name={user.displayName} size={64} uri={user.avatarUrl} />
          <View style={styles.flex}>
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={textStyles.muted}>{user.email}</Text>
            <Pill tone="positive">{user.role.toUpperCase()}</Pill>
          </View>
        </View>
        {user.bio ? <Text style={textStyles.body}>{user.bio}</Text> : null}
        {avatarError ? <ErrorNotice message={avatarError} /> : null}
        <Button
          disabled={avatarBusy}
          icon="image-outline"
          label={avatarBusy ? 'Uploading profile image…' : 'Change profile image'}
          onPress={() => void updateAvatar()}
          variant="secondary"
        />
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
      <Text style={styles.section}>Notifications</Text>
      {pushError ? <ErrorNotice message={pushError} /> : null}
      <Card>
        <View style={styles.row}>
          <Ionicons color={colours.moss} name="notifications-outline" size={22} />
          <View style={styles.flex}>
            <Text style={textStyles.label}>
              {pushEnabled ? 'Push notifications enabled' : 'Push notifications disabled'}
            </Text>
            <Text style={textStyles.muted}>
              {Platform.OS === 'web'
                ? 'Install an Android or iOS development/production build to receive push notifications.'
                : 'Receive commission, message, warning, and support updates when Ruffl is closed.'}
            </Text>
          </View>
        </View>
        {Platform.OS !== 'web' ? (
          <Button
            disabled={pushBusy}
            label={
              pushBusy
                ? 'Updating…'
                : pushEnabled
                  ? 'Disable push notifications'
                  : 'Enable push notifications'
            }
            onPress={() => void (pushEnabled ? disablePush() : enablePush())}
            variant="secondary"
          />
        ) : null}
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
      <Text style={styles.section}>Delete account</Text>
      {deleteError ? <ErrorNotice message={deleteError} /> : null}
      {deleteConfirming ? (
        <Card tone="coral">
          <Text style={textStyles.label}>Permanently stop using this Ruffl account?</Text>
          <Text style={textStyles.muted}>
            You will be signed out and unable to log in. Shared commission and message records remain for
            counterparties and safety auditing. Finish or cancel active commissions first.
          </Text>
          <View style={styles.deleteActions}>
            <Button
              disabled={deleteBusy}
              label="Keep account"
              onPress={() => setDeleteConfirming(false)}
              variant="secondary"
            />
            <Button
              disabled={deleteBusy}
              label={deleteBusy ? 'Deleting account…' : 'Delete account'}
              onPress={() => void removeAccount()}
              variant="danger"
            />
          </View>
        </Card>
      ) : (
        <Button
          label="Delete account"
          onPress={() => setDeleteConfirming(true)}
          variant="danger"
        />
      )}
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
  deleteActions: { gap: 10 },
});
