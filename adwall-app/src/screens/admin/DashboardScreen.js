import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { analyticsService } from "../../api/api";
import { StatsCard, Card } from "../../components/Card";
import BarChart from "../../components/BarChart";
import { formatCurrency } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await analyticsService.getAdminStats();
        setStats(data.data);
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  const { overview, topCities } = stats || {};

  const quickActions = [
    { screen: "KYCReview", label: "KYC Review", count: overview?.pendingHoardings, icon: "🔍" },
    { screen: "HoardingsReview", label: "Verify Hoardings", count: overview?.pendingHoardings, icon: "✅" },
    { screen: "Bookings", label: "All Bookings", count: overview?.totalBookings, icon: "📋" },
    { screen: "Users", label: "Users", count: overview?.totalUsers, icon: "👥" },
    { screen: "Reports", label: "Reports & Export", icon: "📊" },
    { screen: "Coupons", label: "Coupons", icon: "🏷️" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pageTitle}>Admin Dashboard</Text>

      <View style={styles.statsGrid}>
        <StatsCard title="Total Users" value={overview?.totalUsers || 0} icon="👥" />
        <StatsCard title="Total Hoardings" value={overview?.totalHoardings || 0} icon="🪧" />
        <StatsCard title="Total Bookings" value={overview?.totalBookings || 0} icon="📋" />
        <StatsCard title="Platform Revenue" value={formatCurrency(overview?.platformRevenue || 0)} icon="💰" />
      </View>
      <Text style={styles.subNote}>{overview?.totalClients} clients, {overview?.totalOwners} owners • {overview?.pendingHoardings} pending verify • {overview?.activeBookings} active bookings</Text>

      <Text style={styles.sectionTitle}>Top Cities by Hoardings</Text>
      <Card>
        {!topCities?.length ? (
          <Text style={styles.emptyText}>Data nahi hai abhi</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart data={topCities.slice(0, 8).map((c) => ({ label: c._id, value: c.count }))} />
          </ScrollView>
        )}
      </Card>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        {quickActions.map((a) => (
          <TouchableOpacity key={a.screen} style={styles.quickCard} onPress={() => navigation.navigate(a.screen)}>
            <Text style={{ fontSize: 22 }}>{a.icon}</Text>
            <Text style={styles.quickLabel}>{a.label}</Text>
            {a.count !== undefined && <Text style={styles.quickCount}>{a.count} total</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.note}>Scroll karke saari cities dekho →</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  pageTitle: { fontSize: 20, fontWeight: "800", color: colors.gray900, marginBottom: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  subNote: { fontSize: 11, color: colors.gray400, marginTop: 2, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.gray900, marginTop: 14, marginBottom: 10 },
  emptyText: { fontSize: 13, color: colors.gray400, textAlign: "center", paddingVertical: 16 },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  cityName: { width: 90, fontSize: 12.5, fontWeight: "600", color: colors.gray800 },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.gray100, borderRadius: radius.full },
  barFill: { height: 8, backgroundColor: colors.brand500, borderRadius: radius.full },
  cityCount: { width: 26, fontSize: 12, color: colors.gray500, textAlign: "right" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  quickCard: { width: "48%", backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray100, padding: 14, alignItems: "center", marginBottom: 12, gap: 4 },
  quickLabel: { fontSize: 12.5, fontWeight: "700", color: colors.gray900, textAlign: "center" },
  quickCount: { fontSize: 10.5, color: colors.gray500 },
  note: { fontSize: 11, color: colors.gray400, textAlign: "center", marginTop: 8, marginBottom: 10 },
});
