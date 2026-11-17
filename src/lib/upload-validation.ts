export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export function imageValidationError(file: { type: string; size: number }): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Choose a JPEG, PNG, or WebP photo.";
  if (file.size > MAX_IMAGE_BYTES) return "Choose a photo smaller than 10 MB.";
  return null;
}