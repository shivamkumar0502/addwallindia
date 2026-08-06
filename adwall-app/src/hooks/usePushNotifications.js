import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import api from "../api/api";

// Expo Go dropped support for Android remote push notifications from SDK 53
// onwards — the `expo-notifications` module throws as soon as you touch it
// inside Expo Go. Detect that environment and no-op entirely so the app
// doesn't crash. Push notifications will work once you build a real APK/dev
// client with `eas build --profile development` (see README).
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Registers this device for Expo push notifications once the user is
 * logged in, and POSTs the token to the backend. No-ops inside Expo Go.
 *
 * NOTE: the current backend (adwall-backend) doesn't have a route to store
 * this token yet. To actually send pushes you'll need to add something like:
 *
 *   POST /api/profile/push-token   body: { token }
 *   -> save `expoPushToken` on the User model
 *
 * and then, wherever the backend currently sends an in-app Notification
 * (e.g. new quote, booking approved, KYC verified), also call Expo's push
 * API (https://exp.host/--/api/v2/push/send) with that token. This hook
 * already does the client-side half of the work.
 */
export default function usePushNotifications(isAuthenticated) {
  const registered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registered.current || isExpoGo) return;
    registered.current = true;

    (async () => {
      try {
        // Lazy-require so expo-notifications is never touched at all inside Expo Go
        const Notifications = require("expo-notifications");
        const Device = require("expo-device");

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        if (!Device.isDevice) return; // push tokens don't work on simulators/emulators

        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;

        const { data: token } = await Notifications.getExpoPushTokenAsync();

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
          });
        }

        // Best-effort — silently ignore if backend doesn't have this route yet
        try { await api.post("/profile/push-token", { token: token.data || token }); } catch {}
      } catch (err) {
        console.log("Push registration skipped:", err.message);
      }
    })();
  }, [isAuthenticated]);
}
