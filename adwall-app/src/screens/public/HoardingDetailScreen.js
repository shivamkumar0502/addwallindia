import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { colors, radius } from "../../theme/colors";
import { hoardingService } from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const formatCurrency = (n) => (n == null ? "-" : `₹${Number(n).toLocaleString("en-IN")}`);

export default function HoardingDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { isAuthenticated, user, setBookingIntent } = useAuth();
  const [hoarding, setHoarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setActiveImage(0);
    (async () => {
      try {
        const { data } = await hoardingService.getById(id);
        if (active) setHoarding(data.data?.hoarding || data.data);
      } catch (e) {
        if (active) {
          setHoarding(null);
          setError(e.response?.data?.message || "Details load nahi hui. Dobara try karo.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, attempt]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;
  }
  if (!hoarding) {
    return <View style={styles.center}><Text style={{ color: colors.gray500 }}>{error || "Hoarding nahi mili"}</Text><Button title="Retry" onPress={() => setAttempt(n => n + 1)} style={{ marginTop: 16 }} /></View>;
  }

  const { title, images, location, description, pricing, category, dailyTraffic, rating, totalReviews } = hoarding;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }}>
      {images?.[0] ? (
        <Image source={{ uri: images[activeImage] }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.imagePlaceholder]}><Text style={{ fontSize: 48 }}>🪧</Text></View>
      )}

      {images?.length > 1 && (
        <ScrollView horizontal contentContainerStyle={{ padding: 12, gap: 8 }}>
          {images.map((uri, index) => (
            <TouchableOpacity key={`${uri}-${index}`} onPress={() => setActiveImage(index)} accessibilityLabel={`View photo ${index + 1}`}>
              <Image source={{ uri }} style={{ width: 76, height: 60, borderRadius: 8, borderWidth: 2, borderColor: index === activeImage ? colors.brand500 : colors.gray200 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={colors.gray500} />
          <Text style={styles.subtle}>{location?.area}, {location?.city}</Text>
        </View>

        {rating > 0 && (
          <View style={[styles.row, { marginTop: 6 }]}>
            <Ionicons name="star" size={14} color={colors.yellow} />
            <Text style={styles.subtle}>{rating} ({totalReviews} reviews)</Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(pricing?.perMonth)}</Text>
          <Text style={styles.subtle}> /month</Text>
        </View>

        {!!description && (
          <>
            <Text style={styles.sectionHeading}>Description</Text>
            <Text style={styles.desc}>{description}</Text>
          </>
        )}

        <Text style={styles.sectionHeading}>Details</Text>
        <View style={styles.detailGrid}>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>Category</Text><Text style={styles.detailValue}>{category}</Text></View>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>Daily Traffic</Text><Text style={styles.detailValue}>{dailyTraffic?.replace("_", " ")}</Text></View>
          {[
            ["Size", hoarding.dimensions?.width && hoarding.dimensions?.height ? `${hoarding.dimensions.width} × ${hoarding.dimensions.height} ft` : "N/A"],
            ["Lighting", hoarding.lighting],
            ["Facing", hoarding.facingDirection || "N/A"],
          ].map(([label, value]) => (
            <View key={label} style={styles.detailItem}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value || "N/A"}</Text></View>
          ))}
        </View>
        {!!hoarding.landmarkNearby && <Text style={styles.desc}>Near: {hoarding.landmarkNearby}</Text>}
        <Text style={styles.sectionHeading}>Pricing</Text>
        {!!pricing?.perDay && <Text style={styles.desc}>{formatCurrency(pricing.perDay)} / day</Text>}
        {!!pricing?.perWeek && <Text style={styles.desc}>{formatCurrency(pricing.perWeek)} / week</Text>}
        {!!pricing?.isNegotiable && <Text style={{ color: colors.green }}>Price is negotiable</Text>}

        <Button
          title={isAuthenticated && user?.role !== "client" ? "Client account required to book" : isAuthenticated ? "Request a Quote" : "Login to Book"}
          disabled={isAuthenticated && user?.role !== "client"}
          onPress={() => {
            if (isAuthenticated) navigation.navigate("BookingRequest", { hoardingId: id });
            else {
              setBookingIntent(id);
              navigation.navigate("Login");
            }
          }}
          style={{ marginTop: 24 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  heroImage: { width: "100%", height: 240 },
  imagePlaceholder: { backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: "800", color: colors.gray900 },
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  subtle: { fontSize: 13, color: colors.gray500 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 16 },
  price: { fontSize: 26, fontWeight: "900", color: colors.gray900 },
  sectionHeading: { fontSize: 15, fontWeight: "700", color: colors.gray900, marginTop: 22, marginBottom: 6 },
  desc: { fontSize: 13.5, color: colors.gray500, lineHeight: 20 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  detailItem: { backgroundColor: colors.gray50, borderRadius: radius.md, padding: 12, minWidth: "45%" },
  detailLabel: { fontSize: 11, color: colors.gray500 },
  detailValue: { fontSize: 13, fontWeight: "700", color: colors.gray900, marginTop: 2, textTransform: "capitalize" },
});
