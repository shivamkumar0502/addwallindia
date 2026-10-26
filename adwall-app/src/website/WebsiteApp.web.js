import React, { useEffect } from "react";
import { View, Text, Linking } from "react-native";
import Button from "../components/Button";
import { WEBSITE_URL } from "./policy";

// WebView is native-only. A web build uses the actual top-level website, so
// Google login, browser uploads and downloads keep their normal browser APIs.
export default function WebsiteApp() {
  useEffect(() => { window.location.replace(WEBSITE_URL); }, []);
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Text style={{ marginBottom: 16 }}>Opening AdWall India…</Text>
      <Button title="Open AdWall India" onPress={() => Linking.openURL(WEBSITE_URL)} />
    </View>
  );
}
