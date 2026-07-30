import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { pickAndUploadImage } from '../services/media-upload';
import { colours, radii } from '../theme';
import type { MediaAttachment } from '../types';
import { Button, ErrorNotice } from './ui';

export function AttachmentPicker({
  attachments,
  disabled = false,
  onChange,
  token,
}: {
  attachments: MediaAttachment[];
  disabled?: boolean;
  onChange: (attachments: MediaAttachment[]) => void;
  token: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const addImage = async () => {
    if (attachments.length >= 10) return;
    setUploading(true);
    setError('');
    try {
      const attachment = await pickAndUploadImage(token);
      if (attachment) onChange([...attachments, attachment]);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'The image could not be uploaded.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.picker}>
      {error ? <ErrorNotice message={error} /> : null}
      {attachments.map((attachment) => (
        <View key={attachment.url} style={styles.selected}>
          <Image source={{ uri: attachment.url }} style={styles.selectedImage} />
          <Text numberOfLines={1} style={styles.selectedName}>
            {attachment.name}
          </Text>
          <Pressable
            accessibilityLabel={`Remove ${attachment.name}`}
            accessibilityRole="button"
            onPress={() =>
              onChange(
                attachments.filter((item) => item.url !== attachment.url),
              )
            }
            style={styles.remove}>
            <Ionicons color={colours.danger} name="close" size={18} />
          </Pressable>
        </View>
      ))}
      <Button
        disabled={disabled || uploading || attachments.length >= 10}
        icon="image-outline"
        label={
          uploading
            ? 'Uploading image…'
            : attachments.length >= 10
              ? 'Attachment limit reached'
              : 'Attach an image'
        }
        onPress={() => void addImage()}
        variant="secondary"
      />
    </View>
  );
}

export function AttachmentList({
  attachments,
}: {
  attachments: MediaAttachment[];
}) {
  if (!attachments.length) return null;
  return (
    <View style={styles.list}>
      {attachments.map((attachment) => (
        <Pressable
          accessibilityHint="Opens the full image"
          accessibilityLabel={attachment.name}
          accessibilityRole="link"
          key={attachment.url}
          onPress={() => void Linking.openURL(attachment.url)}
          style={styles.attachment}>
          <Image source={{ uri: attachment.url }} style={styles.image} />
          <View style={styles.attachmentLabel}>
            <Ionicons color={colours.moss} name="open-outline" size={14} />
            <Text numberOfLines={1} style={styles.name}>
              {attachment.name}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { gap: 8 },
  selected: {
    alignItems: 'center',
    backgroundColor: colours.cream,
    borderColor: colours.line,
    borderRadius: radii.small,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 7,
  },
  selectedImage: { borderRadius: 7, height: 38, width: 38 },
  selectedName: { color: colours.ink, flex: 1, fontSize: 13 },
  remove: { padding: 6 },
  list: { gap: 7, marginTop: 7 },
  attachment: {
    backgroundColor: colours.surface,
    borderColor: colours.line,
    borderRadius: radii.small,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: { height: 150, width: 220 },
  attachmentLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    maxWidth: 220,
    padding: 8,
  },
  name: { color: colours.ink, flex: 1, fontSize: 12, fontWeight: '700' },
});
