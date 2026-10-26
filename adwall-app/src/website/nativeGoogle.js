import { isWebsiteUrl } from "./policy";

export const GOOGLE_RESULT_EVENT = "adwall:native-google-result";
export const isGoogleClientId = (value) => typeof value === "string" && /^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(value);

export function validGoogleRequest(message, originUrl) {
  if (!isWebsiteUrl(originUrl) || message?.type !== "google-signin") return false;
  const path = new URL(originUrl).pathname;
  return /^\/(login|register)\/?$/.test(path) &&
    typeof message.requestId === "string" && /^[A-Za-z0-9_-]{16,120}$/.test(message.requestId);
}

// Tokens stay in memory and travel only to the requesting AdWall page. A late
// result cannot log a different page in: the frontend matches a random request ID.
export function googleResultScript(requestId, result) {
  return `if (location.protocol === 'https:' && ['www.adwallindia.com','adwallindia.com'].indexOf(location.hostname) >= 0 && (!location.port || location.port === '443') && /^\\/(login|register)\\/?$/.test(location.pathname)) { window.dispatchEvent(new CustomEvent(${JSON.stringify(GOOGLE_RESULT_EVENT)}, {detail:${JSON.stringify({ requestId, ...result })}})); } true;`;
}

export function createNativeGoogleSignIn({ loadSDK, webClientId, iosClientId, platform = "android" }) {
  let busy = false;
  let configuredClientId;
  return async (requestedClientId) => {
    if (busy) return { error: "Google sign-in pehle se chal raha hai. Thoda ruko." };
    const clientId = webClientId || requestedClientId;
    if (!isGoogleClientId(clientId)) return { error: "Google login setup pending hai. Web OAuth client ID configure karo." };
    if (platform === "ios" && !isGoogleClientId(iosClientId)) return { error: "iOS Google login setup pending hai." };
    busy = true;
    let sdk;
    try {
      // Lazy loading keeps Expo Go/old binaries usable; the native module is
      // available only after building and installing the new APK.
      sdk = loadSDK();
      if (configuredClientId !== clientId) {
        sdk.GoogleSignin.configure({ webClientId: clientId, ...(iosClientId ? { iosClientId } : {}), offlineAccess: false });
        configuredClientId = clientId;
      }
      const servicesAvailable = await sdk.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      if (!servicesAvailable) return { error: "Google Play Services update karke dobara try karo." };
      const response = await sdk.GoogleSignin.signIn();
      if (response?.type === "cancelled") return { cancelled: true };
      if (response?.type !== "success" || !response.data?.idToken) return { error: "Google se login token nahi mila. Dobara try karo." };
      return { credential: response.data.idToken };
    } catch (error) {
      if (error?.code != null && error.code === sdk?.statusCodes?.SIGN_IN_CANCELLED) return { cancelled: true };
      if (error?.code != null && error.code === sdk?.statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) return { error: "Google Play Services update karke dobara try karo." };
      if (String(error?.code) === "10" || error?.code === "DEVELOPER_ERROR") return { error: "Google app setup mismatch hai. Package name aur APK signing SHA-1 Google Cloud mein check karo." };
      // Never surface SDK error dumps: they can include sign-in details.
      return { error: "Google login nahi hua. Naya APK install karo aur Google configuration check karo." };
    } finally { busy = false; }
  };
}
