import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { otpService } from "../../api/api";
import { colors, radius } from "../../theme/colors";

/* Nayi screen. Pehle AppNavigator me "ForgotPassword" DashboardPlaceholder
   pe point karta tha — matlab link kaam karta dikhta tha par kuch hota
   nahi tha. Ab poora flow hai: email -> OTP -> naya password. */

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    timer.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer.current);
  }, [cooldown]);

  const netError = (err, fallback) => {
    if (!err.response) return "Server se connect nahi ho paya. Thodi der baad try karo.";
    return err.response?.data?.message || fallback;
  };

  const sendOtp = async () => {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Valid email daalo");

    setLoading(true);
    try {
      const { data } = await otpService.forgotPassword(email.trim().toLowerCase());
      setStep(2);
      setCooldown(60);
      setInfo(data.message || "OTP bhej diya. Email check karo.");
    } catch (err) {
      setError(netError(err, "OTP bhejne me problem aayi"));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    if (otp.trim().length !== 6) return setError("6-digit OTP daalo");
    if (password.length < 6) return setError("Password kam se kam 6 characters ka ho");
    if (password !== confirm) return setError("Dono passwords match nahi kar rahe");

    setLoading(true);
    try {
      await otpService.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: password,
      });
      setStep(3);
    } catch (err) {
      setError(netError(err, "Password reset fail hua"));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      await otpService.forgotPassword(email.trim().toLowerCase());
      setCooldown(60);
      setOtp("");
      setInfo("Naya OTP bhej diya.");
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
        <View style={styles.card}>
          {step === 1 && (
            <>
              <Ionicons
                name="key-outline"
                size={40}
                color={colors.brand500}
                style={{ alignSelf: "center" }}
              />
              <Text style={styles.title}>Password Bhool Gaye?</Text>
              <Text style={styles.subtitle}>
                Apna registered email daalo, OTP bhej denge.
              </Text>

              {!!error && (
                <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
              )}

              <Text style={styles.label}>Email Address</Text>
              <Input
                icon={<Ionicons name="mail-outline" size={16} color={colors.gray400} />}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Button
                title={loading ? "Bhej rahe hain..." : "OTP Bhejo"}
                onPress={sendOtp}
                loading={loading}
                style={{ marginTop: 20 }}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>Naya Password Set Karo</Text>
              <Text style={styles.subtitle}>
                OTP bheja hai{" "}
                <Text style={{ fontWeight: "700", color: colors.gray900 }}>{email}</Text> pe.
              </Text>

              {!!error && (
                <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
              )}
              {!!info && !error && (
                <View style={styles.infoBox}><Text style={styles.infoText}>{info}</Text></View>
              )}

              <Text style={styles.label}>OTP</Text>
              <Input
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, ""))}
              />

              <Text style={styles.label}>Naya Password</Text>
              <Input
                icon={<Ionicons name="lock-closed-outline" size={16} color={colors.gray400} />}
                placeholder="Kam se kam 6 characters"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />

              <Text style={styles.label}>Confirm Password</Text>
              <Input
                icon={<Ionicons name="lock-closed-outline" size={16} color={colors.gray400} />}
                placeholder="Dobara likho"
                secureTextEntry={!showPass}
                value={confirm}
                onChangeText={setConfirm}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={{ alignSelf: "flex-end", marginTop: 6 }}
              >
                <Text style={styles.toggleShow}>{showPass ? "Hide" : "Show"} password</Text>
              </TouchableOpacity>

              <Button
                title={loading ? "Update kar rahe hain..." : "Password Badlo"}
                onPress={resetPassword}
                loading={loading}
                style={{ marginTop: 20 }}
              />

              <View style={styles.rowBetween}>
                <TouchableOpacity onPress={() => { setStep(1); setError(""); setInfo(""); }}>
                  <Text style={styles.link}>← Email badlo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={resend} disabled={cooldown > 0}>
                  <Text style={[styles.link, cooldown > 0 && { color: colors.gray400 }]}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 3 && (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Ionicons name="checkmark-circle" size={56} color={colors.green} />
              <Text style={[styles.title, { marginTop: 12 }]}>Password Badal Gaya!</Text>
              <Text style={styles.subtitle}>Ab naye password se login karo.</Text>
              <Button
                title="Login pe jao"
                onPress={() => navigation.navigate("Login")}
                style={{ marginTop: 24, alignSelf: "stretch" }}
              />
            </View>
          )}
        </View>

        {step !== 3 && (
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={{ alignSelf: "center", marginTop: 18 }}
          >
            <Text style={styles.link}>← Login pe wapas</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  card: {
    backgroundColor: colors.white, borderRadius: radius.xl, padding: 22,
    borderWidth: 1, borderColor: colors.gray100,
  },
  title: { fontSize: 21, fontWeight: "800", color: colors.gray900, textAlign: "center", marginTop: 10 },
  subtitle: { fontSize: 13, color: colors.gray500, textAlign: "center", marginTop: 6 },
  label: { fontSize: 13, fontWeight: "600", color: colors.gray800, marginBottom: 6, marginTop: 18 },
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
});