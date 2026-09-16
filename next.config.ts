import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets the e2e build use its own folder so it never wipes the dev server's cache.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    // AVIF disabled: sharp/libheif on this machine emits corrupt AVIF files (1 KB) that browsers cannot decode.
    formats: ["image/webp"],
    // Locally the project lives on an exFAT disk where macOS "._*" files poison the
    // image optimizer cache (blank images). Uploads are already WebP ≤ 2400 px, so
    // serving them as-is locally is fine. On Vercel and Netlify the optimizer stays on.
    unoptimized: !process.env.VERCEL && !process.env.NETLIFY,
  },
  async headers() {
    // Temporary shared previews (scripts/share.sh) must never be indexed by search engines.
    const noindex = process.env.PREVIEW_NOINDEX ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : [];
    return [{ source: "/(.*)", headers: [...securityHeaders, ...noindex] }];
  },
};

export default withNextIntl(nextConfig);
