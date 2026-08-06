import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/colors";

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatsCard({ title, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray100, padding: 16 },
  statCard: { flexBasis: "48%", backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray100, padding: 14, marginBottom: 12, gap: 4 },
  statValue: { fontSize: 20, fontWeight: "900", color: colors.gray900 },
  statTitle: { fontSize: 11.5, color: colors.gray500 },
});
