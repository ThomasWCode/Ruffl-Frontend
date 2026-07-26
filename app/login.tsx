import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/src/api/client';
import { Button, ErrorNotice, Eyebrow, Field, Screen, Title } from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { colours, radii } from '@/src/theme';

export default function LoginScreen() {
  const { restriction, signIn, signUp, user } = useSession();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'commissioner' | 'maker'>('commissioner');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp({ email, password, displayName, role });
      }
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
              : 'Choose how you use Ruffl. Admin access is never available through signup.'
          }>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
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
        <Field
          autoCapitalize="none"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          label="Password"
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          value={password}
        />
        {error ? <ErrorNotice message={error} /> : null}
        <Button
          disabled={submitting}
          label={submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          onPress={() => void submit()}
        />
        <Button
          label={mode === 'login' ? 'Create a Ruffl account' : 'I already have an account'}
          onPress={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
          }}
          variant="ghost"
        />
        {mode === 'login' ? (
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
