import { useEffect, useRef, useState } from "react";

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
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // FIX: callbacks ko ref me rakho. Pehle ye useEffect ki dependency me the,
  // aur parent har render pe naya function banata tha — isliye initialize()
  // baar baar chalta tha ("called multiple times" warning).
  const cbRef = useRef({ onCredential, onError });
  cbRef.current = { onCredential, onError };

  useEffect(() => {
    if (!clientId) return;

    let initialized = false;
    const init = () => {
      if (initialized || !window.google?.accounts?.id || !divRef.current) return;
      initialized = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) cbRef.current.onCredential?.(response.credential);
          else cbRef.current.onError?.("Google se token nahi mila");
        },
      });

      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        width: divRef.current.offsetWidth || 340,
        text,
        shape: "rectangular",
        logo_alignment: "center",
      });

      setReady(true);
    };

    const existing = document.getElementById("google-identity-script");
    if (existing) {
      if (window.google?.accounts?.id) init();
      else existing.addEventListener("load", init);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = "google-identity-script";
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => cbRef.current.onError?.("Google script load nahi hua");
    document.head.appendChild(script);
    // Sirf ek baar initialize karo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

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