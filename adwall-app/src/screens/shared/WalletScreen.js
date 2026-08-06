import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { walletService } from "../../api/api";
import { Card } from "../../components/Card";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

export default function WalletScreen() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [w, t] = await Promise.all([walletService.getWallet(), walletService.getTransactions({ limit: 20 })]);
        setWallet(w.data.data);
        setTransactions(t.data.data.transactions || []);
      } catch (e) {
        // ignore
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <LinearGradient colors={[colors.brand500, colors.brand700]} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>{formatCurrency(wallet?.balance || 0)}</Text>
      </LinearGradient>

      <View style={styles.row2}>
        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="time-outline" size={13} color={colors.gray500} />
            <Text style={styles.miniLabel}>Pending (Escrow)</Text>
          </View>
          <Text style={[styles.miniValue, { color: "#a16207" }]}>{formatCurrency(wallet?.pendingBalance || 0)}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={styles.miniLabel}>Total Earned / Spent</Text>
          <Text style={[styles.miniValue, { color: "#16a34a" }]}>{formatCurrency((wallet?.totalEarned || wallet?.totalSpent) || 0)}</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Transaction History</Text>
      <Card>
        {transactions.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text style={{ fontSize: 28 }}>💳</Text>
            <Text style={styles.miniLabel}>Abhi koi transaction nahi hai</Text>
          </View>
        ) : (
          transactions.map((tx, idx) => (
            <View key={tx._id} style={[styles.txRow, idx !== transactions.length - 1 && styles.txBorder]}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === "credit" ? "#dcfce7" : "#fee2e2" }]}>
                <Ionicons name={tx.type === "credit" ? "trending-up" : "trending-down"} size={16} color={tx.type === "credit" ? "#16a34a" : "#dc2626"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                <Text style={styles.txMeta}>{formatDate(tx.createdAt)} • {tx.category?.replace(/_/g, " ")}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.txAmount, { color: tx.type === "credit" ? "#16a34a" : "#dc2626" }]}>
                  {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                </Text>
                <Text style={styles.txMeta}>Bal: {formatCurrency(tx.balanceAfter)}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  balanceCard: { borderRadius: radius.xl, padding: 20, marginBottom: 12 },
  balanceLabel: { color: colors.brand100, fontSize: 13 },
  balanceValue: { color: colors.white, fontSize: 30, fontWeight: "900", marginTop: 4 },
  row2: { flexDirection: "row", gap: 10, marginBottom: 18 },
  miniLabel: { fontSize: 11.5, color: colors.gray500 },
  miniValue: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.gray900, marginBottom: 10 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  txIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  txMeta: { fontSize: 10.5, color: colors.gray400, marginTop: 2 },
  txAmount: { fontSize: 13, fontWeight: "700" },
});
