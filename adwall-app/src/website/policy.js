// Keep URL decisions separate from UI so bank redirects and external app links
// can be checked without starting an Android emulator.
export const WEBSITE_URL = "https://www.adwallindia.com/";
export const WEBSITE_HOSTS = ["www.adwallindia.com", "adwallindia.com"];
export const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;

export function isWebsiteUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      WEBSITE_HOSTS.includes(url.hostname) && (!url.port || url.port === "443");
  } catch { return false; }
}

export function paymentIntentUrl(value) {
  // Android checkout often wraps UPI links in intent://. Never execute arbitrary
  // intent extras or browser fallbacks: extract only a known payment scheme.
  if (typeof value !== "string") return null;
  const match = /^intent:\/\/([^#]+)#Intent;([^#]+);end$/.exec(value);
  if (!match) return null;
  const scheme = /(?:^|;)scheme=(upi|tez|phonepe|paytmmp)(?:;|$)/.exec(match[2]);
  return scheme ? `${scheme[1]}://${match[1]}` : null;
}

export function classifyNavigation(value) {
  if (value === "about:blank") return "embedded";
  if (paymentIntentUrl(value)) return "external";
  try {
    const url = new URL(value);
    if (url.username || url.password) return "blocked";
    // Do not put Google OAuth into an embedded user-agent or spoof its UA.
    if (url.protocol === "https:" && url.hostname === "accounts.google.com") return "google";
    if (url.protocol === "https:") return "embedded";
    if (["tel:", "mailto:", "sms:", "geo:", "upi:", "tez:", "phonepe:", "paytmmp:", "whatsapp:"].includes(url.protocol)) return "external";
  } catch { /* Invalid URLs are never handed to another app. */ }
  return "blocked";
}

export function safeDownloadName(value) {
  const name = String(value || "adwall-download").split(/[\\/]/).pop()
    .replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 100);
  return name || "adwall-download";
}

export function parseDownload(message) {
  if (message?.type !== "download" || typeof message.data !== "string") return null;
  const match = /^data:([^;,]*);base64,([A-Za-z0-9+/]*={0,2})$/.exec(message.data);
  if (!match || !match[2].length || match[2].length % 4 !== 0 || match[2].length > Math.ceil(MAX_DOWNLOAD_BYTES / 3) * 4) return null;
  const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
  if ((match[2].length / 4) * 3 - padding > MAX_DOWNLOAD_BYTES) return null;
  const mimeType = match[1] || "application/octet-stream";
  // Only the website's document exports cross this bridge, never executable HTML.
  if (!["text/csv", "text/plain", "application/pdf", "application/octet-stream"].includes(mimeType)) return null;
  return { name: safeDownloadName(message.name), mimeType, base64: match[2] };
}
