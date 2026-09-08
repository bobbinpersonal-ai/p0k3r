/**
 * Best-effort site origin for links built outside a request — a cron job has
 * no incoming request to read `origin` off of the way an API route handling
 * a real POST does. `VERCEL_PROJECT_PRODUCTION_URL` is set automatically on
 * Vercel and reflects the project's actual production domain (custom domain
 * included, once one's attached), so this needs no configuration there.
 */
export function siteOrigin(): string {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
