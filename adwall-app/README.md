# AdWall India — Android App (React Native / Expo)

Tumhare React web app (`adwall-frontend`) ka poora mobile version — same
backend (`adwall-backend`), same brand (orange `#f97316`), same features,
teeno roles (Client / Owner / Admin) ke liye.

**Status: Feature-complete.** Saare 4 phases ban chuke hain aur is ek project
me merge hain — koi alag zip nahi hai, ye final version hai.

---

## ⚙️ Setup

**Fix for "SDK mismatch" error:** Project ab **Expo SDK 57** pe update kar
diya hai (pehle SDK 51 tha — tumhare phone ka Expo Go app SDK 57 hai, isliye
match nahi ho raha tha). Steps:

1. Node.js v22+ install karo (SDK 57 ko chahiye). Phone pe **Expo Go** app
   ko latest version pe update kar lo (Play Store se).
2. Terminal me (`adwall-app` folder ke andar — pehle `cd adwall-app` karke
   confirm karo `package.json` yahin hai, `ls` se check kar sakte ho):
   ```
   rm -rf node_modules package-lock.json
   npm install
   npx expo install --fix
   ```
   Agar `npm install` phir bhi ERESOLVE peer-dependency error de (ho sakta
   hai kisi aur package ki wajah se), safely retry karo:
   ```
   npm install --legacy-peer-deps
   npx expo install --fix
   ```
3. `npx expo start` se dev server chalao aur Expo Go se QR scan karo.

1. Node.js v18+ install karo. Testing ke liye **Expo Go** app (Play Store) ya
   Android Studio emulator chahiye.
2. Terminal me:
   ```
   cd adwall-app
   npm install
   npx expo start
   ```
3. Phone par Expo Go se QR scan karo, ya `a` dabao emulator ke liye.

   ⚠️ **Important:** Is app me 2 native modules hain
   (`react-native-razorpay`, `react-native-maps`) jo plain **Expo Go me nahi
   chalte** — Expo Go sirf UI/navigation dekhne ke liye theek hai, lekin
   payment aur map picker test karne ke liye tumhe ek **development build**
   banana hoga:
   ```
   npx expo install expo-dev-client
   eas build --profile development --platform android
   ```
   (EAS free tier available hai — `npx eas login` se account bana lo)

## 🔌 Backend URL

`app.json` → `extra.apiUrl` abhi `http://10.0.2.2:5000/api` hai (sirf
**Android Emulator** ke liye — special alias jo computer ka localhost point
karta hai).

Real phone (Expo Go / dev build) se test karne ke liye apne computer ka LAN
IP daalo:
```
ipconfig   (Windows)  /  ifconfig ya ip addr (Mac/Linux)
```
```json
"extra": { "apiUrl": "http://192.168.1.5:5000/api" }
```
Backend `app.listen()` ko `0.0.0.0` pe bind karo aur is IP se CORS allow karo.

### ⚠️ "Login/backend load nahi ho raha" — checklist

Agar app khulta hai lekin data load nahi hota ya login fail hota hai, ye
order me check karo (sabse common cause upar hai):

1. **Real phone use kar rahe ho?** → `10.0.2.2` sirf Android **emulator** ke
   liye kaam karta hai, real phone se nahi. Apne computer ka LAN IP daalo
   (upar dekho), aur confirm karo phone + computer **same WiFi** pe hain.
2. **Backend actually chal raha hai?** → Terminal me `npm run dev` (ya jo
   bhi tumhara start script hai) `adwall-backend` folder me chalao, aur
   confirm karo koi error nahi aa raha, port 5000 (ya jo bhi tumne set kiya
   hai) pe listen kar raha hai.
3. **Backend `0.0.0.0` pe bind hai?** → `app.listen(PORT)` sirf localhost
   sunta hai by default in some setups; agar phone se connect nahi ho raha
   to `app.listen(PORT, "0.0.0.0")` try karo.
4. **CORS allow hai?** → Backend ke CORS config me apna computer ka LAN IP
   (jo app.json me daala) allowed origins me add karo — warna backend
   request ko block kar dega.
5. **`app.json` edit karne ke baad Metro bundler restart karo** — `extra`
   config sirf app start hone pe read hoti hai, hot-reload se nahi update
   hoti. `Ctrl+C` karke `npx expo start` phir se chalao (cache clear karne
   ke liye `npx expo start -c`).
6. **Firewall block to nahi kar raha?** — kabhi kabhi computer ka firewall
   local network se incoming connections block karta hai; agar upar sab
   sahi hai phir bhi na chale to firewall temporarily off karke test karo.

App ab home screen pe ek **laal banner** dikhata hai agar backend se bilkul
connect na ho paye ("⚠️ Backend se connect nahi ho paya...") — isse turant
pata chal jayega ki issue connectivity ka hai, kuch aur nahi.

## 🔑 Keys jo tumhe khud daalni hongi

