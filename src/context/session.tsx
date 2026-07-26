import * as SecureStore from 'expo-secure-store';
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

import { api, ApiError, setAccountRestrictionHandler } from '../api/client';
import type { User } from '../types';

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
  }) => Promise<void>;
  signOut: () => Promise<void>;
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

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(tokenKey);
    setToken(null);
    setUser(null);
    setWarning(null);
    setRestriction(null);
  }, []);

  useEffect(() => {
    setAccountRestrictionHandler((error) => {
      void SecureStore.deleteItemAsync(tokenKey);
      setToken(null);
      setUser(null);
      setWarning(null);
      setRestriction({ code: error.code, message: error.message });
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
      if (error instanceof ApiError && ['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'].includes(error.code)) {
        setRestriction({ code: error.code, message: error.message });
        await SecureStore.deleteItemAsync(tokenKey);
        setToken(null);
        setUser(null);
        setWarning(null);
      } else if (clearOnFailure) {
        await clearSession();
      }
    }
  }, [clearSession]);

  const restoreSession = useCallback(async () => {
    const saved = await SecureStore.getItemAsync(tokenKey);
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

  const finishAuthentication = useCallback(async (result: { token: string; user: User }) => {
    await SecureStore.setItemAsync(tokenKey, result.token);
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
        !['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'].includes(error.code)
      ) {
        setWarning(currentWarning);
      }
    }
  }, [token, warning]);

  const value = useMemo<SessionValue>(
    () => ({
      token,
      user,
      loading,
      warning,
      restriction,
      signIn: async (email, password) => finishAuthentication(await api.login(email, password)),
      signUp: async (input) => finishAuthentication(await api.signup(input)),
      signOut: clearSession,
      dismissWarning,
      dismissRestriction: () => setRestriction(null),
      refresh: restoreSession,
    }),
    [
      clearSession,
      dismissWarning,
      finishAuthentication,
      loading,
      restriction,
      restoreSession,
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
