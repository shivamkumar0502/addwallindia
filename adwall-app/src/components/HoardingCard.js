import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme/colors";

const CATEGORY_LABEL = {
  hoarding: "Hoarding", billboard: "Billboard", led_screen: "LED Screen",
  wall_painting: "Wall Painting", bus_branding: "Bus Branding", metro_ads: "Metro Ads",
  airport_ads: "Airport Ads", mall_branding: "Mall Branding",
};

const formatCurrency = (n) =>
  n == null ? "-" : `₹${Number(n).toLocaleString("en-IN")}`;

export default function HoardingCard({ hoarding, onPress }) {
  const { title, images, location, category, pricing, lighting, dailyTraffic, rating, totalReviews } = hoarding;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={styles.imageWrap}>
        {images?.[0] ? (
          <Image source={{ uri: images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}><Text style={{ fontSize: 36 }}>🪧</Text></View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{CATEGORY_LABEL[category] || category}</Text>
        </View>
        {lighting === "led" && (
          <View style={styles.ledBadge}>
            <Ionicons name="flash" size={10} color={colors.white} />
            <Text style={styles.ledText}>LED</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color={colors.gray500} />
          <Text style={styles.subtle}>{location?.area}, {location?.city}</Text>
        </View>
        <View style={[styles.row, { justifyContent: "space-between", marginTop: 10 }]}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            <Text style={styles.price}>{formatCurrency(pricing?.perMonth)}</Text>
            <Text style={styles.subtleSm}>/month</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {rating > 0 && (
              <View style={styles.row}>
                <Ionicons name="star" size={12} color={colors.yellow} />
                <Text style={styles.subtleSm}>{rating} ({totalReviews})</Text>
              </View>
            )}
            <View style={styles.row}>
              <Ionicons name="eye-outline" size={12} color={colors.gray500} />
              <Text style={styles.subtleSm}>{dailyTraffic?.replace("_", " ")}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, backgroundColor: colors.white, overflow: "hidden", borderWidth: 1, borderColor: colors.gray100, marginBottom: 16 },
  imageWrap: { height: 160, backgroundColor: colors.gray100 },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  categoryBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  categoryText: { fontSize: 11, fontWeight: "600", color: colors.gray800 },
  ledBadge: { position: "absolute", top: 8, right: 8, backgroundColor: colors.brand500, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full, flexDirection: "row", alignItems: "center", gap: 3 },
  ledText: { fontSize: 10, color: colors.white, fontWeight: "700" },
  body: { padding: 14 },
  title: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  subtle: { fontSize: 12.5, color: colors.gray500 },
  subtleSm: { fontSize: 11.5, color: colors.gray500 },
  price: { fontSize: 17, fontWeight: "800", color: colors.gray900 },
});
