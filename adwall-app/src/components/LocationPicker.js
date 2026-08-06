import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme/colors";

const DEFAULT_REGION = { latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.05, longitudeDelta: 0.05 }; // Delhi

export default function LocationPicker({ latitude, longitude, onChange }) {
  const [region, setRegion] = useState(
    latitude && longitude
      ? { latitude: Number(latitude), longitude: Number(longitude), latitudeDelta: 0.02, longitudeDelta: 0.02 }
      : DEFAULT_REGION
  );
  const [locating, setLocating] = useState(false);

  const marker = latitude && longitude ? { latitude: Number(latitude), longitude: Number(longitude) } : null;

  const handleMapPress = (e) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    onChange({ latitude: lat, longitude: lng });
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission chahiye", "Current location use karne ke liye location access do");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude: lat, longitude: lng } = loc.coords;
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      onChange({ latitude: lat, longitude: lng });

      // reverse-geocode to prefill city/area if the parent wants it
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (place) onChange({ latitude: lat, longitude: lng, city: place.city || place.subregion, area: place.district || place.name });
      } catch { /* reverse geocode is best-effort */ }
    } catch (err) {
      Alert.alert("Error", "Location fetch nahi ho payi");
    } finally { setLocating(false); }
  };

  return (
    <View>
      <View style={styles.mapWrap}>
        <MapView
          style={{ flex: 1 }}
          region={region}
          onPress={handleMapPress}
          onRegionChangeComplete={setRegion}
        >
          {marker && (
            <Marker
              coordinate={marker}
              draggable
              onDragEnd={(e) => onChange({ latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude })}
            />
          )}
        </MapView>
        <TouchableOpacity onPress={useCurrentLocation} style={styles.locateBtn} disabled={locating}>
          {locating ? <ActivityIndicator size="small" color={colors.brand600} /> : <Ionicons name="locate" size={18} color={colors.brand600} />}
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Map pe tap karo ya pin ko drag karke exact location set karo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { height: 220, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.gray200 },
  locateBtn: { position: "absolute", bottom: 10, right: 10, backgroundColor: colors.white, width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", elevation: 3, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4 },
  hint: { fontSize: 11, color: colors.gray400, marginTop: 6 },
});
