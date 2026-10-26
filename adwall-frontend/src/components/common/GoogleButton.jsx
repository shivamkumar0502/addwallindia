import { useEffect, useRef, useState } from "react";
import { hasNativeGoogle, requestNativeGoogle } from "@/lib/nativeGoogle";

/**
 * Google "Continue with" button.
 *
 * Koi npm package nahi chahiye — Google Identity Services ka official script
 * load karke uska button render karta hai. onCredential ko Google ka
 * id_token milta hai, wahi backend ke POST /api/auth/google ko bhejna hai.
 *
 * Zaruri: .env me VITE_GOOGLE_CLIENT_ID set karo (backend wala GOOGLE_CLIENT_ID
 * hi hai), aur Google Cloud Console -> Credentials -> OAuth client ->
 * "Authorized JavaScript origins" me apna domain + http://localhost:5173 daalo.
 */
const GoogleButton = ({ text = "continue_with", onCredential, onError }) => {
  const divRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [native, setNative] = useState(hasNativeGoogle);
  const [signingIn, setSigningIn] = useState(false);
  const pendingNative = useRef(null);
  useEffect(() => {
    const check = () => setNative(hasNativeGoogle());
    window.addEventListener("adwall:native-ready", check);
    check();
    return () => {
      window.removeEventListener("adwall:native-ready", check);
      pendingNative.current?.abort();
    };
  }, []);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // FIX: callbacks ko ref me rakho. Pehle ye useEffect ki dependency me the,
  // aur parent har render pe naya function banata tha — isliye initialize()
  // baar baar chalta tha ("called multiple times" warning).
  const cbRef = useRef({ onCredential, onError });
  cbRef.current = { onCredential, onError };

  useEffect(() => {
    if (!clientId || native) return;
    let active = true;
    let initialized = false;
    setReady(false);
    const init = () => {
      if (!active || initialized || !window.google?.accounts?.id || !divRef.current) return;
      initialized = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!active) return;
          if (response?.credential) cbRef.current.onCredential?.(response.credential);
          else cbRef.current.onError?.("Google se token nahi mila");
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline", size: "large", width: divRef.current.offsetWidth || 340,
        text, shape: "rectangular", logo_alignment: "center",
      });
      setReady(true);
    };
    const fail = () => { if (active) cbRef.current.onError?.("Google script load nahi hua. Dobara try karo."); };
    let script = document.getElementById("google-identity-script");
    const created = !script;
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-identity-script";
      script.async = true;
      script.defer = true;
    }
    script.addEventListener("load", init);
    script.addEventListener("error", fail);
    if (window.google?.accounts?.id) init();
    else if (created) document.head.appendChild(script);
    return () => {
      active = false;
      script.removeEventListener("load", init);
      script.removeEventListener("error", fail);
    };
  }, [clientId, native, text]);

  const handleNativeSignIn = async () => {
    if (pendingNative.current) return;
    const controller = new AbortController();
    pendingNative.current = controller;
    setSigningIn(true);
    try {
      const credential = await requestNativeGoogle(clientId, { signal: controller.signal });
      if (credential && !controller.signal.aborted) await cbRef.current.onCredential?.(credential);
    } catch (error) {
      if (!controller.signal.aborted) cbRef.current.onError?.(error.message);
    } finally {
      if (pendingNative.current === controller) pendingNative.current = null;
      if (!controller.signal.aborted) setSigningIn(false);
    }
  };

  if (native) {
    return (
      <button type="button" onClick={handleNativeSignIn} disabled={signingIn}
        className="w-full h-11 flex items-center justify-center gap-3 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        aria-busy={signingIn}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.9 6.1-14.9z" />
          <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44z" />
          <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6z" />
          <path fill="#EA4335" d="M24 12c3 0 5.6 1 7.7 3l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12z" />
        </svg>
        {signingIn ? "Signing in…" : "Continue with Google"}
      </button>
    );
  }

  if (!clientId) {
    return (
      <div className="text-center text-xs text-gray-400 py-2">
        Google login configure nahi hai (VITE_GOOGLE_CLIENT_ID missing)
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={divRef} className="flex justify-center [&>div]:w-full" />
      {!ready && (
        <div className="h-11 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
      )}
    </div>
  );
};

export default GoogleButton;