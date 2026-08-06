import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api, { hoardingService } from "../../api/api";
import { Card } from "../../components/Card";
import Button from "../../components/Button";
import usePayment from "../../hooks/usePayment";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

const BADGES = [
  { value: "hot", emoji: "🔥", label: "Hot", desc: "High demand area" },
  { value: "trending", emoji: "📈", label: "Trending", desc: "Most viewed" },
  { value: "premium", emoji: "👑", label: "Premium", desc: "Top quality" },
];
const PLANS = [
  { months: 1, label: "1 Month", price: 999, discount: 0 },
  { months: 3, label: "3 Months", price: 2699, discount: 10, popular: true },
  { months: 6, label: "6 Months", price: 4999, discount: 17 },
];

export default function FeaturedListingsScreen() {
  const [hoardings, setHoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [selectedBadge, setSelectedBadge] = useState("premium");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await hoardingService.getMyHoardings();
        setHoardings((data.data || []).filter((h) => h.verificationStatus === "verified"));
      } catch (e) { setHoardings([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const { pay } = usePayment();
  const [paying, setPaying] = useState(false);

  const handleFeature = async () => {
    if (!selected) return Alert.alert("Pehle hoarding select karo");
    setPaying(true);
    try {
      const { data } = await api.post("/featured/create-order", {
        hoardingId: selected._id, months: selectedPlan.months, badge: selectedBadge,
      });
      const orderData = data.data; // { orderId, amount, currency, keyId, ... }
      const result = await pay({ orderData, description: `Featured Listing — ${selected.title}` });
      if (!result) return;
      await api.post("/featured/verify", {
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
        hoardingId: selected._id, months: selectedPlan.months, badge: selectedBadge,
      });
      Alert.alert("Featured! 👑", "Hoarding ab featured hai, zyada visibility milegi!");
      setSelected(null);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Payment failed");
    } finally { setPaying(false); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <LinearGradient colors={[colors.brand500, colors.brand700]} style={styles.headerCard}>
        <Text style={styles.headerTitle}>👑 Featured Listings</Text>
        <Text style={styles.headerSub}>Apni hoarding ko top pe dikhao — zyada visibility, zyada bookings!</Text>
        <View style={styles.perkRow}>
          {["📈 5x Views", "⭐ Top Results", "⚡ Priority"].map((p) => (
            <View key={p} style={styles.perkChip}><Text style={styles.perkText}>{p}</Text></View>
          ))}
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Hoarding Select Karo</Text>
      {loading ? (
        <ActivityIndicator color={colors.brand500} style={{ marginVertical: 16 }} />
      ) : hoardings.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyText}>Koi verified hoarding nahi hai</Text></View>
      ) : (
        hoardings.map((h) => (
          <TouchableOpacity
            key={h._id}
            onPress={() => setSelected(h)}
            style={[styles.hoardingRow, selected?._id === h._id && styles.hoardingRowActive]}
          >
            <View style={styles.thumb}>
              {h.images?.[0] ? <Image source={{ uri: h.images[0] }} style={{ width: "100%", height: "100%" }} /> : <Text style={{ fontSize: 20 }}>🪧</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hoardingTitle} numberOfLines={1}>{h.title}</Text>
              <Text style={styles.hoardingCity}>{h.location?.city}</Text>
              {h.isFeatured && <Text style={styles.featuredNote}>Featured until {formatDate(h.featuredUntil)}</Text>}
            </View>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Badge Select Karo</Text>
      <View style={styles.badgeRow}>
        {BADGES.map((b) => (
          <TouchableOpacity key={b.value} onPress={() => setSelectedBadge(b.value)} style={[styles.badgeBox, selectedBadge === b.value && styles.badgeBoxActive]}>
            <Text style={{ fontSize: 20 }}>{b.emoji}</Text>
            <Text style={styles.badgeLabel}>{b.label}</Text>
            <Text style={styles.badgeDesc}>{b.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Plan Select Karo</Text>
      {PLANS.map((plan) => (
        <TouchableOpacity key={plan.months} onPress={() => setSelectedPlan(plan)} style={[styles.planBox, selectedPlan.months === plan.months && styles.planBoxActive]}>
          {plan.popular && <View style={styles.popularTag}><Text style={styles.popularTagText}>Most Popular</Text></View>}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={styles.planLabel}>{plan.label}</Text>
              {plan.discount > 0 && <Text style={styles.planDiscount}>Save {plan.discount}%</Text>}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.planPrice}>{formatCurrency(plan.price)}</Text>
              <Text style={styles.planPerMonth}>{formatCurrency(Math.round(plan.price / plan.months))}/month</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <Card style={{ marginTop: 14, backgroundColor: colors.gray50 }}>
        <Text style={styles.cardHeading}>Order Summary</Text>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Hoarding</Text><Text style={styles.summaryValue} numberOfLines={1}>{selected?.title || "Not selected"}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Duration</Text><Text style={styles.summaryValue}>{selectedPlan.label}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Badge</Text><Text style={styles.summaryValue}>{BADGES.find((b) => b.value === selectedBadge)?.label}</Text></View>
        <View style={[styles.summaryRow, styles.summaryTotal]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatCurrency(selectedPlan.price)}</Text></View>
        <Button title="👑 Feature My Hoarding" onPress={handleFeature} disabled={!selected} loading={paying} style={{ marginTop: 10 }} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: radius.xl, padding: 20, marginBottom: 18 },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: "900" },
  headerSub: { color: colors.brand100, fontSize: 13, marginTop: 6 },
  perkRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  perkChip: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  perkText: { color: colors.white, fontSize: 11 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.gray900, marginTop: 16, marginBottom: 10 },
  emptyBox: { borderWidth: 1, borderColor: colors.gray100, borderRadius: radius.lg, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 13, color: colors.gray400 },
  hoardingRow: { flexDirection: "row", gap: 10, borderWidth: 2, borderColor: colors.gray100, borderRadius: radius.lg, padding: 10, marginBottom: 10, alignItems: "center" },
  hoardingRowActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  thumb: { width: 56, height: 44, borderRadius: radius.sm, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  hoardingTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  hoardingCity: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  featuredNote: { fontSize: 10, color: colors.brand600, marginTop: 3, fontWeight: "600" },
  badgeRow: { flexDirection: "row", gap: 8 },
  badgeBox: { flex: 1, borderWidth: 2, borderColor: colors.gray100, borderRadius: radius.lg, alignItems: "center", padding: 10, gap: 2 },
  badgeBoxActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  badgeLabel: { fontSize: 11.5, fontWeight: "700", color: colors.gray800 },
  badgeDesc: { fontSize: 9, color: colors.gray400, textAlign: "center" },
  planBox: { borderWidth: 2, borderColor: colors.gray100, borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  planBoxActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  popularTag: { position: "absolute", top: -8, right: 12, backgroundColor: colors.brand500, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  popularTagText: { color: colors.white, fontSize: 9, fontWeight: "700" },
  planLabel: { fontSize: 14, fontWeight: "800", color: colors.gray900 },
  planDiscount: { fontSize: 11, color: "#16a34a", marginTop: 2 },
  planPrice: { fontSize: 18, fontWeight: "900", color: colors.brand600 },
  planPerMonth: { fontSize: 10.5, color: colors.gray400 },
  cardHeading: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  summaryLabel: { fontSize: 12.5, color: colors.gray600 },
  summaryValue: { fontSize: 12.5, color: colors.gray800, fontWeight: "600", maxWidth: "60%" },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.gray200, marginTop: 6, paddingTop: 10 },
  totalLabel: { fontSize: 13, fontWeight: "800", color: colors.gray900 },
  totalValue: { fontSize: 15, fontWeight: "900", color: colors.brand600 },
});
