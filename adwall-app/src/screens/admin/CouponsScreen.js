import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import { Card } from "../../components/Card";
import Button from "../../components/Button";
import { formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

const EMPTY = { code: "", description: "", type: "percentage", value: "", minOrderAmount: "", maxDiscount: "", usageLimit: "", userLimit: "1", validFrom: "", validUntil: "" };

export default function CouponsScreen() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/coupons/admin");
      setCoupons(data.data || []);
    } catch (e) { setCoupons([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.code || !form.value || !form.validFrom || !form.validUntil) {
      return Alert.alert("Code, value aur dates required hain");
    }
    setSaving(true);
    try {
      await api.post("/coupons/admin", {
        ...form,
        value: parseFloat(form.value),
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        userLimit: parseInt(form.userLimit) || 1,
      });
      Alert.alert("Created!", "Coupon ban gaya");
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Create failed");
    } finally { setSaving(false); }
  };

  const toggleCoupon = async (id) => {
    try { await api.patch(`/coupons/admin/${id}/toggle`); load(); } catch (e) { Alert.alert("Toggle failed"); }
  };

  const deleteCoupon = (id) => {
    Alert.alert("Delete Coupon", "Sure ho?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await api.delete(`/coupons/admin/${id}`); load(); } catch { Alert.alert("Delete failed"); } } },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Coupons</Text>
        <Button title={showForm ? "Cancel" : "+ New"} variant={showForm ? "outline" : "primary"} onPress={() => setShowForm(!showForm)} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />
      </View>

      {showForm && (
        <Card style={{ marginBottom: 16, borderColor: colors.brand300 }}>
          <Text style={styles.label}>Coupon Code *</Text>
          <TextInput style={styles.input} placeholder="WELCOME50" autoCapitalize="characters" value={form.code} onChangeText={(v) => set("code", v)} />

          <Text style={styles.label}>Description</Text>
          <TextInput style={styles.input} placeholder="First booking pe 50% off" value={form.description} onChangeText={(v) => set("description", v)} />

          <Text style={styles.label}>Discount Type</Text>
          <View style={styles.typeRow}>
            {["percentage", "flat"].map((t) => (
              <TouchableOpacity key={t} onPress={() => set("type", t)} style={[styles.typeChip, form.type === t && styles.typeChipActive]}>
                <Text style={[styles.typeChipText, form.type === t && { color: colors.white }]}>{t === "percentage" ? "% Percentage" : "₹ Flat"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Value * {form.type === "percentage" ? "(%)" : "(₹)"}</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder={form.type === "percentage" ? "20" : "500"} value={form.value} onChangeText={(v) => set("value", v)} />
            </View>
            {form.type === "percentage" && (
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Max Discount (₹)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="1000" value={form.maxDiscount} onChangeText={(v) => set("maxDiscount", v)} />
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Min Order (₹)</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="1000" value={form.minOrderAmount} onChangeText={(v) => set("minOrderAmount", v)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Usage Limit</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="100" value={form.usageLimit} onChangeText={(v) => set("usageLimit", v)} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Valid From * (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="2026-07-01" value={form.validFrom} onChangeText={(v) => set("validFrom", v)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Valid Until * (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="2026-08-01" value={form.validUntil} onChangeText={(v) => set("validUntil", v)} />
            </View>
          </View>

          <Button title={saving ? "Creating..." : "Create Coupon"} onPress={handleCreate} loading={saving} style={{ marginTop: 14 }} />
        </Card>
      )}

      {coupons.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="pricetag-outline" size={44} color={colors.gray200} />
          <Text style={styles.emptyText}>Koi coupon nahi hai abhi</Text>
        </View>
      ) : (
        coupons.map((c) => (
          <Card key={c._id} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.code}>{c.code}</Text>
                  <View style={[styles.statusDot, { backgroundColor: c.isActive ? "#22c55e" : colors.gray300 }]} />
                </View>
                <Text style={styles.desc}>{c.description}</Text>
                <Text style={styles.discount}>{c.type === "percentage" ? `${c.value}% off` : `₹${c.value} off`}{c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}</Text>
                <Text style={styles.meta}>Min order ₹{c.minOrderAmount || 0} • Used {c.usedCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ""}</Text>
                <Text style={styles.meta}>{formatDate(c.validFrom)} → {formatDate(c.validUntil)}</Text>
              </View>
              <Switch value={c.isActive} onValueChange={() => toggleCoupon(c._id)} trackColor={{ true: colors.brand500 }} />
            </View>
            <TouchableOpacity onPress={() => deleteCoupon(c._id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={13} color={colors.red} />
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { fontSize: 20, fontWeight: "800", color: colors.gray900 },
  label: { fontSize: 12.5, fontWeight: "600", color: colors.gray700, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, backgroundColor: colors.white },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: { flex: 1, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingVertical: 8, alignItems: "center" },
  typeChipActive: { backgroundColor: colors.brand500, borderColor: colors.brand500 },
  typeChipText: { fontSize: 12, fontWeight: "600", color: colors.gray700 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 6 },
  emptyText: { fontSize: 13, color: colors.gray400 },
  code: { fontSize: 15, fontWeight: "900", color: colors.gray900, letterSpacing: 0.5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  desc: { fontSize: 11.5, color: colors.gray500, marginTop: 2 },
  discount: { fontSize: 13, fontWeight: "700", color: colors.brand600, marginTop: 6 },
  meta: { fontSize: 10.5, color: colors.gray400, marginTop: 3 },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 10 },
  deleteText: { fontSize: 11, color: colors.red, fontWeight: "600" },
});
