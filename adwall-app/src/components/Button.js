import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius } from "../theme/colors";

// variant: "primary" | "outline" | "ghost"
export default function Button({ title, onPress, variant = "primary", loading = false, disabled = false, style, icon }) {
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        !isOutline && !isGhost && styles.primary,
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? colors.brand600 : colors.white} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, isOutline && styles.textOutline, isGhost && styles.textGhost]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  primary: { backgroundColor: colors.brand500 },
  outline: { borderWidth: 1.5, borderColor: colors.gray200, backgroundColor: colors.white },
  ghost: { backgroundColor: "transparent" },
  text: { color: colors.white, fontWeight: "700", fontSize: 15 },
  textOutline: { color: colors.gray800 },
  textGhost: { color: colors.brand600 },
});
