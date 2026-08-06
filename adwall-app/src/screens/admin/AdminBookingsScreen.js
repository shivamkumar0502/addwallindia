import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { bookingService } from "../../api/api";
import { Card } from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

const STATUSES = ["", "quote_requested", "confirmed", "payment_done", "proof_submitted", "completed", "cancelled", "disputed"];
const labelize = (s) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "All Status";

export default function AdminBookingsScreen() {
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s = status) => {
    setLoading(true);
    try {
      const { data: res } = await bookingService.adminGetAll({ status: s || undefined, limit: 30 });
      setData(res.data);
    } catch (e) { setData(null); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <View style={styles.headerBar}>
        <Text style={styles.totalText}>{data?.total || 0} total bookings</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUSES}
          keyExtractor={(s) => s || "all"}
          contentContainerStyle={{ gap: 8, marginTop: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setStatus(item); load(item); }} style={[styles.chip, status === item && styles.chipActive]}>
              <Text style={[styles.chipText, status === item && styles.chipTextActive]}>{labelize(item)}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand500} style={{ marginTop: 40 }} />
      ) : !data?.bookings?.length ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 40 }}>📋</Text>
          <Text style={styles.emptyText}>Koi booking nahi mili</Text>
        </View>
      ) : (
        <FlatList
          data={data.bookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: b }) => (
            <Card style={[{ marginBottom: 12 }, b.status === "disputed" && styles.disputedCard]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Client</Text>
                  <Text style={styles.value}>{b.client?.name}</Text>
                  <Text style={styles.subtle}>{b.client?.email}</Text>
                </View>
                <StatusBadge status={b.status} />
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Owner</Text>
                <Text style={styles.value}>{b.owner?.name}</Text>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Hoarding</Text>
                <Text style={styles.value} numberOfLines={1}>{b.hoarding?.title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={11} color={colors.gray400} />
                  <Text style={styles.subtle}>{b.hoarding?.location?.city}</Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={11} color={colors.gray400} />
                  <Text style={styles.subtle}>{formatDate(b.startDate)} → {formatDate(b.endDate)}</Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(b.pricing?.totalAmount)}</Text>
              </View>

              {b.status === "disputed" && <Text style={styles.disputedNote}>⚠️ Needs attention</Text>}
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: { backgroundColor: colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  totalText: { fontSize: 12.5, color: colors.gray500 },
  chip: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.brand500, borderColor: colors.brand500 },
  chipText: { fontSize: 11.5, color: colors.gray700, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 6 },
  emptyText: { fontSize: 13, color: colors.gray400 },
  disputedCard: { borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
  label: { fontSize: 10, color: colors.gray400 },
  value: { fontSize: 13, fontWeight: "700", color: colors.gray900, marginTop: 2 },
  subtle: { fontSize: 11, color: colors.gray400 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, borderTopWidth: 1, borderTopColor: colors.gray100, paddingTop: 8 },
  amount: { fontSize: 13.5, fontWeight: "800", color: colors.gray900 },
  disputedNote: { fontSize: 11, color: colors.red, marginTop: 6, fontWeight: "600" },
});
