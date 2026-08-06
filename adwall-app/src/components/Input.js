import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { colors, radius } from "../theme/colors";

export default function Input({ icon, style, ...props }) {
  return (
    <View style={[styles.wrap, style]}>
      {icon}
      <TextInput
        placeholderTextColor={colors.gray400}
        style={[styles.input, icon && { paddingLeft: 4 }]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: colors.gray900,
  },
});
