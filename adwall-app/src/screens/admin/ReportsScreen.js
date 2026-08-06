import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import api from "../../api/api";
import { StatsCard, Card } from "../../components/Card";
import BarChart from "../../components/BarChart";
import { formatCurrency } from "../../utils/format";
import { colors } from "../../theme/colors";

const REPORT_TYPES = [
  { key: "bookings", label: "Bookings", icon: "📋" },
  { key: "payments", label: "Payments", icon: "💰" },
  { key: "users", label: "Users", icon: "👥" },
  { key: "hoardings", label: "Hoardings", icon: "🪧" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportsScreen() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/reports/summary");
        setSummary(data.data);
      } catch (e) { setSummary(null); }
      finally { setLoading(false); }
    })();
  }, []);

  const exportCSV = async (type) => {
    setExporting(type);
    try {
      // Backend sends raw CSV text (Content-Type: text/csv), not JSON
      const res = await api.get(`/reports/${type}`, { responseType: "text", transformResponse: [(d) => d] });
      const csv = res.data;
      if (!csv || csv.length < 5) { Alert.alert("Empty", "Is report me abhi data nahi hai"); return; }

      const fileUri = FileSystem.documentDirectory + `adwall_${type}_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: `${type} report` });
      } else {
        Alert.alert("Saved", `File saved: ${fileUri}`);
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Export failed");
    } finally { setExporting(""); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  const totals = summary?.totals || {};
  const monthlyData = (summary?.monthlyData || []).map((m) => ({ label: MONTHS[m._id.month - 1], value: m.totalRevenue }));
  const yearRevenue = (summary?.monthlyData || []).reduce((s, m) => s + m.totalRevenue, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pageTitle}>Reports ({summary?.year || new Date().getFullYear()})</Text>
      <Text style={styles.pageSub}>Business summary aur exportable reports</Text>

      <View style={styles.statsGrid}>
        <StatsCard title="Year Revenue" value={formatCurrency(yearRevenue)} icon="💰" />
        <StatsCard title="Completed Bookings" value={totals.totalBookings || 0} icon="📋" />
        <StatsCard title="Total Clients" value={totals.totalUsers || 0} icon="👤" />
        <StatsCard title="Verified Hoardings" value={totals.totalHoardings || 0} icon="🪧" />
      </View>

      {monthlyData.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          <Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart data={monthlyData} />
            </ScrollView>
          </Card>
        </>
      )}

      <Text style={styles.sectionTitle}>Export Reports (CSV)</Text>
      {REPORT_TYPES.map((r) => (
        <TouchableOpacity key={r.key} onPress={() => exportCSV(r.key)} style={styles.exportRow} disabled={!!exporting}>
          <Text style={{ fontSize: 20 }}>{r.icon}</Text>
          <Text style={styles.exportLabel}>{r.label} Report</Text>
          {exporting === r.key ? <ActivityIndicator size="small" color={colors.brand500} /> : <Ionicons name="download-outline" size={18} color={colors.gray400} />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  pageTitle: { fontSize: 20, fontWeight: "800", color: colors.gray900 },
  pageSub: { fontSize: 12.5, color: colors.gray500, marginTop: 3, marginBottom: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.gray900, marginTop: 16, marginBottom: 10 },
  exportRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.gray100, padding: 14, marginBottom: 10 },
  exportLabel: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.gray900 },
});
