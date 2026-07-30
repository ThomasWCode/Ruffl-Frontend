import * as Sentry from '@sentry/react-native';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  api,
  ApiError,
  type VerificationRequired,
  setAccountRestrictionHandler,
} from '../api/client';
import type { User } from '../types';
import {
  currentPushToken,
  disablePushNotifications,
} from '../services/push-notifications';
import {
  deleteDeviceValue,
  getDeviceValue,
  setDeviceValue,
} from '../services/device-storage';

const tokenKey = 'ruffl-session-token';

interface SessionValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  warning: { id: string; message: string } | null;
  restriction: { code: string; message: string } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    displayName: string;
    role: 'commissioner' | 'maker';
  }) => Promise<VerificationRequired | null>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  dismissWarning: () => Promise<void>;
  dismissRestriction: () => void;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [warning, setWarning] = useState<{ id: string; message: string } | null>(null);
  const [restriction, setRestriction] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = user?.id;

  const clearSession = useCallback(async () => {
    await deleteDeviceValue(tokenKey);
    setToken(null);
    setUser(null);
    setWarning(null);
    setRestriction(null);
  }, []);

  useEffect(() => {
    setAccountRestrictionHandler((error) => {
      void deleteDeviceValue(tokenKey);
      setToken(null);
      setUser(null);
      setWarning(null);
      setRestriction(
        ['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'].includes(error.code)
          ? { code: error.code, message: error.message }
          : null,
      );
    });
    return () => setAccountRestrictionHandler(null);
  }, []);

  const checkSession = useCallback(async (sessionToken: string, clearOnFailure = false) => {
    try {
      const result = await api.me(sessionToken);
      setToken(sessionToken);
      setUser(result.user);
      setWarning(result.warnings[0] ?? null);
    } catch (error) {
      if (
        error instanceof ApiError &&
        ['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'].includes(error.code)
      ) {
        setRestriction({ code: error.code, message: error.message });
        await deleteDeviceValue(tokenKey);
        setToken(null);
        setUser(null);
        setWarning(null);
      } else if (error instanceof ApiError && error.status === 401) {
        await clearSession();
      } else if (clearOnFailure) {
        await clearSession();
      }
    }
  }, [clearSession]);

  const restoreSession = useCallback(async () => {
    const saved = await getDeviceValue(tokenKey);
    if (saved) {
      await checkSession(saved, true);
    }
    setLoading(false);
  }, [checkSession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!token) return;

    let requestInFlight = false;
    const checkCurrentSession = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        await checkSession(token);
      } finally {
        requestInFlight = false;
      }
    };
    const interval = setInterval(() => void checkCurrentSession(), 3_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkCurrentSession();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkSession, token]);

  useEffect(() => {
    if (!token || !userId) return;
    let cancelled = false;
    void currentPushToken()
      .then(async (pushToken) => {
        if (!cancelled && pushToken) {
          await api.updateMe(token, { pushToken });
        }
      })
      .catch((error) => Sentry.captureException(error));
    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  const finishAuthentication = useCallback(async (result: { token: string; user: User }) => {
    await setDeviceValue(tokenKey, result.token);
    setToken(result.token);
    setUser(result.user);
    setWarning(null);
    setRestriction(null);
    await checkSession(result.token);
  }, [checkSession]);

  const dismissWarning = useCallback(async () => {
    if (!token || !warning) return;
    const currentWarning = warning;
    setWarning(null);
    try {
      await api.readWarning(token, currentWarning.id);
    } catch (error) {
      if (
        !(error instanceof ApiError) ||
        (error.status !== 401 &&
          !['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'].includes(error.code))
      ) {
        setWarning(currentWarning);
      }
    }
  }, [token, warning]);

  const signOut = useCallback(async () => {
    try {
      if (token) await api.updateMe(token, { pushToken: '' });
    } catch (error) {
      Sentry.captureException(error);
    } finally {
      await disablePushNotifications();
      await clearSession();
    }
  }, [clearSession, token]);

  const deleteAccount = useCallback(async () => {
    if (!token) return;
    await api.deleteMe(token);
    await disablePushNotifications();
    await clearSession();
  }, [clearSession, token]);

  const value = useMemo<SessionValue>(
    () => ({
      token,
      user,
      loading,
      warning,
      restriction,
      signIn: async (email, password) => {
        const result = await api.login(email, password);
        if (result.user.role === 'admin') {
          throw new ApiError(
            'Admin accounts must use the Ruffl admin dashboard.',
            'ADMIN_DASHBOARD_REQUIRED',
            403,
          );
        }
        await finishAuthentication(result);
      },
      signUp: async (input) => {
        const result = await api.signup(input);
        if ('requiresEmailVerification' in result) {
          return result;
        }
        await finishAuthentication(result);
        return null;
      },
      signOut,
      deleteAccount,
      dismissWarning,
      dismissRestriction: () => setRestriction(null),
      refresh: restoreSession,
    }),
    [
      dismissWarning,
      deleteAccount,
      finishAuthentication,
      loading,
      restriction,
      restoreSession,
      signOut,
      token,
      user,
      warning,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used inside SessionProvider.');
  }
  return session;
}
