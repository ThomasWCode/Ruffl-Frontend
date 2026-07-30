import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, ApiError } from '@/src/api/client';
import {
  AttachmentList,
  AttachmentPicker,
} from '@/src/components/attachments';
import { ErrorNotice, Loading } from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { colours, radii } from '@/src/theme';
import type { MediaAttachment, Message } from '@/src/types';

export default function MessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      setMessages((await api.messages(token, id)).messages);
      setError('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 3_000);
    return () => clearInterval(interval);
  }, [load]);

  const send = async () => {
    if (!token || !id || (!text.trim() && attachments.length === 0)) return;
    setSending(true);
    try {
      const result = await api.sendMessage(token, id, text, attachments);
      setMessages((current) => [...current, result.message]);
      setText('');
      setAttachments([]);
      setError('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not send this message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
        {loading ? (
          <Loading />
        ) : (
          <ScrollView contentContainerStyle={styles.messages}>
            {messages.length === 0 ? (
              <Text style={styles.empty}>Start with the details you both need to keep this project clear.</Text>
            ) : null}
            {messages.map((message) => {
              const mine = message.senderId === user?.id;
              return (
                <View key={message.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  {message.text ? (
                    <Text style={[styles.messageText, mine && styles.mineText]}>{message.text}</Text>
                  ) : null}
                  <AttachmentList attachments={message.attachments} />
                  <Text style={[styles.time, mine && styles.mineTime]}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
        {error ? <View style={styles.error}><ErrorNotice message={error} /></View> : null}
        <View style={styles.composerShell}>
          {token ? (
            <AttachmentPicker
              attachments={attachments}
              disabled={sending}
              onChange={setAttachments}
              token={token}
            />
          ) : null}
          <View style={styles.composer}>
            <TextInput
              editable={!sending}
              multiline
              onChangeText={setText}
              placeholder="Write a message"
              placeholderTextColor={colours.inkMuted}
              style={styles.input}
              value={text}
            />
            <Pressable
              accessibilityLabel="Send message"
              disabled={sending || (!text.trim() && attachments.length === 0)}
              onPress={() => void send()}
              style={({ pressed }) => [
                styles.send,
                (pressed ||
                  sending ||
                  (!text.trim() && attachments.length === 0)) &&
                  styles.sendDisabled,
              ]}>
              <Ionicons color={colours.white} name="arrow-up" size={21} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colours.cream, flex: 1 },
  messages: { flexGrow: 1, gap: 9, justifyContent: 'flex-end', padding: 16 },
  empty: { color: colours.inkMuted, fontSize: 14, lineHeight: 20, margin: 30, textAlign: 'center' },
  bubble: { borderRadius: 18, maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: colours.moss, borderBottomRightRadius: 5 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colours.surface, borderBottomLeftRadius: 5 },
  messageText: { color: colours.ink, fontSize: 15, lineHeight: 21 },
  mineText: { color: colours.white },
  time: { color: colours.inkMuted, fontSize: 10, marginTop: 4 },
  mineTime: { color: '#CFE2D7', textAlign: 'right' },
  error: { paddingHorizontal: 12 },
  composerShell: {
    backgroundColor: colours.surface,
    borderTopColor: colours.line,
    borderTopWidth: 1,
    gap: 8,
    padding: 11,
  },
  composer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 9,
  },
  input: {
    backgroundColor: colours.cream,
    borderRadius: radii.medium,
    color: colours.ink,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 46,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  send: {
    alignItems: 'center',
    backgroundColor: colours.moss,
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  sendDisabled: { opacity: 0.5 },
});