| Kahan | Kya | Kyun |
|---|---|---|
| `app.json` → `android.config.googleMaps.apiKey` | Google Maps Android API key | Add Hoarding ka location picker (react-native-maps) |
| `app.json` → `extra.eas.projectId` | EAS project ID (`eas init` se milega) | Build ke liye |
| Backend `.env` | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Ye pehle se hone chahiye — same web wale keys reuse hote hain |

---

## ✅ Kya-kya bana hai (sab phases merged)

### Infra
Navigation (Stack + role-based Bottom Tabs), theme (website jaisa orange
brand), API client (`src/api/api.js` — website ke `services/api.js` jaisa hi
shape, sab endpoints), AuthContext (AsyncStorage-based), real-time chat
socket client.

### Public (logged-out)
Home, Search (city/category filter + pagination), Hoarding Detail, Login, Register.

### Client
Dashboard, My Bookings (status filter), Booking Detail (timeline, quotes
accept/reject, **real Razorpay payment**, proof review, approve, agreement
download, cancel, chat), Wallet, Analytics (donut chart), Broadcast Campaign
(multi-step form).

### Owner
Dashboard, My Hoardings, Add Hoarding (4-step wizard — **Google Maps location
picker** with drag-to-pin + current-location button, photo upload), Bookings,
KYC (document upload + status states), Featured Listings (**real payment**),
Subscription plans (**real payment**).

### Admin
Dashboard (stats + top-cities bar chart), KYC Review, Hoardings Review,
Users (search + filter + pagination), All Bookings, Payments (GMV/commission),
**Reports** (yearly revenue chart + CSV export/share for bookings, payments,
users, hoardings), **Coupons** (create/toggle/delete).

### Shared
Profile (edit info, change password, delete account, avatar), real-time Chat
(text + image messages, typing indicator — Socket.io).

### Payments — real Razorpay integration
`src/hooks/usePayment.js` wraps `react-native-razorpay` and is wired into all
3 payment flows:
1. Booking payment (Booking Detail → "Pay Now")
2. Featured listing purchase
3. Subscription upgrade

Each calls your existing backend create-order endpoint, opens native Razorpay
checkout, then calls your existing verify endpoint — same flow as the
website, just native UI instead of the web checkout script.

### Push notifications (client-side ready)
`src/hooks/usePushNotifications.js` registers the device and gets an Expo
push token once logged in. **It auto-detects and no-ops inside Expo Go** —
Android remote push notifications were removed from Expo Go entirely as of
SDK 53, so touching `expo-notifications` there throws a red-screen error.
This is expected and not a bug: to actually test push notifications you need
a **development build** (`eas build --profile development`, see Setup
above), not plain Expo Go. Everything else in the app (payments excluded,
see below) still works fine inside Expo Go.

Backend also needs one small addition to actually *send* pushes — see the
note inside that file (a `POST /profile/push-token` route to save the token,
then call Expo's push API when you currently create an in-app Notification).

### App icon / splash
Generated a placeholder brand-orange icon + dark splash screen
(`assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`,
`assets/favicon.png`) so the app isn't blank/default. Swap these with your
real logo whenever you have one — same filenames, just replace.

### Build config
`eas.json` set up with `development`, `preview`, and `production` profiles
for Android (APK for testing, AAB for Play Store).

---

## ⚠️ Known simplifications / not included

- **Reports CSV export** assumes your backend's `/api/reports/:type` routes
  return raw CSV (they do, confirmed from your backend code) — downloads via
  device share sheet (`expo-sharing`).
- **Push notifications** need the backend route mentioned above to be fully
  functional end-to-end.
- **react-native-razorpay** and **react-native-maps** are native modules —
  won't run inside plain Expo Go, need a dev build (see Setup above).
- No automated tests.
- App icon/splash are placeholders — swap with real branding when ready.

## 🚀 Building for Play Store

```
npm install -g eas-cli
eas login
eas init                              # links project, fills extra.eas.projectId
eas build --profile production --platform android
eas submit --platform android         # after you have a Play Console account
```

---

Bas itna hi — app ab teeno roles ke liye end-to-end kaam karta hai, real
payments ke saath, real maps ke saath, real-time chat ke saath. Test karke
dekh lo, aur jo bhi tweak/bug fix chahiye ho batana.

## Mobile booking and branding update

The app reuses the website logo for the launcher, native splash and session-loading screen.
Booking requests now open booking details with the correct `id` route parameter.
Guests retain their selected hoarding through login or registration with a client account.
Calendar dates are sent as local YYYY-MM-DD values so India midnight stays on the selected day.
The hoarding detail page includes the website photo gallery, dimensions, lighting, facing and pricing.

Native icon/splash changes require a fresh Android build; a JavaScript reload cannot update them.
Build from `adwall-app` with `eas build --profile preview --platform android` after setting
your real EAS project ID. Test on a development/preview build, including guest login → selected
hoarding → date range → quote request → booking details. Verify the launcher and cold-start splash
on a device; Expo Go does not reproduce the installed app splash.
