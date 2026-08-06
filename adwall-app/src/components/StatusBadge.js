import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getStatusColor } from "../utils/format";
import { radius } from "../theme/colors";

export default function StatusBadge({ status }) {
  const { bg, text } = getStatusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{(status || "").replace(/_/g, " ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, alignSelf: "flex-start" },
  text: { fontSize: 10.5, fontWeight: "700", textTransform: "capitalize" },
});
