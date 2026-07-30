import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colours, radii, shadow } from '../theme';

export function Screen({
  children,
  scroll = true,
}: PropsWithChildren<{ scroll?: boolean }>) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.screen}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.screenFixed}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({
  children,
  subtitle,
}: PropsWithChildren<{ subtitle?: string }>) {
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.title}>{children}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({
  children,
  action,
}: PropsWithChildren<{ action?: ReactNode }>) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export function Card({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: 'default' | 'moss' | 'coral' }>) {
  return (
    <View
      style={[
        styles.card,
        tone === 'moss' && styles.cardMoss,
        tone === 'coral' && styles.cardCoral,
      ]}>
      {children}
    </View>
  );
}

export function Pill({
  children,
  tone = 'neutral',
}: PropsWithChildren<{ tone?: 'neutral' | 'positive' | 'warning' | 'danger' }>) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'positive' && styles.pillPositive,
        tone === 'warning' && styles.pillWarning,
        tone === 'danger' && styles.pillDanger,
      ]}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        variant === 'ghost' && styles.buttonGhost,
        (pressed || disabled) && styles.buttonPressed,
      ]}>
      {icon ? (
        <Ionicons
          color={variant === 'secondary' || variant === 'ghost' ? colours.ink : colours.white}
          name={icon}
          size={17}
        />
      ) : null}
      <Text
        style={[
          styles.buttonLabel,
          (variant === 'secondary' || variant === 'ghost') && styles.buttonLabelDark,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colours.inkMuted}
        style={[styles.input, props.multiline && styles.inputMultiline]}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Avatar({
  name,
  size = 48,
  uri,
}: {
  name: string;
  size?: number;
  uri?: string;
}) {
  if (uri) {
    return (
      <Image
        accessibilityLabel={`${name}'s profile image`}
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons color={colours.moss} name={icon} size={28} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colours.moss} size="large" />
    </View>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <View style={styles.error}>
      <Ionicons color={colours.danger} name="alert-circle-outline" size={18} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export const textStyles = StyleSheet.create({
  body: { color: colours.ink, fontSize: 15, lineHeight: 22 },
  muted: { color: colours.inkMuted, fontSize: 14, lineHeight: 20 },
  label: { color: colours.ink, fontSize: 14, fontWeight: '700' },
  amount: { color: colours.ink, fontSize: 25, fontWeight: '800' },
});

const styles = StyleSheet.create({
  safe: { backgroundColor: colours.cream, flex: 1 },
  screen: { gap: 18, paddingHorizontal: 20, paddingBottom: 120, paddingTop: 18 },
  screenFixed: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 18 },
  eyebrow: {
    color: colours.coral,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  titleBlock: { gap: 6 },
  title: { color: colours.ink, fontSize: 31, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: colours.inkMuted, fontSize: 15, lineHeight: 22 },
  sectionTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: colours.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  card: {
    backgroundColor: colours.surface,
    borderColor: colours.line,
    borderRadius: radii.large,
    borderWidth: 1,
    gap: 12,
    padding: 17,
    ...shadow,
  },
  cardMoss: { backgroundColor: colours.mossSoft, borderColor: '#CBDCCF' },
  cardCoral: { backgroundColor: colours.coralSoft, borderColor: '#F0CDC2' },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECE9E2',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillPositive: { backgroundColor: colours.mossSoft },
  pillWarning: { backgroundColor: '#F8EBCB' },
  pillDanger: { backgroundColor: colours.coralSoft },
  pillText: { color: colours.ink, fontSize: 11, fontWeight: '800' },
  button: {
    alignItems: 'center',
    backgroundColor: colours.moss,
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  buttonSecondary: {
    backgroundColor: colours.surface,
    borderColor: colours.line,
    borderWidth: 1,
  },
  buttonDanger: { backgroundColor: colours.danger },
  buttonGhost: { backgroundColor: 'transparent', minHeight: 42 },
  buttonPressed: { opacity: 0.65 },
  buttonLabel: { color: colours.white, fontSize: 15, fontWeight: '800' },
  buttonLabelDark: { color: colours.ink },
  field: { gap: 7 },
  fieldLabel: { color: colours.ink, fontSize: 13, fontWeight: '800' },
  input: {
    backgroundColor: colours.surface,
    borderColor: colours.line,
    borderRadius: radii.medium,
    borderWidth: 1,
    color: colours.ink,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 105, textAlignVertical: 'top' },
  hint: { color: colours.inkMuted, fontSize: 12, lineHeight: 17 },
  avatar: { alignItems: 'center', backgroundColor: colours.moss, justifyContent: 'center' },
  avatarText: { color: colours.white, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 9, paddingHorizontal: 24, paddingVertical: 40 },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colours.mossSoft,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyTitle: { color: colours.ink, fontSize: 18, fontWeight: '800' },
  emptyBody: { color: colours.inkMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 280 },
  error: {
    alignItems: 'center',
    backgroundColor: colours.coralSoft,
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: 9,
    padding: 13,
  },
  errorText: { color: colours.danger, flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
