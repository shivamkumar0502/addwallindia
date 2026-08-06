import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/Button";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

// Temporary placeholder for screens not yet built in Phase 1
// (client/owner/admin dashboards, bookings, wallet, KYC, etc.)
export default function DashboardPlaceholder({ label }) {
  const { logout, user } = useAuth();
  return (
    <View style={styles.wrap}>
      <Ionicons name="construct-outline" size={40} color={colors.brand500} />
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.sub}>Logged in as {user?.name} ({user?.role})</Text>
      <Text style={styles.sub}>Ye screen Phase 2 mein banegi.</Text>
      <Button title="Logout" variant="outline" onPress={logout} style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, padding: 24, gap: 6 },
  title: { fontSize: 18, fontWeight: "800", color: colors.gray900, marginTop: 10 },
  sub: { fontSize: 13, color: colors.gray500 },
});
