import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hoardingService } from "../../api/api";
import { Card } from "../../components/Card";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

export default function HoardingsReviewScreen() {
  const [hoardings, setHoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await hoardingService.getPending();
      setHoardings(data.data || []);
    } catch (e) { setHoardings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (id, decision, rejectionReason = "") => {
    setProcessing(id);
    try {
      await hoardingService.verify(id, { decision, rejectionReason });
      Alert.alert("Done", `Hoarding ${decision}!`);
      setRejecting(null); setReason("");
      load();
    } catch (e) {
      Alert.alert("Error", "Action failed");
    } finally { setProcessing(""); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pageTitle}>Hoarding Verification</Text>
      <Text style={styles.pageSub}>{hoardings.length} pending hoardings</Text>

      {hoardings.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="checkmark-circle" size={48} color="#4ade80" />
          <Text style={styles.emptyTitle}>Sabhi hoardings reviewed!</Text>
        </View>
      ) : (
        hoardings.map((h) => (
          <Card key={h._id} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={styles.thumb}>
                {h.images?.[0] ? <Image source={{ uri: h.images[0] }} style={{ width: "100%", height: "100%" }} /> : <Text style={{ fontSize: 26 }}>🪧</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.title} numberOfLines={1}>{h.title}</Text>
                  <View style={styles.pendingBadge}><Text style={styles.pendingText}>Pending</Text></View>
                </View>
                <Text style={styles.meta}>by {h.owner?.name} • {formatDate(h.createdAt)}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={11} color={colors.gray400} />
                  <Text style={styles.metaText}>{h.location?.area}, {h.location?.city}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="resize-outline" size={11} color={colors.gray400} />
                  <Text style={styles.metaText}>{h.dimensions?.width}×{h.dimensions?.height} ft • {h.dailyTraffic?.replace("_", " ")} traffic</Text>
                </View>
                <Text style={styles.price}>{formatCurrency(h.pricing?.perMonth)}/month</Text>
              </View>
            </View>

            {!!h.description && <Text style={styles.desc} numberOfLines={2}>{h.description}</Text>}

            {h.images?.length > 1 && (
              <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                {h.images.slice(1, 4).map((img, i) => <Image key={i} source={{ uri: img }} style={styles.extraImg} />)}
                {h.images.length > 4 && <View style={styles.moreImg}><Text style={styles.moreImgText}>+{h.images.length - 4}</Text></View>}
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity disabled={processing === h._id} onPress={() => handleVerify(h._id, "verified")} style={styles.approveBtn}>
                <Ionicons name="checkmark-circle" size={14} color={colors.white} />
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRejecting(h._id)} style={styles.rejectBtn}>
                <Ionicons name="close-circle" size={14} color={colors.white} />
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>

            {rejecting === h._id && (
              <View style={styles.rejectPanel}>
                <TextInput style={styles.textarea} placeholder="Rejection reason batao..." multiline value={reason} onChangeText={setReason} />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <TouchableOpacity disabled={!reason} onPress={() => handleVerify(h._id, "rejected", reason)} style={[styles.rejectBtn, { flex: 1, opacity: !reason ? 0.5 : 1 }]}>
                    <Text style={styles.actionBtnText}>Confirm Reject</Text>
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
  thumb: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  title: { fontSize: 14, fontWeight: "700", color: colors.gray900, flex: 1 },
  pendingBadge: { backgroundColor: "#fef9c3", borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, height: 20 },
  pendingText: { fontSize: 10, fontWeight: "700", color: "#a16207" },
  meta: { fontSize: 10.5, color: colors.gray400, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 11, color: colors.gray500 },
  price: { fontSize: 13, fontWeight: "800", color: colors.brand600, marginTop: 5 },
  desc: { fontSize: 11.5, color: colors.gray500, marginTop: 8, lineHeight: 17 },
  extraImg: { width: 56, height: 44, borderRadius: radius.sm, backgroundColor: colors.gray100 },
  moreImg: { width: 56, height: 44, borderRadius: radius.sm, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  moreImgText: { fontSize: 11, color: colors.gray500 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#16a34a", borderRadius: radius.md, paddingVertical: 9 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: 9 },
  actionBtnText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  rejectPanel: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.gray100, paddingTop: 12 },
  textarea: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, padding: 10, fontSize: 13, height: 60 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  cancelBtnText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
});
