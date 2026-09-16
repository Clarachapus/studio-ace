/** Editor preview address: works for photos saved online before the public site is republished. */
export function adminPreview(src: string): string {
  return src.startsWith("/media/") ? `/api/admin/media?p=${encodeURIComponent(src)}` : src;
}

const MAX_BYTES = 3.5 * 1024 * 1024;

/** Phone photos can exceed the host's upload limit: shrink them in the browser (2400 px, JPEG) first. */
export async function shrinkForUpload(file: File): Promise<File> {
  if (file.size <= MAX_BYTES || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
