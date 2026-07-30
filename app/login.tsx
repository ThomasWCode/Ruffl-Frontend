import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api, ApiError } from '@/src/api/client';
import { Button, ErrorNotice, Eyebrow, Field, Screen, Title } from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { colours, radii } from '@/src/theme';

export default function LoginScreen() {
  const { restriction, signIn, signUp, user } = useSession();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [role, setRole] = useState<'commissioner' | 'maker'>('commissioner');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [developmentUrl, setDevelopmentUrl] = useState('');
  const [verificationAvailable, setVerificationAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    setNotice('');
    setDevelopmentUrl('');
    setVerificationAvailable(false);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        const result = await signUp({ email, password, displayName, role });
        if (result) {
          setNotice(result.message);
          setDevelopmentUrl(result.developmentVerificationUrl ?? '');
          setPassword('');
          setMode('login');
        }
      } else {
        const result = await api.forgotPassword(email);
        setNotice(result.message);
        setDevelopmentUrl(result.developmentResetUrl ?? '');
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'EMAIL_NOT_VERIFIED') {
        setVerificationAvailable(true);
      }
      setError(caught instanceof ApiError ? caught.message : 'Could not connect to Ruffl.');
    } finally {
      setSubmitting(false);
    }
  };

  const resendVerification = async () => {
    setError('');
    setNotice('');
    setDevelopmentUrl('');
    setSubmitting(true);
    try {
      const result = await api.resendVerification(email);
      setNotice(result.message);
      setDevelopmentUrl(result.developmentVerificationUrl ?? '');
      setVerificationAvailable(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not connect to Ruffl.');
    } finally {
      setSubmitting(false);
    }
  };

  const demoLogin = async (demoRole: 'commissioner' | 'maker') => {
    setError('');
    setSubmitting(true);
    try {
      await signIn(`${demoRole}@demo.ruffl`, 'RufflDemo1!');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not connect to the demo API.');
    } finally {
      setSubmitting(false);
    }
  };

  if (restriction) return <Redirect href="/suspended" />;
  if (user) return <Redirect href="/(tabs)" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <Screen>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Text style={styles.markText}>R</Text>
          </View>
          <View>
            <Eyebrow>Made together</Eyebrow>
            <Text style={styles.wordmark}>ruffl</Text>
          </View>
        </View>
        <Title
          subtitle={
            mode === 'login'
              ? 'Keep commissions clear from first sketch to safe delivery.'
              : mode === 'signup'
                ? 'Choose how you use Ruffl. Admin access is never available through signup.'
                : 'Enter your account email. Ruffl will send a short-lived reset link if it matches an account.'
          }>
          {mode === 'login'
            ? 'Welcome back'
            : mode === 'signup'
              ? 'Create your account'
              : 'Reset your password'}
        </Title>
        {mode === 'signup' ? (
          <>
            <View style={styles.roles}>
              {(['commissioner', 'maker'] as const).map((item) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: role === item }}
                  key={item}
                  onPress={() => setRole(item)}
                  style={[styles.role, role === item && styles.roleSelected]}>
                  <Text style={[styles.roleText, role === item && styles.roleTextSelected]}>
                    {item === 'commissioner' ? 'I commission work' : 'I make suits'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field
              autoCapitalize="words"
              label="Display name"
              onChangeText={setDisplayName}
              placeholder="How people will know you"
              value={displayName}
            />
          </>
        ) : null}
        <Field
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />
        {mode !== 'forgot' ? (
          <Field
            autoCapitalize="none"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            label="Password"
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
          />
        ) : null}
        {error ? <ErrorNotice message={error} /> : null}
        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}
        {developmentUrl ? (
          <Button
            label="Open development-only email link"
            onPress={() => void Linking.openURL(developmentUrl)}
            variant="secondary"
          />
        ) : null}
        <Button
          disabled={submitting}
          label={
            submitting
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset email'
          }
          onPress={() => void submit()}
        />
        {mode === 'login' && verificationAvailable ? (
          <Button
            disabled={submitting}
            label="Resend verification email"
            onPress={() => void resendVerification()}
            variant="secondary"
          />
        ) : null}
        <Button
          label={mode === 'login' ? 'Create a Ruffl account' : 'Back to sign in'}
          onPress={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setNotice('');
            setDevelopmentUrl('');
            setVerificationAvailable(false);
          }}
          variant="ghost"
        />
        {mode === 'login' ? (
          <Button
            label="Forgot password?"
            onPress={() => {
              setMode('forgot');
              setError('');
              setNotice('');
              setDevelopmentUrl('');
              setVerificationAvailable(false);
            }}
            variant="ghost"
          />
        ) : null}
        {mode === 'login' && __DEV__ ? (
          <View style={styles.demo}>
            <Text style={styles.demoTitle}>Explore the local demo</Text>
            <Text style={styles.demoBody}>Start the backend first, then choose either side of the marketplace.</Text>
            <View style={styles.demoButtons}>
              <View style={styles.flex}>
                <Button
                  disabled={submitting}
                  label="Commissioner"
                  onPress={() => void demoLogin('commissioner')}
                  variant="secondary"
                />
              </View>
              <View style={styles.flex}>
                <Button
                  disabled={submitting}
                  label="Maker"
                  onPress={() => void demoLogin('maker')}
                  variant="secondary"
                />
              </View>
            </View>
          </View>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brand: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 22 },
  mark: {
    alignItems: 'center',
    backgroundColor: colours.coral,
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    transform: [{ rotate: '-5deg' }],
    width: 54,
  },
  markText: { color: colours.white, fontSize: 29, fontWeight: '900' },
  wordmark: { color: colours.ink, fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  roles: { backgroundColor: '#EBE7DE', borderRadius: radii.medium, flexDirection: 'row', padding: 4 },
  role: { alignItems: 'center', borderRadius: 12, flex: 1, padding: 12 },
  roleSelected: { backgroundColor: colours.surface },
  roleText: { color: colours.inkMuted, fontSize: 13, fontWeight: '700' },
  roleTextSelected: { color: colours.ink },
  notice: {
    backgroundColor: colours.mossSoft,
    borderColor: '#CBDCCF',
    borderRadius: radii.medium,
    borderWidth: 1,
    padding: 13,
  },
  noticeText: { color: colours.ink, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  demo: {
    borderColor: colours.line,
    borderRadius: radii.large,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
    padding: 16,
  },
  demoTitle: { color: colours.ink, fontSize: 15, fontWeight: '800' },
  demoBody: { color: colours.inkMuted, fontSize: 13, lineHeight: 18 },
  demoButtons: { flexDirection: 'row', gap: 10, marginTop: 5 },
});
