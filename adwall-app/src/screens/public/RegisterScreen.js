import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { otpService } from "../../api/api";
import { colors, radius } from "../../theme/colors";

/* Backend ab OTP verification ke bina register accept nahi karta.
   Flow web jaisa hi hai:
     1) details bharo + channel chuno (email ya SMS)
     2) OTP verify karo  -> verifyToken milta hai
     3) verifyToken ke saath account ban jaata hai            */

const STEPS = ["Details", "Verify", "Done"];

export default function RegisterScreen({ navigation, route }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(route?.params?.role || "client");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [channel, setChannel] = useState("email");
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const { register } = useAuth();
  const timer = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    timer.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer.current);
  }, [cooldown]);

  const handle = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const netError = (err, fallback) => {
    if (!err.response)
      return "Server se connect nahi ho paya. Internet check karo ya thodi der baad try karo.";
    return err.response?.data?.message || fallback;
  };

  // ── Step 1 → OTP bhejo ──
  const sendOtp = async () => {
    setError("");

    if (!form.name.trim()) return setError("Naam daalo");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError("Valid email daalo");
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim()))
      return setError("Valid 10-digit mobile number daalo");
    if (form.password.length < 6) return setError("Password kam se kam 6 characters ka ho");

    setLoading(true);
    try {
      const { data } = await otpService.sendRegisterOtp({
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        channel,
      });
      setStep(2);
      setOtp("");
      setCooldown(60);
      setInfo(data.data?.otp ? `Dev mode — OTP: ${data.data.otp}` : data.message);
    } catch (err) {
      setError(netError(err, "OTP bhejne me problem aayi"));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → verify + account banao ──
  const verifyAndRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const { data: v } = await otpService.verifyRegisterOtp({
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        channel,
        otp: otp.trim(),
      });

      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password,
        role,
        verifyToken: v.data.verifyToken,
      });

      setStep(3);
      // AuthContext me user set hote hi navigator apne aap sahi stack pe le jaayega
    } catch (err) {
      setError(netError(err, "Verification fail ho gaya"));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      const { data } = await otpService.sendRegisterOtp({
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        channel,
      });
      setCooldown(60);
      setOtp("");
      setInfo(data.data?.otp ? `Dev mode — OTP: ${data.data.otp}` : "Naya OTP bhej diya.");
    } catch (err) {
      setError(netError(err, "Resend fail hua"));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.gray50 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}><Text style={styles.logoText}>AW</Text></View>
          <Text style={styles.brandText}>
            AdWall <Text style={{ color: colors.brand500 }}>India</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Account Banao</Text>

          {/* Stepper */}
          <View style={styles.stepRow}>
            {STEPS.map((label, i) => (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepDot, step >= i + 1 && styles.stepDotActive]}>
                  <Text style={[styles.stepNum, step >= i + 1 && { color: colors.white }]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, step >= i + 1 && { color: colors.brand500 }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {!!error && (
            <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
          )}
          {!!info && !error && (
            <View style={styles.infoBox}><Text style={styles.infoText}>{info}</Text></View>
          )}

          {/* ───── STEP 1 ───── */}
          {step === 1 && (
            <>
              <Text style={styles.label}>Aap kya hain?</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  onPress={() => setRole("client")}
                  style={[styles.roleBox, role === "client" && styles.roleBoxActive]}
                >
                  <Ionicons
                    name="megaphone-outline"
                    size={22}
                    color={role === "client" ? colors.brand500 : colors.gray400}
                  />
                  <Text style={[styles.roleTitle, role === "client" && { color: colors.brand600 }]}>
                    Advertiser
                  </Text>
                  <Text style={styles.roleDesc}>Ad space book karna hai</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRole("owner")}
                  style={[styles.roleBox, role === "owner" && styles.roleBoxActive]}
                >
                  <Ionicons
                    name="business-outline"
                    size={22}
                    color={role === "owner" ? colors.brand500 : colors.gray400}
                  />
                  <Text style={[styles.roleTitle, role === "owner" && { color: colors.brand600 }]}>
                    Space Owner
                  </Text>
                  <Text style={styles.roleDesc}>Hoarding list karni hai</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Full Name</Text>
              <Input
                icon={<Ionicons name="person-outline" size={16} color={colors.gray400} />}
                placeholder="Aapka naam"
                value={form.name}
                onChangeText={(v) => handle("name", v)}
              />

              <Text style={styles.label}>Email Address</Text>
              <Input
                icon={<Ionicons name="mail-outline" size={16} color={colors.gray400} />}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => handle("email", v)}
              />

              <Text style={styles.label}>Mobile Number</Text>
              <Input
                icon={<Ionicons name="call-outline" size={16} color={colors.gray400} />}
                placeholder="10-digit number"
                keyboardType="number-pad"
                maxLength={10}
                value={form.mobile}
                onChangeText={(v) => handle("mobile", v.replace(/\D/g, ""))}
              />

              <Text style={styles.label}>Password</Text>
              <Input
                icon={<Ionicons name="lock-closed-outline" size={16} color={colors.gray400} />}
                placeholder="Kam se kam 6 characters"
                secureTextEntry={!showPass}
                value={form.password}
                onChangeText={(v) => handle("password", v)}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={{ alignSelf: "flex-end", marginTop: 6 }}
              >
                <Text style={styles.toggleShow}>{showPass ? "Hide" : "Show"} password</Text>
              </TouchableOpacity>

              <Text style={styles.label}>OTP kahan bhejein?</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  onPress={() => setChannel("email")}
                  style={[styles.roleBox, channel === "email" && styles.roleBoxActive]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={channel === "email" ? colors.brand500 : colors.gray400}
                  />
                  <Text style={[styles.roleTitle, channel === "email" && { color: colors.brand600 }]}>
                    Email pe
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setChannel("mobile")}
                  style={[styles.roleBox, channel === "mobile" && styles.roleBoxActive]}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color={channel === "mobile" ? colors.brand500 : colors.gray400}
                  />
                  <Text style={[styles.roleTitle, channel === "mobile" && { color: colors.brand600 }]}>
                    SMS pe
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title={loading ? "OTP bhej rahe hain..." : "Aage badho"}
                onPress={sendOtp}
                loading={loading}
                style={{ marginTop: 20 }}
              />
            </>
          )}

          {/* ───── STEP 2 ───── */}
          {step === 2 && (
            <>
              <Text style={styles.otpHint}>
                6-digit code bheja hai{" "}
                <Text style={{ fontWeight: "700", color: colors.gray900 }}>
                  {channel === "mobile" ? `+91 ${form.mobile}` : form.email}
                </Text>{" "}
                pe.
              </Text>

              <Input
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, ""))}
                style={{ marginTop: 18 }}
              />

              <Button
                title={loading ? "Verify kar rahe hain..." : "Verify & Account Banao"}
                onPress={verifyAndRegister}
                loading={loading}
                style={{ marginTop: 20 }}
              />

              <View style={styles.rowBetween}>
                <TouchableOpacity onPress={() => { setStep(1); setError(""); setInfo(""); }}>
                  <Text style={styles.link}>← Details badlo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={resend} disabled={cooldown > 0}>
                  <Text style={[styles.link, cooldown > 0 && { color: colors.gray400 }]}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setChannel((c) => (c === "email" ? "mobile" : "email"));
                  setStep(1);
                  setError("");
                  setInfo("");
                }}
                style={{ alignSelf: "center", marginTop: 14 }}
              >
                <Text style={styles.link}>
                  {channel === "email" ? "Email nahi aaya? SMS pe mangwao" : "SMS nahi aaya? Email pe mangwao"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ───── STEP 3 ───── */}
          {step === 3 && (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Ionicons name="checkmark-circle" size={56} color={colors.green} />
              <Text style={[styles.title, { marginTop: 12 }]}>Account ban gaya!</Text>
              <Text style={styles.subtitle}>Dashboard pe le ja rahe hain...</Text>
            </View>
          )}

          {step !== 3 && (
            <View style={styles.footerRow}>
              <Text style={styles.subtitle}>Account hai? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={[styles.link, { fontWeight: "700" }]}>Login karo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  logoWrap: {
    alignItems: "center", marginBottom: 24, flexDirection: "row",
    justifyContent: "center", gap: 10,
  },
  logoBox: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brand500,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { color: colors.white, fontWeight: "800" },
  brandText: { fontSize: 22, fontWeight: "800", color: colors.gray900 },
  card: {
    backgroundColor: colors.white, borderRadius: radius.xl, padding: 22,
    borderWidth: 1, borderColor: colors.gray100,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.gray900, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.gray500, textAlign: "center", marginTop: 4 },

  stepRow: { flexDirection: "row", justifyContent: "center", gap: 26, marginTop: 18, marginBottom: 4 },
  stepItem: { alignItems: "center", gap: 5 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.gray200,
    alignItems: "center", justifyContent: "center",
  },
  stepDotActive: { backgroundColor: colors.brand500 },
  stepNum: { fontSize: 13, fontWeight: "800", color: colors.gray500 },
  stepLabel: { fontSize: 11, fontWeight: "600", color: colors.gray400 },

  label: { fontSize: 13, fontWeight: "600", color: colors.gray800, marginBottom: 6, marginTop: 18 },
  roleRow: { flexDirection: "row", gap: 10 },
  roleBox: {
    flex: 1, borderWidth: 2, borderColor: colors.gray200, borderRadius: radius.md,
    padding: 12, gap: 4,
  },
  roleBoxActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  roleTitle: { fontSize: 13, fontWeight: "700", color: colors.gray800, marginTop: 4 },
  roleDesc: { fontSize: 11, color: colors.gray500 },

  otpHint: { fontSize: 13, color: colors.gray500, textAlign: "center", marginTop: 18 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },

  errorBox: {
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: radius.md, padding: 10, marginTop: 16,
  },
  errorText: { color: colors.red, fontSize: 13 },
  infoBox: {
    backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe",
    borderRadius: radius.md, padding: 10, marginTop: 16,
  },
  infoText: { color: colors.blue, fontSize: 13 },

  toggleShow: { fontSize: 12, color: colors.gray500 },
  link: { color: colors.brand500, fontSize: 13 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
});