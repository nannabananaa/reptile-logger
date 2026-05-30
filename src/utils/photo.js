// Photo sizing presets used across upload + thumbnail backfill paths.
// Keep these small — they are stored as base64 inside Supabase rows, so a
// single full-size upload can easily push a row past a megabyte.
export const PHOTO_FULL_WIDTH = 520;
export const PHOTO_FULL_QUALITY = 0.62;
export const PHOTO_THUMB_WIDTH = 200;
export const PHOTO_THUMB_QUALITY = 0.55;

// Log-photo presets. Smaller than the reptile photo because logs accumulate
// quickly — a reptile with 100 logs could otherwise carry 100x600px JPEGs
// inside category_fields. The list view uses the thumbnail; full-screen
// preview can be added later if needed.
export const LOG_PHOTO_WIDTH = 420;
export const LOG_PHOTO_QUALITY = 0.6;

// Compresses a data URL by drawing it into a canvas at a reduced max width.
// Resolves to a JPEG data URL. If the input fails to decode, falls back to
// the original so we never lose the photo entirely.
export function compressPhoto(dataUrl, maxWidth = PHOTO_FULL_WIDTH, quality = PHOTO_FULL_QUALITY) {
  return new Promise((resolve) => {
    if (!dataUrl) { resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Returns [fullSizePhoto, thumbnail] for an uploaded photo. Used by the
// add and edit reptile screens so the home grid loads tiny thumbnails
// while the detail page still gets a sharper version.
export function compressPhotoPair(dataUrl) {
  return Promise.all([
    compressPhoto(dataUrl, PHOTO_FULL_WIDTH, PHOTO_FULL_QUALITY),
    compressPhoto(dataUrl, PHOTO_THUMB_WIDTH, PHOTO_THUMB_QUALITY),
  ]);
}
