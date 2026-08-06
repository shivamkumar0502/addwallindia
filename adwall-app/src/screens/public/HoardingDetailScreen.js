import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { colors, radius } from "../../theme/colors";
import { hoardingService } from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const formatCurrency = (n) => (n == null ? "-" : `₹${Number(n).toLocaleString("en-IN")}`);

export default function HoardingDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { isAuthenticated } = useAuth();
  const [hoarding, setHoarding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await hoardingService.getById(id);
        setHoarding(data.data);
      } catch (e) {
        // keep null -> shows not-found state
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;
  }
  if (!hoarding) {
    return <View style={styles.center}><Text style={{ color: colors.gray500 }}>Hoarding nahi mili</Text></View>;
  }

  const { title, images, location, description, pricing, category, dailyTraffic, rating, totalReviews } = hoarding;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }}>
      {images?.[0] ? (
        <Image source={{ uri: images[0] }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.imagePlaceholder]}><Text style={{ fontSize: 48 }}>🪧</Text></View>
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
        </View>

        <Button
          title={isAuthenticated ? "Book Now" : "Login to Book"}
          onPress={() => navigation.navigate(isAuthenticated ? "BookingRequest" : "Login", isAuthenticated ? { hoardingId: id } : undefined)}
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
