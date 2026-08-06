import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import HoardingCard from "../../components/HoardingCard";
import { colors, radius } from "../../theme/colors";
import { hoardingService } from "../../api/api";

const CATEGORIES = [
  { label: "Hoardings", icon: "🪧", value: "hoarding" },
  { label: "LED Screens", icon: "💡", value: "led_screen" },
  { label: "Bus Branding", icon: "🚌", value: "bus_branding" },
  { label: "Mall Branding", icon: "🏪", value: "mall_branding" },
  { label: "Airport Ads", icon: "✈️", value: "airport_ads" },
  { label: "Metro Ads", icon: "🚇", value: "metro_ads" },
  { label: "Cinema Ads", icon: "🎬", value: "cinema_ads" },
  { label: "Wall Painting", icon: "🎨", value: "wall_painting" },
];

const STATS = [
  { value: "10,000+", label: "Ad Spaces" },
  { value: "500+", label: "Cities" },
  { value: "5,000+", label: "Advertisers" },
  { value: "₹50Cr+", label: "Campaign Value" },
];

const POPULAR_CITIES = ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai"];

export default function HomeScreen({ navigation }) {
  const [city, setCity] = useState("");
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await hoardingService.search({ limit: 4, featured: true });
        setFeatured(data?.data?.hoardings || data?.data || []);
      } catch (e) {
        if (!e.response) setConnectionError(true); // no response at all = can't reach backend
      } finally {
        setLoadingFeatured(false);
      }
    })();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} showsVerticalScrollIndicator={false}>
      {connectionError && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionBannerText}>
            ⚠️ Backend se connect nahi ho paya. App.json me apiUrl check karo aur backend chal raha hai ya nahi confirm karo.
          </Text>
        </View>
      )}
      {/* HERO */}
      <LinearGradient colors={[colors.gray900, colors.gray800, colors.brand900]} style={styles.hero}>
        <View style={styles.heroPill}>
          <Ionicons name="flash" size={13} color={colors.brand400} />
          <Text style={styles.heroPillText}>India ka #1 Outdoor Advertising Marketplace</Text>
        </View>
        <Text style={styles.heroTitle}>Outdoor Ads Book Karo{"\n"}<Text style={{ color: colors.brand400 }}>Sirf 3 Steps Mein</Text></Text>
        <Text style={styles.heroSub}>Hoardings, LED Screens, Metro, Airport — pura India cover karo ek hi platform se.</Text>

        <View style={{ marginTop: 24, gap: 10 }}>
          <Input
            icon={<Ionicons name="location-outline" size={16} color={colors.gray400} />}
            placeholder="City type karo (Delhi, Mumbai...)"
            value={city}
            onChangeText={setCity}
          />
          <Button
            title="Search"
            icon={<Ionicons name="search" size={18} color={colors.white} />}
            onPress={() => navigation.navigate("Search", { city })}
          />
        </View>

        <View style={styles.popularWrap}>
          <Text style={styles.popularLabel}>Popular:</Text>
          {POPULAR_CITIES.map((c) => (
            <TouchableOpacity key={c} onPress={() => navigation.navigate("Search", { city: c })} style={styles.cityChip}>
              <Text style={styles.cityChipText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* STATS */}
      <View style={styles.statsBar}>
        {STATS.map(({ value, label }) => (
          <View key={label} style={styles.statItem}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* FEATURED HOARDINGS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Hoardings</Text>
        {loadingFeatured ? (
          <ActivityIndicator color={colors.brand500} style={{ marginTop: 20 }} />
        ) : featured.length === 0 ? (
          <Text style={styles.subtleCenter}>Abhi koi featured listing nahi hai</Text>
        ) : (
          featured.map((h) => (
            <HoardingCard key={h._id} hoarding={h} onPress={() => navigation.navigate("HoardingDetail", { id: h._id })} />
          ))
        )}
      </View>

      {/* CATEGORIES */}
      <View style={[styles.section, { backgroundColor: colors.gray50 }]}>
        <Text style={styles.sectionTitle}>Ad Formats Explore Karo</Text>
        <Text style={styles.sectionSub}>15+ categories, pura India coverage</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(({ label, icon, value }) => (
            <TouchableOpacity
              key={value}
              style={styles.categoryTile}
              onPress={() => navigation.navigate("Search", { category: value })}
            >
              <Text style={{ fontSize: 26 }}>{icon}</Text>
              <Text style={styles.categoryLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* HOW IT WORKS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kaise Kaam Karta Hai?</Text>
        {[
          { step: "1", title: "Search & Compare", desc: "City, budget filter karo. 10K+ verified ad spaces browse karo.", icon: "🔍" },
          { step: "2", title: "Quote Maango", desc: "Owner se quote request karo ya direct book karo.", icon: "📩" },
          { step: "3", title: "Secure Payment", desc: "Razorpay escrow se pay karo. Aap approve karne pe hi release hoga.", icon: "🔒" },
          { step: "4", title: "Campaign Track Karo", desc: "Installation proof dekho, approve karo, analytics track karo.", icon: "📊" },
        ].map((s) => (
          <View key={s.step} style={styles.stepRow}>
            <View style={styles.stepIcon}><Text style={{ fontSize: 22 }}>{s.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.subtle}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* OWNER CTA */}
      <LinearGradient colors={[colors.gray900, colors.brand900]} style={styles.ownerCta}>
        <Text style={{ fontSize: 40 }}>🪧</Text>
        <Text style={styles.ctaTitle}>Hoarding Owner Ho?</Text>
        <Text style={styles.ctaSub}>Apni hoarding list karo — lakhs of advertisers tak pahuncho.</Text>
        <Button title="Free Mein List Karo →" onPress={() => navigation.navigate("Register", { role: "owner" })} style={{ marginTop: 16, alignSelf: "stretch" }} />
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  connectionBanner: { backgroundColor: "#fef2f2", borderBottomWidth: 1, borderBottomColor: "#fecaca", padding: 12 },
  connectionBannerText: { fontSize: 12, color: "#b91c1c", textAlign: "center" },
  hero: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 20 },
  heroPill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, marginBottom: 18 },
  heroPillText: { color: colors.brand300, fontSize: 11, fontWeight: "600" },
  heroTitle: { color: colors.white, fontSize: 30, fontWeight: "900", lineHeight: 36 },
  heroSub: { color: colors.gray200, fontSize: 14.5, marginTop: 12, lineHeight: 21 },
  popularWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 16 },
  popularLabel: { color: colors.gray400, fontSize: 12.5 },
  cityChip: { borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full },
  cityChipText: { color: colors.brand300, fontSize: 12.5 },
  statsBar: { flexDirection: "row", flexWrap: "wrap", backgroundColor: colors.brand500, paddingVertical: 20 },
  statItem: { width: "50%", alignItems: "center", marginVertical: 6 },
  statValue: { color: colors.white, fontSize: 22, fontWeight: "900" },
  statLabel: { color: colors.brand100, fontSize: 12, marginTop: 2 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 21, fontWeight: "900", color: colors.gray900 },
  sectionSub: { fontSize: 13, color: colors.gray500, marginTop: 3, marginBottom: 14 },
  subtleCenter: { textAlign: "center", color: colors.gray500, marginTop: 16 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  categoryTile: { width: "31%", aspectRatio: 1, backgroundColor: colors.white, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: colors.gray100 },
  categoryLabel: { fontSize: 11.5, fontWeight: "700", color: colors.gray800, textAlign: "center" },
  stepRow: { flexDirection: "row", gap: 14, alignItems: "flex-start", marginTop: 18 },
  stepIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.brand50, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900, marginBottom: 3 },
  subtle: { fontSize: 12.5, color: colors.gray500, lineHeight: 18 },
  ownerCta: { margin: 20, borderRadius: radius.xl, padding: 28, alignItems: "center" },
  ctaTitle: { color: colors.white, fontSize: 22, fontWeight: "900", marginTop: 10 },
  ctaSub: { color: colors.gray200, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 19 },
});
