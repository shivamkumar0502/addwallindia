import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, Image, Linking, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { createNativeGoogleSignIn, googleResultScript, validGoogleRequest } from "./nativeGoogle";
import Button from "../components/Button";
import { colors } from "../theme/colors";
import { WEBSITE_BRIDGE, NATIVE_GOOGLE_BOOTSTRAP } from "./bridge";
import { classifyNavigation, isWebsiteUrl, parseDownload, paymentIntentUrl, WEBSITE_URL } from "./policy";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function WebsiteApp() {
  const web = useRef(null);
  const canGoBack = useRef(false);
  const lastPage = useRef(WEBSITE_URL);
  const timer = useRef(null);
  const failed = useRef(false);
  const saving = useRef(false);
  const nativeGoogle = useRef(null);
  if (!nativeGoogle.current) {
    nativeGoogle.current = createNativeGoogleSignIn({
      loadSDK: () => require("@react-native-google-signin/google-signin"),
      webClientId: Constants.expoConfig?.extra?.googleWebClientId,
      iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
      platform: Platform.OS,
    });
  }
  const [source, setSource] = useState({ uri: WEBSITE_URL });
  const [instance, setInstance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");

  const finish = useCallback(() => {
    clearTimeout(timer.current);
    setLoading(false);
    setSlow(false);
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const fail = useCallback((message) => {
    failed.current = true;
    setError(message);
    finish();
  }, [finish]);

  const start = useCallback(() => {
    failed.current = false;
    setError("");
    setLoading(true);
    setSlow(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSlow(true), 30000);
  }, []);

  useEffect(() => {
    // Hide the native splash once the branded loading view is laid out; network
    // delays must never leave a frozen Android launch screen.
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack.current) return false;
      web.current?.goBack();
      return true;
    });
    return () => { subscription.remove(); clearTimeout(timer.current); };
  }, []);

  const external = useCallback(async (url) => {
    try { await Linking.openURL(paymentIntentUrl(url) || url); }
    catch { Alert.alert("Link nahi khula", "Is link ke liye app available nahi hai. Dobara try karo."); }
  }, []);

  const googleNotice = useCallback(() => {
    Alert.alert("Google sign-in", "Google embedded apps mein sign-in restrict kar sakta hai. App mein email/password use karo, ya poori website browser mein use karo. Browser aur app ki login sessions alag hain.", [
      { text: "App mein raho", style: "cancel" },
      { text: "Browser kholo", onPress: () => external(WEBSITE_URL + "login") },
    ]);
  }, [external]);

  const openWindow = useCallback((url) => {
    const kind = classifyNavigation(url);
    if (kind === "google") { googleNotice(); return; }
    if (isWebsiteUrl(url) && !/\.(pdf|csv)(?:[?#]|$)/i.test(url)) {
      // Same-origin popups, including chat, retain the website login and history.
      web.current?.injectJavaScript(`window.location.assign(${JSON.stringify(url)}); true;`);
    } else if (kind === "external" || (kind === "embedded" && url.startsWith("https:"))) {
      external(url);
    }
  }, [external, googleNotice]);

  const onMessage = useCallback(async ({ nativeEvent }) => {
    if (!isWebsiteUrl(nativeEvent.url)) return;
    let message;
    try { message = JSON.parse(nativeEvent.data); } catch { return; }
    if (!message || typeof message !== "object") return;
    if (message.type === "google-signin") {
      if (!validGoogleRequest(message, nativeEvent.url)) return;
      const result = await nativeGoogle.current(message.clientId);
      web.current?.injectJavaScript(googleResultScript(message.requestId, result));
      return;
    }
    if (message.type === "open" && typeof message.url === "string") { openWindow(message.url); return; }
    if (message.type === "download-error") {
      Alert.alert("Download nahi hua", "File ko browser se download karo ya dobara try karo.");
      return;
    }
    const file = parseDownload(message);
    if (!file || saving.current) return;
    saving.current = true;
    try {
      if (!FileSystem.cacheDirectory || !(await Sharing.isAvailableAsync())) throw new Error("Sharing unavailable");
      const path = `${FileSystem.cacheDirectory}${Date.now()}-${file.name}`;
      await FileSystem.writeAsStringAsync(path, file.base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(path, { mimeType: file.mimeType, dialogTitle: "AdWall India — Save or share" });
    } catch {
      Alert.alert("File save nahi hui", "Browser se download karo ya dobara try karo.");
    } finally { saving.current = false; }
  }, [openWindow]);

  const retry = () => {
    start();
    setSource({ uri: lastPage.current });
    setInstance((n) => n + 1);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <WebView
        key={instance}
        ref={web}
        source={source}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        geolocationEnabled
        allowsInlineMediaPlayback
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows
        javaScriptCanOpenWindowsAutomatically
        mixedContentMode="never"
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        // Let our explicit navigation policy decide every scheme. Otherwise
        // WebView automatically sends non-whitelisted origins to the OS.
        originWhitelist={["*"]}
        injectedJavaScriptBeforeContentLoaded={NATIVE_GOOGLE_BOOTSTRAP}
        injectedJavaScript={NATIVE_GOOGLE_BOOTSTRAP + WEBSITE_BRIDGE}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={(request) => {
          const kind = classifyNavigation(request.url);
          if (kind === "google" && request.isTopFrame !== false) { googleNotice(); return false; }
          if (kind === "google") return true; // GIS script/iframe, not OAuth navigation
          if (kind === "external") { external(request.url); return false; }
          return kind === "embedded";
        }}
        onOpenWindow={({ nativeEvent }) => openWindow(nativeEvent.targetUrl)}
        onFileDownload={({ nativeEvent }) => {
          if (classifyNavigation(nativeEvent.downloadUrl) === "embedded" && nativeEvent.downloadUrl.startsWith("https:")) external(nativeEvent.downloadUrl);
        }}
        onLoadStart={start}
        onLoad={() => { if (!failed.current) finish(); }}
        onError={() => fail("Website load nahi hui. Internet connection check karke dobara try karo.")}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.url === lastPage.current || nativeEvent.url === source.uri) {
            fail(`Website ne error ${nativeEvent.statusCode} diya. Thodi der baad try karo.`);
          }
        }}
        onRenderProcessGone={() => fail("App page band ho gaya. Dobara kholo.")}
        onContentProcessDidTerminate={() => fail("App page band ho gaya. Dobara kholo.")}
        onNavigationStateChange={(state) => {
          canGoBack.current = state.canGoBack;
          if (isWebsiteUrl(state.url)) lastPage.current = state.url;
        }}
      />
      {(loading || error) && (
        <View style={styles.overlay} onLayout={() => SplashScreen.hideAsync().catch(() => {})}>
          <Image source={require("../../assets/brand-logo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="AdWall India" />
          <Text style={styles.brand}>AdWall India</Text>
          <Text style={styles.subtitle}>Connecting brands, owners & cities</Text>
          {!!error ? (
            <>
              <Text style={styles.message} accessibilityRole="alert">{error}</Text>
              <Button title="Dobara try karo" onPress={retry} style={styles.action} />
              <Button title="Browser mein kholo" variant="outline" onPress={() => external(lastPage.current)} style={styles.action} />
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.brand500} size="large" style={{ marginTop: 24 }} />
              <Text style={styles.message}>{slow ? "Connection slow hai. Thoda intezaar karo ya dobara try karo." : "AdWall India khul raha hai…"}</Text>
              {slow && <Button title="Dobara try karo" onPress={retry} style={styles.action} />}
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  web: { flex: 1, backgroundColor: colors.white },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", padding: 28 },
  logo: { width: 180, height: 180 },
  brand: { fontSize: 24, fontWeight: "800", color: colors.gray900, marginTop: 16 },
  subtitle: { fontSize: 13, color: colors.gray500, marginTop: 6, textAlign: "center" },
  message: { fontSize: 14, color: colors.gray500, lineHeight: 22, textAlign: "center", marginTop: 20 },
  action: { width: "100%", maxWidth: 340, marginTop: 16 },
});
