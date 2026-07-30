import { fetch as expoFetch } from 'expo/fetch';
import { File as ExpoFile } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { api } from '../api/client';
import type { MediaAttachment } from '../types';

type ImageCategory = 'image' | 'avatar' | 'banner';

const imageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const extensionTypes: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function contentTypeFor(
  asset: ImagePicker.ImagePickerAsset,
  file: ExpoFile,
): string {
  const supplied = (asset.mimeType ?? asset.file?.type ?? file.type)
    ?.trim()
    .toLowerCase();
  if (supplied && imageTypes.has(supplied)) return supplied;

  const extension = asset.fileName?.split('.').at(-1)?.toLowerCase();
  const inferred = extension ? extensionTypes[extension] : undefined;
  if (inferred) return inferred;

  throw new Error(
    'Choose a JPEG, PNG, WebP, or GIF image. HEIC and AVIF files are not supported yet.',
  );
}

function fileNameFor(
  asset: ImagePicker.ImagePickerAsset,
  contentType: string,
): string {
  const extension = contentType === 'image/jpeg'
    ? 'jpg'
    : contentType.split('/')[1] ?? 'image';
  return (asset.fileName?.trim() || `ruffl-${Date.now()}.${extension}`).slice(
    0,
    255,
  );
}

export async function pickAndUploadImage(
  token: string,
  category: ImageCategory = 'image',
): Promise<MediaAttachment | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: category !== 'image',
    aspect:
      category === 'avatar'
        ? [1, 1]
        : category === 'banner'
          ? [3, 1]
          : undefined,
    quality: 1,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) throw new Error('The selected image could not be read.');

  const file = new ExpoFile(asset.uri);
  const contentType = contentTypeFor(asset, file);
  const size = asset.fileSize ?? asset.file?.size ?? file.size;
  if (!size || size > 10 * 1024 * 1024) {
    throw new Error('Choose an image smaller than 10 MiB.');
  }
  const name = fileNameFor(asset, contentType);
  const { slot } = await api.uploadSlot(token, {
    fileName: name,
    contentType,
    size,
    category,
  });
  const response = await expoFetch(slot.uploadUrl, {
    method: slot.method,
    headers: slot.headers,
    body: asset.file ?? file,
  });
  if (!response.ok) {
    throw new Error(`The image upload failed with status ${response.status}.`);
  }
  return {
    url: slot.publicUrl,
    name,
    contentType,
  };
}
