import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import WebsiteApp from "./src/website/WebsiteApp";

// The live website is the app's UI and auth source of truth. Do not mount the
// old native AuthProvider, navigator or duplicate chatbot over the website.
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <WebsiteApp />
    </SafeAreaProvider>
  );
}
