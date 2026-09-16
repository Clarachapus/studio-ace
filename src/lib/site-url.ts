/** Public address of the site: explicit setting, else the host's production address, else local. */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  // Netlify: URL is the site's main address (the custom domain once connected).
  if (process.env.NETLIFY && process.env.URL) return process.env.URL;
  return "http://localhost:3000";
}
