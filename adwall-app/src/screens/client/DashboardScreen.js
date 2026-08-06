import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { analyticsService, bookingService } from "../../api/api";
import { StatsCard, Card } from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

export default function ClientDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([
        analyticsService.getClientStats(),
        bookingService.getMyBookings({ limit: 5 }),
      ]);
      setStats(s.data.data);
      setBookings(b.data.data.bookings || []);
    } catch (e) {
      // ignore, empty states will show
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gray50 }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand500]} />}
    >
      <Text style={styles.welcome}>Namaste, {user?.name?.split(" ")[0]}! 👋</Text>
      <Text style={styles.sub}>Aaj kaunsa campaign plan kar rahe ho?</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionOutline]} onPress={() => navigation.navigate("Search")}>
          <Ionicons name="search" size={15} color={colors.gray800} />
          <Text style={styles.actionOutlineText}>Search Hoardings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={() => navigation.navigate("Campaigns")}>
          <Ionicons name="megaphone" size={15} color={colors.white} />
          <Text style={styles.actionPrimaryText}>Broadcast</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand500} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.statsGrid}>
          <StatsCard title="Total Bookings" value={stats?.totalBookings || 0} icon="📋" />
          <StatsCard title="Active Campaigns" value={stats?.activeBookings || 0} icon="📢" />
          <StatsCard title="Completed" value={stats?.completedBookings || 0} icon="✅" />
          <StatsCard title="Total Spend" value={formatCurrency(stats?.totalSpend || 0)} icon="💰" />
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        <TouchableOpacity onPress={() => navigation.navigate("MyBookings")}>
          <Text style={styles.link}>Sabhi dekho →</Text>
        </TouchableOpacity>
      </View>

      <Card>
        {bookings.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text style={{ fontSize: 28 }}>📋</Text>
            <Text style={styles.sub}>Abhi koi booking nahi hai</Text>
          </View>
        ) : (
          bookings.map((b, idx) => (
            <TouchableOpacity
              key={b._id}
              onPress={() => navigation.navigate("BookingDetail", { id: b._id })}
              style={[styles.bookingRow, idx !== bookings.length - 1 && styles.bookingRowBorder]}
            >
              <View style={styles.bookingThumb}>
                {b.hoarding?.images?.[0] ? (
                  <Image source={{ uri: b.hoarding.images[0] }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Text style={{ fontSize: 16 }}>🪧</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingTitle} numberOfLines={1}>{b.hoarding?.title}</Text>
                <Text style={styles.bookingSub}>{b.hoarding?.location?.city} • {formatDate(b.startDate)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge status={b.status} />
                <Text style={styles.bookingAmount}>{formatCurrency(b.pricing?.totalAmount)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Quick Actions</Text>
      {[
        { screen: "Campaigns", icon: "📢", title: "Broadcast Campaign", desc: "Multiple owners ko ek saath broadcast karo" },
        { screen: "Wallet", icon: "💰", title: "Wallet", desc: "Transaction history aur balance dekho" },
        { screen: "Analytics", icon: "📊", title: "Analytics", desc: "Campaign performance track karo" },
      ].map((a) => (
        <TouchableOpacity key={a.screen} style={styles.quickAction} onPress={() => navigation.navigate(a.screen)}>
          <View style={styles.quickIconWrap}><Text style={{ fontSize: 20 }}>{a.icon}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>{a.title}</Text>
            <Text style={styles.bookingSub}>{a.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  welcome: { fontSize: 20, fontWeight: "800", color: colors.gray900 },
  sub: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: radius.md },
  actionOutline: { borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.white },
  actionOutlineText: { fontSize: 12.5, fontWeight: "700", color: colors.gray800 },
  actionPrimary: { backgroundColor: colors.brand500 },
  actionPrimaryText: { fontSize: 12.5, fontWeight: "700", color: colors.white },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 18 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.gray900 },
  link: { fontSize: 12.5, color: colors.brand500, fontWeight: "600" },
  bookingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  bookingRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  bookingThumb: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  bookingTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  bookingSub: { fontSize: 11.5, color: colors.gray500, marginTop: 1 },
  bookingAmount: { fontSize: 11, color: colors.gray500, marginTop: 3 },
  quickAction: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray100, padding: 14, marginBottom: 10 },
  quickIconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brand50, alignItems: "center", justifyContent: "center" },
  quickTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
});
