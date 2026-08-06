import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/api";
import { Card } from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

export default function AdminPaymentsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get("/payments/admin/all");
        setData(res.data);
      } catch (e) { setData(null); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <FlatList
        data={data?.payments || []}
        keyExtractor={(p) => p._id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            <Text style={styles.pageTitle}>Payments</Text>
            {data?.summary && (
              <View style={styles.summaryRow}>
                <LinearGradient colors={["#22c55e", "#15803d"]} style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total GMV</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(data.summary.totalGMV)}</Text>
                </LinearGradient>
                <LinearGradient colors={[colors.brand500, colors.brand700]} style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Platform Commission</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(data.summary.totalCommission)}</Text>
                </LinearGradient>
              </View>
            )}
          </>
        }
        renderItem={({ item: p }) => (
          <Card style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Client → Owner</Text>
                <Text style={styles.value}>{p.client?.name} → {p.owner?.name}</Text>
              </View>
              <StatusBadge status={p.status} />
            </View>
            <View style={styles.amountsRow}>
              <View style={{ alignItems: "center" }}><Text style={styles.amtLabel}>Amount</Text><Text style={styles.amtValue}>{formatCurrency(p.amount)}</Text></View>
              <View style={{ alignItems: "center" }}><Text style={styles.amtLabel}>Commission</Text><Text style={[styles.amtValue, { color: colors.brand600 }]}>{formatCurrency(p.platformFee)}</Text></View>
              <View style={{ alignItems: "center" }}><Text style={styles.amtLabel}>Owner Payout</Text><Text style={[styles.amtValue, { color: "#16a34a" }]}>{formatCurrency(p.ownerPayout)}</Text></View>
            </View>
            <Text style={styles.dateText}>{formatDate(p.createdAt)}</Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Koi payment nahi mila</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  pageTitle: { fontSize: 20, fontWeight: "800", color: colors.gray900, marginBottom: 14 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: radius.lg, padding: 14 },
  summaryLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11.5 },
  summaryValue: { color: colors.white, fontSize: 18, fontWeight: "900", marginTop: 4 },
  label: { fontSize: 10, color: colors.gray400 },
  value: { fontSize: 12.5, fontWeight: "700", color: colors.gray900, marginTop: 2 },
  amountsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, borderTopWidth: 1, borderTopColor: colors.gray100, paddingTop: 10 },
  amtLabel: { fontSize: 9.5, color: colors.gray400 },
  amtValue: { fontSize: 12.5, fontWeight: "800", color: colors.gray900, marginTop: 2 },
  dateText: { fontSize: 10, color: colors.gray400, marginTop: 8, textAlign: "right" },
  emptyText: { textAlign: "center", color: colors.gray400, marginTop: 40 },
});
