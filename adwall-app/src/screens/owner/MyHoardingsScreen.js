import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hoardingService } from "../../api/api";
import { Card } from "../../components/Card";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

export default function MyHoardingsScreen({ navigation }) {
  const [hoardings, setHoardings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await hoardingService.getMyHoardings();
      setHoardings(data.data || []);
    } catch (e) { setHoardings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <View style={styles.headerRow}>
        <Text style={styles.countText}>{hoardings.length} listings</Text>
        <Button title="+ Add" onPress={() => navigation.navigate("AddHoarding")} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand500} style={{ marginTop: 40 }} />
      ) : hoardings.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 44 }}>🪧</Text>
          <Text style={styles.emptyTitle}>Koi hoarding nahi hai abhi</Text>
          <Text style={styles.emptySub}>Pehli hoarding add karo aur advertisers tak pahuncho</Text>
          <Button title="Add First Hoarding" onPress={() => navigation.navigate("AddHoarding")} style={{ marginTop: 14 }} />
        </View>
      ) : (
        <FlatList
          data={hoardings}
          keyExtractor={(h) => h._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: h }) => (
            <Card style={{ marginBottom: 14, padding: 0, overflow: "hidden" }}>
              <View style={styles.imageWrap}>
                {h.images?.[0] ? (
                  <Image source={{ uri: h.images[0] }} style={{ width: "100%", height: "100%" }} />
                ) : <View style={styles.imgPlaceholder}><Text style={{ fontSize: 32 }}>🪧</Text></View>}
                <View style={styles.statusOverlay}><StatusBadge status={h.verificationStatus} /></View>
                {!h.isActive && (
                  <View style={styles.inactiveOverlay}><Text style={styles.inactiveText}>Inactive</Text></View>
                )}
              </View>
              <View style={{ padding: 14 }}>
                <Text style={styles.title} numberOfLines={1}>{h.title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={11} color={colors.gray500} />
                  <Text style={styles.metaText}>{h.location?.area}, {h.location?.city}</Text>
                </View>
                <View style={[styles.metaRow, { gap: 12 }]}>
                  <View style={styles.metaRow}><Ionicons name="resize-outline" size={11} color={colors.gray500} /><Text style={styles.metaText}>{h.dimensions?.width}×{h.dimensions?.height} ft</Text></View>
                  <View style={styles.metaRow}><Ionicons name="eye-outline" size={11} color={colors.gray500} /><Text style={styles.metaText}>{h.views || 0} views</Text></View>
                </View>
                <View style={styles.footerRow}>
                  <Text style={styles.price}>{formatCurrency(h.pricing?.perMonth)}<Text style={styles.priceSuffix}>/mo</Text></Text>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate("HoardingDetail", { id: h._id })}>
                    <Text style={styles.viewBtnText}>View</Text>
                  </TouchableOpacity>
                </View>
                {h.verificationStatus === "rejected" && (
                  <View style={styles.rejectedBox}><Text style={styles.rejectedText}>❌ Rejected — Update karo aur resubmit karo</Text></View>
                )}
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  countText: { fontSize: 13, color: colors.gray500 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 4, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900, marginTop: 6 },
  emptySub: { fontSize: 12.5, color: colors.gray500, textAlign: "center" },
  imageWrap: { height: 150, backgroundColor: colors.gray100 },
  imgPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  statusOverlay: { position: "absolute", top: 8, left: 8 },
  inactiveOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  inactiveText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  title: { fontSize: 14.5, fontWeight: "700", color: colors.gray900 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  metaText: { fontSize: 11, color: colors.gray500 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  price: { fontSize: 15, fontWeight: "800", color: colors.brand600 },
  priceSuffix: { fontSize: 10.5, color: colors.gray400, fontWeight: "400" },
  viewBtn: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  viewBtnText: { fontSize: 11.5, fontWeight: "700", color: colors.gray800 },
  rejectedBox: { marginTop: 10, backgroundColor: "#fef2f2", borderRadius: radius.sm, padding: 8 },
  rejectedText: { fontSize: 11, color: colors.red },
});
