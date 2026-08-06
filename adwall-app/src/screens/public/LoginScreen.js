import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { colors, radius } from "../../theme/colors";

export default function LoginScreen({ navigation }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handle = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      // RootNavigator switches to the right role stack automatically once `user` is set
    } catch (err) {
      if (!err.response) {
        setError("Backend se connect nahi ho paya. app.json me apiUrl check karo aur backend chal raha hai ya nahi confirm karo.");
      } else {
        setError(err.response?.data?.message || "Login failed, please try again");
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
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Apne account mein login karo</Text>

          {!!error && (
            <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
          )}

          <Text style={styles.label}>Email Address</Text>
          <Input
            icon={<Ionicons name="mail-outline" size={16} color={colors.gray400} />}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => handle("email", v)}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <Input
            icon={<Ionicons name="lock-closed-outline" size={16} color={colors.gray400} />}
            placeholder="••••••"
            secureTextEntry={!showPass}
            value={form.password}
            onChangeText={(v) => handle("password", v)}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ alignSelf: "flex-end", marginTop: 6 }}>
            <Text style={styles.toggleShow}>{showPass ? "Hide" : "Show"} password</Text>
          </TouchableOpacity>

          <Button title={loading ? "Logging in..." : "Login"} onPress={handleSubmit} loading={loading} style={{ marginTop: 20 }} />

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{ alignSelf: "center", marginTop: 14 }}>
            <Text style={styles.link}>Password bhool gaye?</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.subtitle}>Account nahi hai? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.link, { fontWeight: "700" }]}>Register karo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  logoWrap: { alignItems: "center", marginBottom: 28, flexDirection: "row", justifyContent: "center", gap: 10 },
  logoBox: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center" },
  logoText: { color: colors.white, fontWeight: "800" },
  brandText: { fontSize: 22, fontWeight: "800", color: colors.gray900 },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 22, borderWidth: 1, borderColor: colors.gray100 },
  title: { fontSize: 22, fontWeight: "800", color: colors.gray900, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.gray500, textAlign: "center", marginTop: 4 },
  label: { fontSize: 13, fontWeight: "600", color: colors.gray800, marginBottom: 6, marginTop: 18 },
  errorBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: radius.md, padding: 10, marginTop: 16 },
  errorText: { color: colors.red, fontSize: 13 },
  toggleShow: { fontSize: 12, color: colors.gray500 },
  link: { color: colors.brand500, fontSize: 13 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
});
