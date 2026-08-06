import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { analyticsService } from "../../api/api";
import { StatsCard, Card } from "../../components/Card";
import DonutChart from "../../components/DonutChart";
import { formatCurrency } from "../../utils/format";
import { colors } from "../../theme/colors";

export default function AnalyticsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await analyticsService.getClientStats();
        setStats(data.data);
      } catch (e) {
        // ignore
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  const summary = [
    { label: "Total Campaigns", value: stats?.totalBookings || 0, icon: "📢" },
    { label: "Active Campaigns", value: stats?.activeBookings || 0, icon: "🟢" },
    { label: "Completed Campaigns", value: stats?.completedBookings || 0, icon: "✅" },
    { label: "Total Investment", value: formatCurrency(stats?.totalSpend || 0), icon: "💰" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.statsGrid}>
        <StatsCard title="Total Bookings" value={stats?.totalBookings || 0} icon="📋" />
        <StatsCard title="Active" value={stats?.activeBookings || 0} icon="🟢" />
        <StatsCard title="Completed" value={stats?.completedBookings || 0} icon="✅" />
        <StatsCard title="Total Spend" value={formatCurrency(stats?.totalSpend || 0)} icon="💰" />
      </View>

      <Text style={styles.sectionTitle}>Campaign Summary</Text>
      <Card>
        {summary.map((s, idx) => (
          <View key={s.label} style={[styles.row, idx !== summary.length - 1 && styles.rowBorder]}>
            <Text style={styles.rowLabel}>{s.icon} {s.label}</Text>
            <Text style={styles.rowValue}>{s.value}</Text>
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Booking Status Breakdown</Text>
      <Card>
        <DonutChart
          data={[
            { label: "Active", value: stats?.activeBookings || 0 },
            { label: "Completed", value: stats?.completedBookings || 0 },
            { label: "Other", value: Math.max((stats?.totalBookings || 0) - (stats?.activeBookings || 0) - (stats?.completedBookings || 0), 0) },
          ]}
        />
      </Card>

      <Text style={styles.note}>Note: monthly spend trend line Phase 5 mein add hoga.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.gray900, marginBottom: 10, marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  rowLabel: { fontSize: 13, color: colors.gray600 },
  rowValue: { fontSize: 14, fontWeight: "800", color: colors.gray900 },
  note: { fontSize: 11, color: colors.gray400, textAlign: "center", marginTop: 16 },
});
