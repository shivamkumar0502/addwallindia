export const GOOGLE_RESULT_EVENT = "adwall:native-google-result";
export const hasNativeGoogle = () => Boolean(window.__adwallNativeGoogle === 1 && window.ReactNativeWebView?.postMessage);

export function requestNativeGoogle(clientId, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (!hasNativeGoogle()) { reject(new Error("Google native login available nahi hai. App update karo.")); return; }
    if (signal?.aborted) { resolve(null); return; }
    const requestId = window.crypto.randomUUID();
    let timer;
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener(GOOGLE_RESULT_EVENT, onResult);
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => { cleanup(); resolve(null); };
    const onResult = (event) => {
      const result = event.detail;
      if (result?.requestId !== requestId) return;
      cleanup();
      if (result.cancelled) resolve(null);
      else if (typeof result.credential === "string" && result.credential) resolve(result.credential);
      else reject(new Error(result.error || "Google login fail ho gaya. Dobara try karo."));
    };
    window.addEventListener(GOOGLE_RESULT_EVENT, onResult);
    signal?.addEventListener("abort", onAbort, { once: true });
    timer = window.setTimeout(() => { cleanup(); reject(new Error("Google login mein time lag raha hai. Dobara try karo.")); }, 120000);
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: "google-signin", requestId, clientId })); }
    catch { cleanup(); reject(new Error("App se connect nahi hua. App restart karo.")); }
  });
}
