// Guard so ad scripts never load in the Lovable editor preview / dev.
// They run only in production builds on non-preview hostnames.
export function adsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.PROD) return false;
  const h = window.location.hostname;
  if (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h.endsWith(".lovableproject.com") ||
    h.endsWith(".lovableproject-dev.com") ||
    h.endsWith(".beta.lovable.dev") ||
    h === "localhost" ||
    h === "127.0.0.1"
  ) {
    return false;
  }
  return true;
}
