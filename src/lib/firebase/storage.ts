import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './client';

export interface ProcessedImageAsset {
  fileName: string;
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
  width: number;
  height: number;
  sizeBytes: number;
  dataUrl: string;
  thumbDataUrl: string;
}

const MAX_FULL_DIMENSION = 1400;
const MAX_THUMB_DIMENSION = 320;
const MAX_FULL_DATA_URL_CHARS = 650000;
const MAX_THUMB_DATA_URL_CHARS = 75000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to decode image file: ${file.name}`));
    };
    img.src = objectUrl;
  });
}

function renderCanvas(
  img: HTMLImageElement,
  maxDim: number,
  quality: number
): { dataUrl: string; width: number; height: number } {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is unavailable.');
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return {
    dataUrl: canvas.toDataURL('image/jpeg', quality),
    width,
    height,
  };
}

export async function processImageAsset(file: File): Promise<ProcessedImageAsset> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`Unsupported file "${file.name}". Please select a JPEG, PNG, or WebP image.`);
  }

  const img = await loadImage(file);

  let quality = 0.84;
  let maxDim = MAX_FULL_DIMENSION;
  let full = renderCanvas(img, maxDim, quality);

  while (full.dataUrl.length > MAX_FULL_DATA_URL_CHARS && quality > 0.45) {
    quality -= 0.1;
    full = renderCanvas(img, maxDim, quality);
  }
  while (full.dataUrl.length > MAX_FULL_DATA_URL_CHARS && maxDim > 640) {
    maxDim = Math.round(maxDim * 0.78);
    full = renderCanvas(img, maxDim, 0.72);
  }

  let thumbQuality = 0.65;
  let thumb = renderCanvas(img, MAX_THUMB_DIMENSION, thumbQuality);
  while (thumb.dataUrl.length > MAX_THUMB_DATA_URL_CHARS && thumbQuality > 0.35) {
    thumbQuality -= 0.1;
    thumb = renderCanvas(img, 240, thumbQuality);
  }

  return {
    fileName: (file.name || 'asset.jpg').trim().slice(0, 200) || 'asset.jpg',
    mimeType: 'image/jpeg',
    width: full.width,
    height: full.height,
    sizeBytes: full.dataUrl.length,
    dataUrl: full.dataUrl,
    thumbDataUrl: thumb.dataUrl,
  };
}

/**
 * Attempts Firebase Storage upload when bucket rules allow it;
 * gracefully falls back to the compressed base64 dataUrl stored inside
 * Firestore subcollection documents so uploads never break.
 */
export async function tryUploadToStorageOrFallback(
  storagePath: string,
  file: File,
  fallbackDataUrl: string
): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    const uploadPromise = uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' }).then(
      (snap) => getDownloadURL(snap.ref)
    );
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Storage timeout')), 3500)
    );
    const url = await Promise.race([uploadPromise, timeoutPromise]);
    if (url && url.length <= 700000) return url;
    return fallbackDataUrl;
  } catch {
    return fallbackDataUrl;
  }
}
