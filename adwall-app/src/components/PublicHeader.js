import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "../theme/colors";

export default function PublicHeader({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.logoRow} onPress={() => navigation.navigate("Home")}>
          <View style={styles.logoBox}><Text style={styles.logoText}>AW</Text></View>
          <Text style={styles.brand}>AdWall <Text style={{ color: colors.brand500 }}>India</Text></Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.loginBtn}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.registerBtn}>
            <Text style={styles.registerText}>Register Free</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  wrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 56 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center" },
  logoText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  brand: { fontSize: 15.5, fontWeight: "800", color: colors.gray900 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  loginBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  loginText: { fontSize: 12.5, fontWeight: "600", color: colors.gray700 },
  registerBtn: { backgroundColor: colors.brand500, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  registerText: { fontSize: 12.5, fontWeight: "700", color: colors.white },
});
