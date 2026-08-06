import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { kycService } from "../../api/api";
import { Card } from "../../components/Card";
import { formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

export default function KYCReviewScreen() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await kycService.getPending();
      setOwners(data.data || []);
    } catch (e) { setOwners([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (userId, decision, rejectionReason = "") => {
    setProcessing(userId);
    try {
      await kycService.review(userId, { decision, rejectionReason });
      Alert.alert("Done", `KYC ${decision} successfully!`);
      setRejecting(null); setReason("");
      load();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Action failed");
    } finally { setProcessing(""); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pageTitle}>KYC Verification</Text>
      <Text style={styles.pageSub}>{owners.length} pending requests</Text>

      {owners.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="checkmark-circle" size={48} color="#4ade80" />
          <Text style={styles.emptyTitle}>Sabhi KYC reviewed!</Text>
          <Text style={styles.emptySub}>Koi pending request nahi hai abhi</Text>
        </View>
      ) : (
        owners.map((owner) => (
          <Card key={owner._id} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{owner.name?.[0]}</Text></View>
              <View>
                <Text style={styles.ownerName}>{owner.name}</Text>
                <Text style={styles.ownerMeta}>Submitted {formatDate(owner.createdAt)}</Text>
              </View>
            </View>

            <View style={{ marginTop: 10, gap: 4 }}>
              <View style={styles.infoRow}><Ionicons name="mail-outline" size={12} color={colors.gray400} /><Text style={styles.infoText}>{owner.email}</Text></View>
              <View style={styles.infoRow}><Ionicons name="call-outline" size={12} color={colors.gray400} /><Text style={styles.infoText}>{owner.mobile}</Text></View>
              {owner.businessDetails?.agencyName && (
                <View style={styles.infoRow}><Ionicons name="business-outline" size={12} color={colors.gray400} /><Text style={styles.infoText}>{owner.businessDetails.agencyName}</Text></View>
              )}
            </View>

            <Text style={styles.docHeading}>Documents</Text>
            {[
              { label: "Aadhaar", url: owner.kycDocuments?.aadhaarUrl },
              { label: "PAN", url: owner.kycDocuments?.panUrl },
              { label: "Selfie", url: owner.kycDocuments?.selfieUrl },
            ].map(({ label, url }) => (
              url ? (
                <TouchableOpacity key={label} onPress={() => Linking.openURL(url)} style={styles.docRow}>
                  <Ionicons name="document-text-outline" size={13} color={colors.blue} />
                  <Text style={styles.docLink}>{label} - View</Text>
                </TouchableOpacity>
              ) : (
                <View key={label} style={styles.docRow}>
                  <Ionicons name="document-text-outline" size={13} color={colors.gray400} />
                  <Text style={styles.docMissing}>{label} - Not uploaded</Text>
                </View>
              )
            ))}
            {owner.kycDocuments?.gstNumber && <Text style={styles.gstText}>GST: {owner.kycDocuments.gstNumber}</Text>}

            <View style={styles.actionRow}>
              <TouchableOpacity
                disabled={processing === owner._id}
                onPress={() => handleReview(owner._id, "verified")}
                style={styles.approveBtn}
              >
                <Ionicons name="checkmark-circle" size={14} color={colors.white} />
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRejecting(owner._id)} style={styles.rejectBtn}>
                <Ionicons name="close-circle" size={14} color={colors.white} />
                <Text style={styles.approveBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>

            {rejecting === owner._id && (
              <View style={styles.rejectPanel}>
                <TextInput
                  style={styles.textarea}
                  placeholder="Rejection reason batao (owner ko email jaayega)..."
                  multiline
                  value={reason}
                  onChangeText={setReason}
                />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    disabled={!reason || processing === owner._id}
                    onPress={() => handleReview(owner._id, "rejected", reason)}
                    style={[styles.rejectBtn, { flex: 1, opacity: !reason ? 0.5 : 1 }]}
                  >
                    <Text style={styles.approveBtnText}>Confirm Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setRejecting(null); setReason(""); }} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  pageTitle: { fontSize: 20, fontWeight: "800", color: colors.gray900 },
  pageSub: { fontSize: 12.5, color: colors.gray500, marginTop: 3, marginBottom: 16 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 4 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900, marginTop: 6 },
  emptySub: { fontSize: 12.5, color: colors.gray400 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand100, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 17, fontWeight: "800", color: colors.brand600 },
  ownerName: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  ownerMeta: { fontSize: 10.5, color: colors.gray400, marginTop: 1 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 12, color: colors.gray600 },
  docHeading: { fontSize: 12.5, fontWeight: "700", color: colors.gray700, marginTop: 14, marginBottom: 6 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 3 },
  docLink: { fontSize: 12, color: colors.blue },
  docMissing: { fontSize: 12, color: colors.gray400 },
  gstText: { fontSize: 11, color: colors.gray500, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#16a34a", borderRadius: radius.md, paddingVertical: 9 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: 9 },
  approveBtnText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  rejectPanel: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.gray100, paddingTop: 12 },
  textarea: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, padding: 10, fontSize: 13, height: 60 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  cancelBtnText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
});
