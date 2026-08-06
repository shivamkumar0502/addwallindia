import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { kycService } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/Card";
import Button from "../../components/Button";
import { colors, radius } from "../../theme/colors";

const DOC_FIELDS = [
  { key: "aadhaar", label: "Aadhaar Card *", hint: "Front side ka photo (max 5MB)" },
  { key: "pan", label: "PAN Card *", hint: "PAN card ka clear photo (max 5MB)" },
  { key: "selfie", label: "Selfie with Aadhaar *", hint: "Aadhaar haath me pakad ke selfie lo" },
];

export default function KYCScreen() {
  const { updateUser } = useAuth();
  const [kycData, setKycData] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [files, setFiles] = useState({ aadhaar: null, pan: null, selfie: null });
  const [form, setForm] = useState({ gstNumber: "", companyName: "", agencyName: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await kycService.getStatus();
        setKycData(data.data);
      } catch (e) {
        // ignore, treat as fresh
      } finally { setKycLoading(false); }
    })();
  }, []);

  const pickFile = async (key) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission chahiye");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setFiles((f) => ({ ...f, [key]: result.assets[0] }));
  };

  const handleSubmit = async () => {
    if (!files.aadhaar || !files.pan || !files.selfie) {
      return setError("Aadhaar, PAN aur Selfie teeno required hain");
    }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(files).forEach(([key, f]) => fd.append(key, { uri: f.uri, name: `${key}.jpg`, type: "image/jpeg" }));
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      await kycService.submit(fd);
      updateUser({ kycStatus: "pending" });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Submit failed");
    } finally { setLoading(false); }
  };

  if (kycLoading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  const docsSubmitted = !!kycData?.kycDocuments?.aadhaarUrl;
  const kycStatus = kycData?.kycStatus || "pending";

  if (success) {
    return (
      <View style={styles.centerCard}>
        <Ionicons name="time" size={48} color="#eab308" />
        <Text style={styles.stateTitle}>Documents Submitted!</Text>
        <Text style={styles.stateSub}>Admin 24-48 hours me review karega. Status update hone pe notification milega.</Text>
      </View>
    );
  }

  if (kycStatus === "verified") {
    return (
      <View style={styles.centerCard}>
        <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
        <Text style={styles.stateTitle}>KYC Verified! ✅</Text>
        <Text style={styles.stateSub}>Badhai ho! Ab aap hoardings add kar sakte ho.</Text>
        {kycData?.kycDocuments && (
          <View style={styles.docList}>
            {[["Aadhaar", kycData.kycDocuments.aadhaarUrl], ["PAN", kycData.kycDocuments.panUrl], ["Selfie", kycData.kycDocuments.selfieUrl]].map(([label, url]) =>
              url ? (
                <TouchableOpacity key={label} onPress={() => Linking.openURL(url)} style={styles.docLink}>
                  <Ionicons name="document-text-outline" size={13} color={colors.blue} />
                  <Text style={styles.docLinkText}>{label} — View</Text>
                </TouchableOpacity>
              ) : null
            )}
          </View>
        )}
      </View>
    );
  }

  if (docsSubmitted && kycStatus === "pending") {
    return (
      <View style={styles.centerCard}>
        <Ionicons name="time" size={48} color="#eab308" />
        <Text style={styles.stateTitle}>Review Pending</Text>
        <Text style={styles.stateSub}>Aapke documents admin ke paas review ke liye hain. 24-48 hours me update aayega.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pageTitle}>KYC Verification</Text>
      <Text style={styles.pageSub}>Hoarding list karne ke liye identity verify karna zaroori hai</Text>

      {kycStatus === "rejected" && (
        <View style={styles.rejectBox}>
          <Ionicons name="close-circle" size={18} color={colors.red} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.rejectTitle}>KYC Rejected — Dobara Submit Karo</Text>
            <Text style={styles.rejectSub}>Sahi aur clear documents upload karo.</Text>
          </View>
        </View>
      )}

      {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

      <Card style={{ marginTop: 14 }}>
        <Text style={styles.cardHeading}>Identity Documents</Text>
        {DOC_FIELDS.map(({ key, label, hint }) => (
          <View key={key} style={styles.docRow}>
            <View style={[styles.docIcon, files[key] && { backgroundColor: "#dcfce7" }]}>
              <Ionicons name={files[key] ? "checkmark-circle" : "cloud-upload-outline"} size={20} color={files[key] ? "#22c55e" : colors.gray400} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docLabel}>{label}</Text>
              <Text style={styles.docHint} numberOfLines={1}>{files[key] ? "✓ Selected" : hint}</Text>
            </View>
            <TouchableOpacity onPress={() => pickFile(key)} style={styles.uploadBtn}>
              <Text style={styles.uploadBtnText}>{files[key] ? "Change" : "Upload"}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: 14 }}>
        <Text style={styles.cardHeading}>Business Details <Text style={{ color: colors.gray400, fontWeight: "400", fontSize: 11 }}>(Optional)</Text></Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput style={styles.input} placeholder="ABC Pvt Ltd" value={form.companyName} onChangeText={(v) => setForm((f) => ({ ...f, companyName: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Agency Name</Text>
            <TextInput style={styles.input} placeholder="XYZ Advertising" value={form.agencyName} onChangeText={(v) => setForm((f) => ({ ...f, agencyName: v }))} />
          </View>
        </View>
        <Text style={styles.label}>GST Number</Text>
        <TextInput style={styles.input} placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChangeText={(v) => setForm((f) => ({ ...f, gstNumber: v }))} />
        <Text style={styles.label}>Business Address</Text>
        <TextInput style={styles.input} placeholder="Full business address" value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />
      </Card>

      <Button title={loading ? "Submitting..." : "KYC Documents Submit Karo"} onPress={handleSubmit} loading={loading} style={{ marginTop: 18, marginBottom: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  centerCard: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: colors.white },
  stateTitle: { fontSize: 18, fontWeight: "800", color: colors.gray900, marginTop: 14 },
  stateSub: { fontSize: 13, color: colors.gray500, textAlign: "center", marginTop: 8, lineHeight: 19 },
  docList: { marginTop: 18, backgroundColor: colors.gray50, borderRadius: radius.md, padding: 14, alignSelf: "stretch", gap: 8 },
  docLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  docLinkText: { fontSize: 12, color: colors.blue },
  pageTitle: { fontSize: 20, fontWeight: "800", color: colors.gray900 },
  pageSub: { fontSize: 12.5, color: colors.gray500, marginTop: 3 },
  rejectBox: { flexDirection: "row", backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: radius.lg, padding: 14, marginTop: 14 },
  rejectTitle: { fontSize: 13, fontWeight: "700", color: "#b91c1c" },
  rejectSub: { fontSize: 11.5, color: "#dc2626", marginTop: 2 },
  errorBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: radius.md, padding: 10, marginTop: 12 },
  errorText: { color: colors.red, fontSize: 13 },
  cardHeading: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 10 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.gray100, borderRadius: radius.lg, padding: 12, marginBottom: 10 },
  docIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  docLabel: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  docHint: { fontSize: 11, color: colors.gray400, marginTop: 1 },
  uploadBtn: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  uploadBtnText: { fontSize: 11, fontWeight: "700", color: colors.gray700 },
  label: { fontSize: 12.5, fontWeight: "600", color: colors.gray700, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, backgroundColor: colors.white },
});
