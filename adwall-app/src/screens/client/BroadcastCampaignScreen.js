import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { campaignService } from "../../api/api";
import { Card } from "../../components/Card";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

const CATEGORIES = ["hoarding", "billboard", "led_screen", "wall_painting", "bus_branding", "auto_branding", "metro_ads", "airport_ads", "mall_branding", "cinema_ads"];
const labelize = (c) => c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const EMPTY_FORM = { title: "", description: "", cities: [], categories: [], budgetMin: "", budgetMax: "", startDate: "", endDate: "", targetAudience: "", additionalNotes: "" };

export default function BroadcastCampaignScreen() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  const load = async () => {
    setCampaignsLoading(true);
    try {
      const { data } = await campaignService.getMyCampaigns();
      setCampaigns(data.data || []);
    } catch (e) { setCampaigns([]); }
    finally { setCampaignsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addCity = () => {
    if (cityInput.trim() && !form.cities.includes(cityInput.trim())) {
      setForm((f) => ({ ...f, cities: [...f.cities, cityInput.trim()] }));
      setCityInput("");
    }
  };

  const toggleCategory = (cat) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter((c) => c !== cat) : [...f.categories, cat],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.budgetMax || !form.startDate || !form.endDate) {
      return Alert.alert("Title, budget aur dates required hain");
    }
    if (form.cities.length === 0) return Alert.alert("Kum se kum ek city add karo");
    setLoading(true);
    try {
      await campaignService.create({ ...form, budgetMin: parseFloat(form.budgetMin) || 0, budgetMax: parseFloat(form.budgetMax) });
      Alert.alert("Broadcast ho gaya!", "Owners ko notify kar diya.");
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Campaign failed");
    } finally { setLoading(false); }
  };

  const closeCampaign = async (id) => {
    try { await campaignService.close(id); load(); } catch (e) { Alert.alert("Close failed"); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Broadcast Campaign</Text>
        <Text style={styles.headerSub}>Ek saath multiple owners ko request bhejo</Text>
      </View>
      <Button
        title={showForm ? "Cancel" : "+ New Campaign"}
        variant={showForm ? "outline" : "primary"}
        onPress={() => setShowForm(!showForm)}
        style={{ marginBottom: 16 }}
      />

      {showForm && (
        <Card style={{ marginBottom: 18, borderColor: colors.brand300 }}>
          <Text style={styles.cardHeading}>📢 Campaign Details</Text>

          <Text style={styles.label}>Campaign Title *</Text>
          <TextInput style={styles.input} placeholder="e.g. Summer Sale Campaign 2026" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, { height: 60 }]} multiline placeholder="Campaign ke baare mein batao..." value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} />

          <Text style={styles.label}>Target Cities *</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="City name (e.g. Delhi)" value={cityInput} onChangeText={setCityInput} onSubmitEditing={addCity} />
            <TouchableOpacity onPress={addCity} style={styles.addBtn}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
          </View>
          {form.cities.length > 0 && (
            <View style={styles.chipsWrap}>
              {form.cities.map((c) => (
                <View key={c} style={styles.cityChip}>
                  <Text style={styles.cityChipText}>📍 {c}</Text>
                  <TouchableOpacity onPress={() => setForm((f) => ({ ...f, cities: f.cities.filter((x) => x !== c) }))}>
                    <Ionicons name="close" size={12} color={colors.brand700} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.label}>Ad Categories (optional)</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} onPress={() => toggleCategory(c)} style={[styles.catChip, form.categories.includes(c) && styles.catChipActive]}>
                <Text style={[styles.catChipText, form.categories.includes(c) && { color: colors.white }]}>{labelize(c)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Min Budget (₹)</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="5000" value={form.budgetMin} onChangeText={(v) => setForm((f) => ({ ...f, budgetMin: v }))} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Max Budget (₹) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="50000" value={form.budgetMax} onChangeText={(v) => setForm((f) => ({ ...f, budgetMax: v }))} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Start Date * (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="2026-08-01" value={form.startDate} onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>End Date * (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="2026-09-01" value={form.endDate} onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))} />
            </View>
          </View>

          <Text style={styles.label}>Target Audience</Text>
          <TextInput style={styles.input} placeholder="e.g. Young professionals, Families" value={form.targetAudience} onChangeText={(v) => setForm((f) => ({ ...f, targetAudience: v }))} />

          <Text style={styles.label}>Additional Notes</Text>
          <TextInput style={[styles.input, { height: 60 }]} multiline placeholder="Koi special requirements..." value={form.additionalNotes} onChangeText={(v) => setForm((f) => ({ ...f, additionalNotes: v }))} />

          <Button title={loading ? "Broadcasting..." : "🚀 Broadcast to All Matching Owners"} onPress={handleSubmit} loading={loading} style={{ marginTop: 14 }} />
        </Card>
      )}

      {campaignsLoading ? (
        <ActivityIndicator color={colors.brand500} style={{ marginTop: 20 }} />
      ) : campaigns.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Ionicons name="megaphone-outline" size={40} color={colors.gray200} />
          <Text style={{ color: colors.gray500, fontWeight: "600", marginTop: 8 }}>Koi campaign nahi hai abhi</Text>
          <Text style={{ color: colors.gray400, fontSize: 12, marginTop: 2 }}>Upar "New Campaign" pe tap karo</Text>
        </View>
      ) : (
        <>
          <Text style={styles.cardHeading}>My Campaigns ({campaigns.length})</Text>
          {campaigns.map((c) => (
            <Card key={c._id} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.campaignTitle}>{c.title}</Text>
                    <StatusBadge status={c.status} />
                  </View>
                  <Text style={styles.campaignMeta}>📍 {c.requirements?.cities?.join(", ")}</Text>
                  <Text style={styles.campaignMeta}>💰 Max {formatCurrency(c.requirements?.budget?.max)}</Text>
                  <Text style={styles.campaignMeta}>📅 {formatDate(c.requirements?.startDate)} → {formatDate(c.requirements?.endDate)}</Text>
                  <Text style={styles.campaignStats}>{c.totalQuotes || 0} quotes received • {c.aiMatchedHoardings?.length || 0} matched</Text>
                </View>
                {c.status === "active" && (
                  <TouchableOpacity onPress={() => closeCampaign(c._id)} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.gray900 },
  headerSub: { fontSize: 12.5, color: colors.gray500, marginTop: 2 },
  cardHeading: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 10 },
  label: { fontSize: 12.5, fontWeight: "600", color: colors.gray700, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, backgroundColor: colors.white },
  addBtn: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 16, justifyContent: "center" },
  addBtnText: { fontSize: 12.5, fontWeight: "600", color: colors.gray800 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  cityChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.brand100, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  cityChipText: { fontSize: 11, color: colors.brand700, fontWeight: "600" },
  catChip: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  catChipActive: { backgroundColor: colors.brand500, borderColor: colors.brand500 },
  catChipText: { fontSize: 11, color: colors.gray700, fontWeight: "600" },
  campaignTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  campaignMeta: { fontSize: 11, color: colors.gray500, marginTop: 3 },
  campaignStats: { fontSize: 11.5, color: colors.brand600, fontWeight: "600", marginTop: 6 },
  closeBtn: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  closeBtnText: { fontSize: 11, fontWeight: "700", color: colors.gray700 },
});
