import "server-only";
import sizes from "@/generated/media-sizes.json";

const known: Record<string, number[]> = sizes;

export type MediaInfo = { ratio: number | null; drawing: boolean };

/** Width / height of an image in public/media and whether it is a plan (recorded at build time). */
export async function mediaInfo(src: string): Promise<MediaInfo> {
  const hit = known[src];
  if (hit && hit[0] && hit[1]) return { ratio: hit[0] / hit[1], drawing: hit[2] === 1 };
  // Local editing: a photo just added is not recorded yet, read it from disk.
  if (process.env.NODE_ENV === "development" && /^\/media\/[a-z0-9/_.-]+$/i.test(src)) {
    try {
      const path = await import("node:path");
      const { default: sharp } = await import("sharp");
      const file = path.join(process.cwd(), "public", src);
      const meta = await sharp(file).metadata();
      const { data } = await sharp(file).flatten({ background: "#ffffff" }).greyscale().resize(96, 96, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
      const white = data.reduce((n, v) => n + (v > 225 ? 1 : 0), 0) / data.length;
      if (meta.width && meta.height) {
        const ratio = (meta.orientation ?? 1) >= 5 ? meta.height / meta.width : meta.width / meta.height;
        return { ratio, drawing: white > 0.6 };
      }
    } catch {
      return { ratio: null, drawing: false };
    }
  }
  return { ratio: null, drawing: false };
}

/** Width / height of an image in public/media, or null if unknown. */
export async function mediaRatio(src: string): Promise<number | null> {
  return (await mediaInfo(src)).ratio;
}
