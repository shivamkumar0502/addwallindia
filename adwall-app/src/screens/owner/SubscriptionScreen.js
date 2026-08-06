import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import { formatDate } from "../../utils/format";
import Button from "../../components/Button";
import usePayment from "../../hooks/usePayment";
import { colors, radius } from "../../theme/colors";

const PLAN_ICONS = { free: "🆓", pro: "⚡", business: "👑" };
const PLAN_BORDER = { free: colors.gray200, pro: colors.brand400, business: "#facc15" };

export default function SubscriptionScreen() {
  const [subData, setSubData] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  const load = async () => {
    try {
      const [me, p] = await Promise.all([api.get("/subscriptions/me"), api.get("/subscriptions/plans")]);
      setSubData(me.data.data);
      setPlans(p.data.data);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const { pay } = usePayment();

  const handleUpgrade = async (planKey) => {
    setUpgrading(planKey);
    try {
      const { data } = await api.post("/subscriptions/upgrade", { plan: planKey });
      const orderData = data.data; // { orderId, amount, currency, keyId, plan, planDetails }
      const result = await pay({ orderData, description: `${orderData.planDetails?.name} Subscription` });
      if (!result) return;
      await api.post("/subscriptions/verify", {
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
        plan: planKey,
      });
      Alert.alert("Upgraded! 🎉", `${orderData.planDetails?.name} plan activate ho gaya!`);
      load();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Upgrade failed");
    } finally { setUpgrading(null); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  const currentPlan = subData?.plan || "free";
  const planDetails = subData?.planDetails;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pageTitle}>Subscription Plans</Text>
      <Text style={styles.pageSub}>Plan upgrade karo — zyada listings, kam commission, priority support</Text>

      <View style={[styles.currentBanner, { borderColor: PLAN_BORDER[currentPlan] }]}>
        <Text style={{ fontSize: 28 }}>{PLAN_ICONS[currentPlan]}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.currentTitle}>Current Plan: {planDetails?.name}</Text>
          {subData?.endDate && <Text style={styles.currentSub}>Valid until {formatDate(subData.endDate)}</Text>}
        </View>
        <View style={[styles.badge, currentPlan === "free" ? styles.badgeGray : styles.badgeBrand]}>
          <Text style={[styles.badgeText, currentPlan === "free" ? { color: colors.gray600 } : { color: colors.brand700 }]}>
            {currentPlan === "free" ? "Free" : "Active"}
          </Text>
        </View>
      </View>

      {plans && Object.entries(plans).map(([key, plan]) => {
        const isCurrent = key === currentPlan;
        const isPopular = key === "pro";
        return (
          <View key={key} style={[styles.planCard, { borderColor: PLAN_BORDER[key] }]}>
            {isPopular && <View style={styles.popularTag}><Text style={styles.popularTagText}>Most Popular</Text></View>}
            <View style={{ alignItems: "center", marginBottom: 14 }}>
              <Text style={{ fontSize: 30 }}>{PLAN_ICONS[key]}</Text>
              <Text style={styles.planName}>{plan.name}</Text>
              {plan.price === 0 ? (
                <Text style={styles.planPrice}>Free</Text>
              ) : (
                <Text style={styles.planPrice}>₹{plan.price}<Text style={styles.planPriceSuffix}>/month</Text></Text>
              )}
            </View>

            {[
              { icon: "🪧", text: plan.hoardingLimit >= 999 ? "Unlimited listings" : `${plan.hoardingLimit} listings`, enabled: true },
              { icon: "💸", text: `${plan.commissionPercent}% platform commission`, enabled: true },
              { icon: "👑", text: "Featured listings", enabled: plan.featuredAllowed },
              { icon: "📊", text: "Analytics access", enabled: plan.analyticsAccess },
              { icon: "🎯", text: "Priority support", enabled: plan.prioritySupport },
            ].map(({ icon, text, enabled }) => (
              <View key={text} style={styles.featureRow}>
                <Text style={[styles.featureIcon, !enabled && { opacity: 0.3 }]}>{icon}</Text>
                <Text style={[styles.featureText, !enabled && styles.featureTextDisabled]}>{text}</Text>
                {enabled && <Ionicons name="checkmark-circle" size={13} color="#22c55e" style={{ marginLeft: "auto" }} />}
              </View>
            ))}

            {isCurrent ? (
              <Button title="Current Plan ✓" variant="outline" disabled style={{ marginTop: 14 }} />
            ) : plan.price === 0 ? (
              <Button title="Downgrade" variant="outline" disabled style={{ marginTop: 14 }} />
            ) : (
              <Button title={upgrading === key ? "Processing..." : `Upgrade to ${plan.name}`} onPress={() => handleUpgrade(key)} loading={upgrading === key} style={{ marginTop: 14 }} />
            )}
          </View>
        );
      })}

      <View style={styles.commissionBox}>
        <Text style={styles.commissionTitle}>Commission Savings Calculator</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          {[
            { plan: "Free (12%)", commission: 1200, save: 0, color: colors.gray600 },
            { plan: "Pro (10%)", commission: 1000, save: 200, color: colors.brand600 },
            { plan: "Business+ (8%)", commission: 800, save: 400, color: "#ca8a04" },
          ].map((c) => (
            <View key={c.plan} style={styles.commissionCard}>
              <Text style={[styles.commissionPlan, { color: c.color }]}>{c.plan}</Text>
              <Text style={styles.commissionSub}>₹10,000 booking pe</Text>
              <Text style={styles.commissionValue}>₹{c.commission}</Text>
              {c.save > 0 && <Text style={styles.commissionSave}>Save ₹{c.save}</Text>}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  pageTitle: { fontSize: 22, fontWeight: "900", color: colors.gray900, textAlign: "center" },
  pageSub: { fontSize: 12.5, color: colors.gray500, textAlign: "center", marginTop: 6, marginBottom: 18 },
  currentBanner: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderRadius: radius.xl, padding: 14, marginBottom: 18, backgroundColor: colors.white },
  currentTitle: { fontSize: 13.5, fontWeight: "700", color: colors.gray900 },
  currentSub: { fontSize: 11.5, color: colors.gray500, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeGray: { backgroundColor: colors.gray100 },
  badgeBrand: { backgroundColor: colors.brand100 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  planCard: { borderWidth: 2, borderRadius: radius.xl, padding: 18, marginBottom: 16, backgroundColor: colors.white, position: "relative" },
  popularTag: { position: "absolute", top: -10, alignSelf: "center", backgroundColor: colors.brand500, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 3 },
  popularTagText: { color: colors.white, fontSize: 10, fontWeight: "700" },
  planName: { fontSize: 17, fontWeight: "900", color: colors.gray900, marginTop: 6 },
  planPrice: { fontSize: 26, fontWeight: "900", color: colors.gray900, marginTop: 6 },
  planPriceSuffix: { fontSize: 12, color: colors.gray400, fontWeight: "400" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  featureIcon: { fontSize: 14 },
  featureText: { fontSize: 12.5, color: colors.gray700 },
  featureTextDisabled: { color: colors.gray300, textDecorationLine: "line-through" },
  commissionBox: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 18, marginTop: 6, marginBottom: 20, borderWidth: 1, borderColor: colors.gray100 },
  commissionTitle: { fontSize: 14, fontWeight: "800", color: colors.gray900, textAlign: "center" },
  commissionCard: { flex: 1, backgroundColor: colors.gray50, borderRadius: radius.md, padding: 10, alignItems: "center" },
  commissionPlan: { fontSize: 11, fontWeight: "800" },
  commissionSub: { fontSize: 9.5, color: colors.gray400, marginTop: 3 },
  commissionValue: { fontSize: 15, fontWeight: "900", color: colors.gray900, marginTop: 6 },
  commissionSave: { fontSize: 10, color: "#16a34a", fontWeight: "700", marginTop: 2 },
});
