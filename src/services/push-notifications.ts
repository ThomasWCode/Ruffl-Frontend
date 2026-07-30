import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  deleteDeviceValue,
  getDeviceValue,
  setDeviceValue,
} from './device-storage';

const pushPreferenceKey = 'ruffl-push-enabled';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function permissionGranted(
  permission: Notifications.NotificationPermissionsStatus,
): boolean {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function expoPushToken(requestPermission: boolean): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Ruffl updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#385F4D',
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (!permissionGranted(permission) && requestPermission) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permissionGranted(permission)) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error(
      'This build is not linked to an EAS project, so Ruffl cannot create a push token.',
    );
  }
  return (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;
}

export async function enablePushNotifications(): Promise<string | null> {
  const token = await expoPushToken(true);
  if (token) {
    await setDeviceValue(pushPreferenceKey, 'true');
  }
  return token;
}

export async function currentPushToken(): Promise<string | null> {
  const enabled = await getDeviceValue(pushPreferenceKey);
  if (enabled !== 'true') return null;
  return expoPushToken(false);
}

export async function pushNotificationsEnabled(): Promise<boolean> {
  return (await getDeviceValue(pushPreferenceKey)) === 'true';
}

export async function disablePushNotifications(): Promise<void> {
  await deleteDeviceValue(pushPreferenceKey);
}

export function listenForNotificationResponses(
  handler: () => void,
): { remove: () => void } {
  if (Platform.OS === 'web') return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(handler);
}
