import "server-only";
import sizes from "@/generated/media-sizes.json";

const known: Record<string, number[]> = sizes;

/** Width / height of an image in public/media (recorded at build time), or null if unknown. */
export async function mediaRatio(src: string): Promise<number | null> {
  const hit = known[src];
  if (hit && hit[0] && hit[1]) return hit[0] / hit[1];
  // Local editing: a photo just added is not recorded yet, read it from disk.
  if (process.env.NODE_ENV === "development" && /^\/media\/[a-z0-9/_.-]+$/i.test(src)) {
    try {
      const path = await import("node:path");
      const { default: sharp } = await import("sharp");
      const meta = await sharp(path.join(process.cwd(), "public", src)).metadata();
      if (meta.width && meta.height) return (meta.orientation ?? 1) >= 5 ? meta.height / meta.width : meta.width / meta.height;
    } catch {
      return null;
    }
  }
  return null;
}
