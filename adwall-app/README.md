# AdWall India app

The Android/iOS app displays the responsive **https://www.adwallindia.com/**
website inside a React Native WebView. The website supplies the UI, routes,
authentication, backend requests, chatbot and role permissions. Public pages,
search and filters, map, hoarding details, booking/quote/payment flows, client,
owner and admin dashboards, notifications, profile, chat and legal pages use
the same deployed website implementation. Website updates appear in the app
without rebuilding the native screens.

This is a website-backed app, not a separately reimplemented native UI. It
requires internet and a working website. Existing native screens remain in
`src/screens` for reference, but `App.js` no longer mounts that navigator,
native session provider, native push registration or a second chatbot.

## Run and build

Use the Node version required by the installed Expo SDK (see `package.json`).
From this directory:

```sh
npm ci --legacy-peer-deps
npx expo start
```

For an installable Android preview:

1. Authenticate to your own Expo/EAS account.
2. Run `eas init` and replace `YOUR_EAS_PROJECT_ID` in `app.json` with the real
   project ID. Do not put API keys or backend secrets in app configuration.
3. Run `eas build --profile preview --platform android`.
4. Install the resulting APK and test the flows below.

The app already points to the production website. Website API/Google/Razorpay
configuration remains in `adwall-frontend` and its hosting environment. The
legacy `extra.apiUrl` is only used by the inactive native screens.

Launcher icon and native splash use the supplied website logo. These changes,
including the WebView and splash-screen native dependencies, require a new
APK; hot reload cannot update an installed binary. A web export redirects to
the actual website instead of trying to embed a native-only WebView.

## App behavior

- Persistent WebView cookies and DOM storage preserve the website session.
  Existing native AsyncStorage sessions are separate; sign in again after
  upgrading from the previous native app.
- Android Back follows page history, then uses normal OS Back behavior at the
  root. iOS swipe navigation is enabled. No duplicate native navbar is added.
- Branded loading, slow-connection guidance, retry and browser fallback cover
  network failures, HTTP errors and WebView process termination. Retry reloads
  the latest AdWall page; it can discard unsaved form inputs.
- Website chat popups open in the same WebView. Document links may open in the
  browser. CSV/blob exports up to 20 MB use the device Save/Share sheet, including
  admin reports that create detached download anchors and immediately revoke
  their Blob URL. Native bridge messages are accepted only from AdWall origins.
- Phone, email, WhatsApp and common UPI scheme links are handed to installed
  apps. Unsupported links fail with a visible notice. File inputs use the
  WebView's OS file picker. Website location requests use device permission.
- Razorpay's normal HTTPS checkout/iframe runs in the WebView; bank popups and
  external UPI apps still require device testing. Returning from another app
  does not itself mark an order paid: the website/backend must verify payment.
- Google may reject embedded sign-in. Google top-level sign-in navigations offer
  the full website in the browser; email/password stays available in the app.
  Browser and app sessions are separate. This is not a native Google OAuth
  integration and does not spoof the user agent to bypass Google's policy.
- Website notification pages are included. Native push token registration is
  not integrated with the website session in this version.

## Validation

```sh
npm test
EXPO_NO_TELEMETRY=1 npx expo config --type public
EXPO_NO_TELEMETRY=1 npx expo export --platform android --output-dir /tmp/adwall-export
```

Automated tests cover website-origin checks, payment/external URL handling,
download validation, detached/revoked Blob downloads, same-site chat popups,
and isolating the bridge from payment origins. Bundle generation is a build
check, not proof of successful payment or native device behavior.

Before release, test on an installed APK:

- Cold start, actual launcher icon and splash; airplane mode → retry; Android
  Back through search, hoarding details and dashboard.
- Client email login/register/logout and session persistence after restart;
  hoarding selection → dates → quote request → My Bookings → booking details.
- Owner listing/photo upload, KYC/file upload, quotes, installation proof;
  client quote acceptance, agreement/PDF, Razorpay **test-mode** checkout,
  cancellation and UPI return.
- Admin lists/actions, report CSV Save/Share; chat popup; profile uploads;
  search filters, location permission denied/allowed, map and all footer links.

Do not treat a successful JavaScript bundle as Android payment/Google-login
acceptance. EAS project setup and device acceptance are required before release.
