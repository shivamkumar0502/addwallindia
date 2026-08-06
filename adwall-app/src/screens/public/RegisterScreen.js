import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { colors, radius } from "../../theme/colors";

export default function RegisterScreen({ navigation, route }) {
  const [role, setRole] = useState(route?.params?.role || "client");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handle = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await register({ ...form, role });
    } catch (err) {
      if (!err.response) {
        setError("Backend se connect nahi ho paya. app.json me apiUrl check karo aur backend chal raha hai ya nahi confirm karo.");
      } else {
        setError(err.response?.data?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}><Text style={styles.logoText}>AW</Text></View>
          <Text style={styles.brandText}>AdWall <Text style={{ color: colors.brand500 }}>India</Text></Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Account Banao</Text>
          <Text style={styles.subtitle}>Pehle batao — aap kya hain?</Text>

          <View style={styles.roleRow}>
            <TouchableOpacity
              onPress={() => setRole("client")}
              style={[styles.roleBox, role === "client" && styles.roleBoxActive]}
            >
              <Ionicons name="megaphone-outline" size={22} color={role === "client" ? colors.brand500 : colors.gray400} />
              <Text style={[styles.roleTitle, role === "client" && { color: colors.brand600 }]}>Advertiser</Text>
              <Text style={styles.roleDesc}>Ad space book karna hai</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRole("owner")}
              style={[styles.roleBox, role === "owner" && styles.roleBoxActive]}
            >
              <Ionicons name="business-outline" size={22} color={role === "owner" ? colors.brand500 : colors.gray400} />
              <Text style={[styles.roleTitle, role === "owner" && { color: colors.brand600 }]}>Space Owner</Text>
              <Text style={styles.roleDesc}>Hoarding list karna hai</Text>
            </TouchableOpacity>
          </View>

          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

          <Text style={styles.label}>Full Name</Text>
          <Input icon={<Ionicons name="person-outline" size={16} color={colors.gray400} />} placeholder="Aapka naam" value={form.name} onChangeText={(v) => handle("name", v)} />

          <Text style={[styles.label, { marginTop: 14 }]}>Email</Text>
          <Input icon={<Ionicons name="mail-outline" size={16} color={colors.gray400} />} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => handle("email", v)} />

          <Text style={[styles.label, { marginTop: 14 }]}>Mobile Number</Text>
          <Input icon={<Ionicons name="call-outline" size={16} color={colors.gray400} />} placeholder="10-digit mobile number" keyboardType="phone-pad" value={form.mobile} onChangeText={(v) => handle("mobile", v)} />

          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <Input icon={<Ionicons name="lock-closed-outline" size={16} color={colors.gray400} />} placeholder="Min 6 characters" secureTextEntry value={form.password} onChangeText={(v) => handle("password", v)} />

          <Button
            title={loading ? "Creating account..." : `Register as ${role === "client" ? "Advertiser" : "Space Owner"}`}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 20 }}
          />

          <View style={styles.footerRow}>
            <Text style={styles.subtitle}>Pehle se account hai? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.link, { fontWeight: "700" }]}>Login karo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  logoWrap: { alignItems: "center", marginBottom: 24, flexDirection: "row", justifyContent: "center", gap: 10 },
  logoBox: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center" },
  logoText: { color: colors.white, fontWeight: "800" },
  brandText: { fontSize: 22, fontWeight: "800", color: colors.gray900 },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 22, borderWidth: 1, borderColor: colors.gray100 },
  title: { fontSize: 22, fontWeight: "800", color: colors.gray900, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.gray500, textAlign: "center", marginTop: 4 },
  roleRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  roleBox: { flex: 1, borderWidth: 2, borderColor: colors.gray200, borderRadius: radius.lg, padding: 14, alignItems: "center", gap: 6 },
  roleBoxActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  roleTitle: { fontSize: 13, fontWeight: "700", color: colors.gray800 },
  roleDesc: { fontSize: 10.5, color: colors.gray500, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "600", color: colors.gray800, marginBottom: 6, marginTop: 18 },
  errorBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: radius.md, padding: 10, marginTop: 16 },
  errorText: { color: colors.red, fontSize: 13 },
  link: { color: colors.brand500, fontSize: 13 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 14 },
});
