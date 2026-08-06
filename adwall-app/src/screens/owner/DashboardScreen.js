import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { analyticsService, bookingService } from "../../api/api";
import { StatsCard, Card } from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

export default function OwnerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const kycPending = user?.kycStatus !== "verified";

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([analyticsService.getOwnerStats(), bookingService.getOwnerBookings({ limit: 5 })]);
      setStats(s.data.data);
      setBookings(b.data.data.bookings || []);
    } catch (e) {
      // ignore
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gray50 }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.brand500]} />}
    >
      {kycPending && (
        <View style={styles.kycWarning}>
          <Ionicons name="alert-circle" size={20} color="#b45309" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.kycTitle}>KYC Verification Pending</Text>
            <Text style={styles.kycSub}>Hoarding list karne ke liye pehle KYC complete karo.</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("KYC")} style={styles.kycBtn}>
            <Text style={styles.kycBtnText}>KYC Karo</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.sub}>Namaste, {user?.name?.split(" ")[0]}!</Text>
        </View>
        <TouchableOpacity
          disabled={kycPending}
          onPress={() => navigation.navigate("AddHoarding")}
          style={[styles.addBtn, kycPending && { opacity: 0.5 }]}
        >
          <Ionicons name="add" size={16} color={colors.white} />
          <Text style={styles.addBtnText}>Add Hoarding</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand500} style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.statsGrid}>
          <StatsCard title="Total Hoardings" value={stats?.overview?.totalHoardings || 0} icon="🪧" />
          <StatsCard title="Active Listings" value={stats?.overview?.activeHoardings || 0} icon="✅" />
          <StatsCard title="Total Bookings" value={stats?.overview?.totalBookings || 0} icon="📋" />
          <StatsCard title="Total Earnings" value={formatCurrency(stats?.overview?.totalEarnings || 0)} icon="💰" />
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Booking Requests</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Bookings")}>
          <Text style={styles.link}>Sabhi dekho →</Text>
        </TouchableOpacity>
      </View>

      <Card>
        {bookings.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text style={{ fontSize: 28 }}>📭</Text>
            <Text style={styles.sub}>Abhi koi booking request nahi hai</Text>
          </View>
        ) : (
          bookings.map((b, idx) => (
            <TouchableOpacity
              key={b._id}
              onPress={() => navigation.navigate("BookingDetail", { id: b._id })}
              style={[styles.bookingRow, idx !== bookings.length - 1 && styles.bookingRowBorder]}
            >
              <View style={styles.avatar}><Text style={styles.avatarText}>{b.client?.name?.[0]?.toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingTitle}>{b.client?.name}</Text>
                <Text style={styles.bookingSub}>{formatDate(b.startDate)} → {formatDate(b.endDate)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge status={b.status} />
                <Text style={styles.bookingAmount}>{formatCurrency(b.pricing?.totalAmount)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kycWarning: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde68a", borderRadius: radius.lg, padding: 14, marginBottom: 16 },
  kycTitle: { fontSize: 13, fontWeight: "700", color: "#92400e" },
  kycSub: { fontSize: 11.5, color: "#a16207", marginTop: 2 },
  kycBtn: { borderWidth: 1, borderColor: "#fbbf24", borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, alignSelf: "center" },
  kycBtnText: { fontSize: 11, fontWeight: "700", color: "#92400e" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "800", color: colors.gray900 },
  sub: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brand500, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9 },
  addBtnText: { fontSize: 12, fontWeight: "700", color: colors.white },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.gray900 },
  link: { fontSize: 12.5, color: colors.brand500, fontWeight: "600" },
  bookingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  bookingRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.gray200, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "700", color: colors.gray600 },
  bookingTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  bookingSub: { fontSize: 11.5, color: colors.gray500, marginTop: 1 },
  bookingAmount: { fontSize: 11, color: colors.gray500, marginTop: 3 },
});
