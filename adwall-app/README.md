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
`src/screens` for reference (their former native dependencies are not part of
the release app), but `App.js` no longer mounts that navigator,
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
2. Run `eas init` to create or link your real EAS project. If the CLI asks
   for a manual config update, put its real ID in `expo.extra.eas.projectId`
   in `app.json`. Do not put API keys or backend secrets in app configuration.
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
- The login/register Google button uses the native Google account picker in a
  new APK. Its ID token returns only to the requesting AdWall auth page; the
  existing backend verifies it and the website handles existing-user login or
  new-user signup. Cancellation returns to the form without logging in. The
  normal browser still uses Google Identity Services. Old APKs without the
  native capability keep the browser behavior and require an update.
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
- Client email and native Google login/register/logout, account-picker cancel,
  different accounts, and session persistence after restart;
  hoarding selection → dates → quote request → My Bookings → booking details.
- Owner listing/photo upload, KYC/file upload, quotes, installation proof;
  client quote acceptance, agreement/PDF, Razorpay **test-mode** checkout,
  cancellation and UPI return.
- Admin lists/actions, report CSV Save/Share; chat popup; profile uploads;
  search filters, location permission denied/allowed, map and all footer links.

Do not treat a successful JavaScript bundle as Android payment/Google-login
acceptance. EAS project setup and device acceptance are required before release.

## Native Google login setup (Android)

1. In the same Google Cloud project as your existing Web OAuth client, create
   an **Android** OAuth client for package **`com.adwallindia.app`**. Register
   the **SHA-1 signing certificate fingerprint of the actual installed APK**.
   An EAS preview APK, a local debug APK and a Play-signed release can use
   different certificates; add the clients/fingerprints needed for each build.
   Use EAS credentials (`eas credentials --platform android`) or Play Console
   App integrity to find the relevant fingerprint. Do not put a signing key
   or private credential in this repository.
2. Use the existing **Web application** OAuth client ID as the token audience.
   The frontend `VITE_GOOGLE_CLIENT_ID` and backend `GOOGLE_CLIENT_ID` must
   identify that same Web client. The app normally reads this public client ID
   from the requesting website button. You can pin it at APK build time with
   `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (set the same value, not an Android ID).
3. Redeploy `adwall-frontend` so the Google button can request the native picker.
   Build and install a **new APK** containing the Google SDK. Both updates are
   required; shipping only the website or hot-reloading an older APK is not
   enough. Native Google login is not available in Expo Go.
4. Test Google sign-in on an Android device with Google Play Services. Existing
   users should reach their role dashboard; new users should reach the same
   role/mobile verification signup flow used by the website. Check cancellation
   and logout/login as another account. A developer error usually means the
   package name, signing SHA-1 or Web client project does not match.

The web button still separately needs `https://www.adwallindia.com` and
`https://adwallindia.com` in the Web client's **Authorized JavaScript origins**.
Native sign-in does not fix a missing website origin in Google Cloud.

For iOS, also set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` to an iOS OAuth client for
your real bundle ID. `app.config.js` then adds the official plugin with its
reversed URL scheme. Set the real `ios.bundleIdentifier`, rebuild and test iOS
separately; without its client configuration the button reports setup pending.
No Google client secret or Firebase project is required for this ID-token flow.

The free package uses the original Google Sign-In SDK module. Follow its
upstream migration guidance if changing to a different provider API later.

## Google Play AAB build

From `adwall-app`, after linking the correct Expo account/project:

```sh
npm ci
npx eas-cli@latest build --platform android --profile production
```

The production profile explicitly uses store distribution, the production
environment and `android.buildType: app-bundle`. Its build artifact is a
signed `.aab`; preview and development profiles still produce APKs. Download
the `.aab` from the completed EAS build page and upload it to Play Console.
A bundle cannot be installed directly on a phone. Keep the upload signing key
managed by EAS or use the existing app's upload key when building an update.

`.npmrc` records `legacy-peer-deps=true`, matching the lockfile generation
settings, so EAS's default `npm ci` does not fail on omitted peer-only packages.
Build configuration is not a completed/signed AAB; an authenticated Expo
account, actual project ID and Android signing credentials are still needed.

The website-backed release includes only the native modules it actually uses:
Google sign-in, WebView, safe-area layout, file sharing/storage, splash/status
bar and Expo core. Former native maps, Razorpay, navigation, animation, image
picker and push modules are not compiled into this app. Website maps, uploads,
checkout and notification pages still run inside the website. Android location
permissions remain declared for WebView geolocation.
