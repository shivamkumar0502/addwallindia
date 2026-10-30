# AdWall India — AAB handoff

## What this file is

`adwallindia-unsigned.aab` is a release Android App Bundle compiled from the
AdWall India app. It is **unsigned** so the Play account owner can use their
own upload key. It cannot be uploaded to Google Play until it is signed. It
also cannot be installed directly on a phone; use a Play internal testing
track after signing, or generate a test APK from the bundle with bundletool.

- Application ID/package: `com.adwallindia.app`
- Display name: `AdWall India`
- Version name: `1.0.0`
- Version code: `4`
- Website loaded by the app: `https://www.adwallindia.com/`
- Native Google sign-in code is included. Google Cloud setup is still needed.
- No Expo account or Play Console password is required to sign this file locally.

## 1. Sign with the correct upload key

For an update to an existing Play app, use its existing registered upload key.
For a new Play app, the owner can create and securely retain a new upload key:

```sh
keytool -genkeypair -v -keystore adwall-upload.jks -alias adwall-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep that keystore and its passwords private and backed up. Do not put them
in GitHub, the app bundle, or the public website.

With JDK tools installed, sign a copy (the commands prompt locally for passwords):

```sh
cp adwallindia-unsigned.aab adwallindia-signed.aab
jarsigner -keystore adwall-upload.jks -sigalg SHA256withRSA -digestalg SHA-256 \
  adwallindia-signed.aab adwall-upload
jarsigner -verify -verbose -certs adwallindia-signed.aab
```

Replace the keystore filename and alias if using an existing upload key.
Upload **adwallindia-signed.aab**, not the unsigned file. An AAB uses JAR
signing (`jarsigner`), not APK signing (`apksigner`). A self-signed certificate
warning is expected for an upload certificate; signature verification should
still succeed. Optional validation with Google's bundletool:

```sh
java -jar bundletool.jar validate --bundle=adwallindia-signed.aab
```

## 2. Configure Google login

In the Google Cloud project that owns the website's Web OAuth client:

1. Register an Android OAuth client with package `com.adwallindia.app`.
2. After enabling Play App Signing, get the **app-signing certificate SHA-1**
   from Play Console → App integrity and register it for the Android client.
   This is the certificate on installed Play APKs; it can differ from the
   upload certificate used to sign this AAB. Add separate SHA-1 clients for
   locally signed/test APKs if you test those outside Play.
3. Keep frontend `VITE_GOOGLE_CLIENT_ID` and backend `GOOGLE_CLIENT_ID` set to
   the same **Web application** client ID, in the same Google Cloud project.
   This build reads the public Web client ID from the website's Google button.
4. Deploy the updated `adwall-frontend` containing the native Google bridge.
   App and frontend both need the native-Google changes. Verify with existing
   and new accounts on an installed Play internal-test build.
5. The normal website also needs both `https://www.adwallindia.com` and
   `https://adwallindia.com` under the Web client's Authorized JavaScript origins.

## 3. What the submitter changes in Play Console

- Create/select the app under the correct developer account and opt into the
  appropriate Play App Signing flow.
- Complete the store listing, app icon/screenshots, support contact, privacy
  policy URL and the Console's required app-content/data-safety declarations
  based on what the website/app actually collects and does.
- Provide working reviewer access/instructions when required for protected
  client, owner or admin areas. Do not publish account credentials in GitHub.
- Upload the signed AAB to internal testing first. Test email/Google login,
  registration, hoarding selection, booking/quotes, payment cancellation and
  completion, uploads, location permissions, downloads and session persistence.
- Resolve any Play Console validation or policy findings before production.

## 4. Changes that require rebuilding

You cannot edit an AAB like a source project. Package name, version code,
app label/icon, Android permissions and native code changes need a rebuild.
If this package already has version code 4 or higher uploaded, increment
`expo.android.versionCode` in `adwall-app/app.json` and rebuild. Use the
existing package ID when updating an already-published app.

Google Cloud origins/certificate registration, backend environment settings,
and the live website's content/UI generally change on those services, without
editing this AAB. For this build, the native app's website URL is fixed to
`https://www.adwallindia.com/`; changing that URL requires changing the source
and rebuilding.

## Build route

The GitHub Actions workflow `.github/workflows/android-aab.yml` compiles a
release AAB without Expo/EAS account access. It explicitly removes Expo's
template debug signing from the release build and verifies that the output
has no signing-certificate entries. The artifact also contains SHA256SUMS.txt.

A successful compile is not an installed-device or Play approval test. This
handoff does not claim that production payments, Google login configuration,
or the final store submission have been accepted.
