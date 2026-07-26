import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api, ApiError } from '@/src/api/client';
import {
  Card,
  EmptyState,
  ErrorNotice,
  Eyebrow,
  Loading,
  Pill,
  Screen,
  textStyles,
  Title,
} from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { colours } from '@/src/theme';
import type { Conversation } from '@/src/types';

export default function InboxScreen() {
  const { token } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setConversations((await api.conversations(token)).conversations);
      setError('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load conversations.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <Eyebrow>Stay aligned</Eyebrow>
      <Title subtitle="Project, direct, dispute, and support messages share one inbox.">Messages</Title>
      {error ? <ErrorNotice message={error} /> : null}
      {loading ? <Loading /> : null}
      {!loading && conversations.length === 0 ? (
        <EmptyState
          body="A conversation is created automatically when a commission begins."
          icon="chatbubbles-outline"
          title="No messages yet"
        />
      ) : null}
      {!loading
        ? conversations.map((conversation) => (
            <Link
              href={{ pathname: '/messages/[id]', params: { id: conversation.id } }}
              key={conversation.id}
              asChild>
              <Pressable>
                <Card>
                  <View style={styles.row}>
                    <View style={styles.icon}>
                      <Ionicons
                        color={colours.moss}
                        name={
                          conversation.kind === 'dispute'
                            ? 'shield-checkmark-outline'
                            : conversation.kind === 'admin'
                              ? 'headset-outline'
                              : 'chatbubble-ellipses-outline'
                        }
                        size={22}
                      />
                    </View>
                    <View style={styles.flex}>
                      <View style={styles.top}>
                        <Text style={textStyles.label}>
                          {conversation.kind === 'commission'
                            ? 'Commission conversation'
                            : conversation.kind === 'admin'
                              ? 'Ruffl support'
                              : conversation.kind === 'dispute'
                                ? 'Dispute discussion'
                                : 'Direct conversation'}
                        </Text>
                        <Pill>{conversation.kind.toUpperCase()}</Pill>
                      </View>
                      <Text numberOfLines={2} style={textStyles.muted}>
                        {conversation.lastMessage?.text || 'No messages yet. Say hello.'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  icon: {
    alignItems: 'center',
    backgroundColor: colours.mossSoft,
    borderRadius: 20,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  flex: { flex: 1, gap: 6 },
  top: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
});
