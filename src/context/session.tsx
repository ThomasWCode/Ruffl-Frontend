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

import { api, ApiError, setAccountRestrictionHandler } from '../api/client';
import type { User } from '../types';

const tokenKey = 'ruffl-session-token';

interface SessionValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  warning: string | null;
  restriction: { code: string; message: string } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    displayName: string;
    role: 'commissioner' | 'maker';
  }) => Promise<void>;
  signOut: () => Promise<void>;
  dismissRestriction: () => void;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
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
      setRestriction({ code: error.code, message: error.message });
    });
    return () => setAccountRestrictionHandler(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const saved = await SecureStore.getItemAsync(tokenKey);
    if (!saved) {
      setLoading(false);
      return;
    }

    try {
      const result = await api.me(saved);
      setToken(saved);
      setUser(result.user);
      setWarning(result.warnings[0]?.message ?? null);
    } catch (error) {
      if (error instanceof ApiError && ['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'].includes(error.code)) {
        setRestriction({ code: error.code, message: error.message });
        await SecureStore.deleteItemAsync(tokenKey);
        setToken(null);
        setUser(null);
      } else {
        await clearSession();
      }
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const finishAuthentication = useCallback(async (result: { token: string; user: User }) => {
    await SecureStore.setItemAsync(tokenKey, result.token);
    setToken(result.token);
    setUser(result.user);
    setWarning(null);
  }, []);

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
      dismissRestriction: () => setRestriction(null),
      refresh: restoreSession,
    }),
    [clearSession, finishAuthentication, loading, restriction, restoreSession, token, user, warning],
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
