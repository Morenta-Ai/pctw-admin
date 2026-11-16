/*
 * Shrinks product photos in the browser before they're uploaded. Phone photos
 * are often 4–8 MB, over the hosting platform's 4.5 MB request limit, and far
 * bigger than the shop ever shows them.
 */

/** The longest side the shop needs, in pixels. */
export const MAX_PHOTO_SIDE = 1600;

/** Photos smaller than this, and no wider than MAX_PHOTO_SIDE, go up as they are. */
export const SHRINK_ABOVE_BYTES = 1024 * 1024;

const JPEG_QUALITY = 0.85;

/** Scales width × height down, keeping the shape, so the longest side fits. */
export function fitWithin(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function needsShrinking(
  sizeBytes: number,
  width: number,
  height: number,
): boolean {
  return (
    sizeBytes > SHRINK_ABOVE_BYTES || Math.max(width, height) > MAX_PHOTO_SIDE
  );
}

/**
 * Returns a JPEG at most MAX_PHOTO_SIDE on its longest side, or the original
 * file when it's already small or the browser can't read it (the server then
 * has the final say). Transparent areas become white.
 */
export async function shrinkPhoto(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    if (!needsShrinking(file.size, bitmap.width, bitmap.height)) return file;
    const { width, height } = fitWithin(
      bitmap.width,
      bitmap.height,
      MAX_PHOTO_SIDE,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
