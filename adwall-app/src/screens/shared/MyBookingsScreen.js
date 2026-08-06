import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { bookingService } from "../../api/api";
import StatusBadge from "../../components/StatusBadge";
import { Card } from "../../components/Card";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

const STATUSES = ["", "quote_requested", "quote_received", "confirmed", "payment_done", "proof_submitted", "completed", "cancelled"];
const labelize = (s) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "All Status";

export default function MyBookingsScreen({ navigation, route }) {
  const isOwner = route?.params?.isOwner;
  const [status, setStatus] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s = status) => {
    setLoading(true);
    try {
      const fn = isOwner ? bookingService.getOwnerBookings : bookingService.getMyBookings;
      const { data } = await fn({ status: s || undefined });
      setBookings(data.data.bookings || []);
    } catch (e) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [status, isOwner]);

  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUSES}
          keyExtractor={(s) => s || "all"}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { setStatus(item); load(item); }}
              style={[styles.chip, status === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, status === item && styles.chipTextActive]}>{labelize(item)}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand500} style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 44 }}>📋</Text>
          <Text style={styles.emptyTitle}>Koi booking nahi mili</Text>
          <Text style={styles.emptySub}>Filter change karo ya nayi booking karo</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: b }) => (
            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={styles.thumb}>
                  {b.hoarding?.images?.[0] ? (
                    <Image source={{ uri: b.hoarding.images[0] }} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <Text style={{ fontSize: 22 }}>🪧</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.title} numberOfLines={1}>{b.hoarding?.title || "Hoarding"}</Text>
                  </View>
                  <StatusBadge status={b.status} />
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={11} color={colors.gray500} />
                    <Text style={styles.metaText}>{b.hoarding?.location?.city}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={11} color={colors.gray500} />
                    <Text style={styles.metaText}>{formatDate(b.startDate)} → {formatDate(b.endDate)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <Text style={styles.amount}>{formatCurrency(b.pricing?.totalAmount)}</Text>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => navigation.navigate("BookingDetail", { id: b._id })}
                    >
                      <Text style={styles.detailsBtnText}>Details</Text>
                      <Ionicons name="arrow-forward" size={13} color={colors.gray800} />
                    </TouchableOpacity>
                  </View>
                  {b.status === "quote_received" && <Text style={styles.alertOrange}>• Quote aaya hai! Review karo</Text>}
                  {b.status === "proof_submitted" && <Text style={styles.alertBlue}>• Proof verify karo</Text>}
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  chip: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.brand500, borderColor: colors.brand500 },
  chipText: { fontSize: 12, color: colors.gray700, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  emptySub: { fontSize: 13, color: colors.gray500 },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  title: { fontSize: 14, fontWeight: "700", color: colors.gray900, flex: 1, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 11, color: colors.gray500 },
  amount: { fontSize: 14, fontWeight: "800", color: colors.gray900 },
  detailsBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  detailsBtnText: { fontSize: 11.5, fontWeight: "700", color: colors.gray800 },
  alertOrange: { fontSize: 11, color: colors.brand600, fontWeight: "600", marginTop: 6 },
  alertBlue: { fontSize: 11, color: colors.blue, fontWeight: "600", marginTop: 6 },
});
