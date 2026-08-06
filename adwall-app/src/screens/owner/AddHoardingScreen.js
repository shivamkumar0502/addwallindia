import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Image, Alert, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { hoardingService } from "../../api/api";
import { Card } from "../../components/Card";
import Button from "../../components/Button";
import LocationPicker from "../../components/LocationPicker";
import { colors, radius } from "../../theme/colors";

const CATEGORIES = ["hoarding", "billboard", "led_screen", "wall_painting", "bus_branding", "auto_branding", "cab_branding", "metro_ads", "railway_ads", "airport_ads", "mall_branding", "cinema_ads", "stadium_ads", "petrol_pump", "event_branding"];
const LIGHTING = ["none", "frontlit", "backlit", "led"];
const TRAFFIC = ["low", "medium", "high", "very_high"];
const labelize = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const STEPS = ["Basic Info", "Location", "Specs & Pricing", "Upload Images"];

const INITIAL = {
  title: "", description: "", category: "hoarding",
  city: "", area: "", address: "", latitude: "", longitude: "",
  width: "", height: "",
  perMonth: "", perDay: "", perWeek: "", isNegotiable: true,
  lighting: "none", dailyTraffic: "medium",
  facingDirection: "", landmarkNearby: "",
};

export default function AddHoardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [form, setForm] = useState(INITIAL);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission chahiye", "Gallery access do");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.7,
    });
    if (!result.canceled) setImages(result.assets.slice(0, 10));
  };

  const canNext = [
    !!(form.title && form.category),
    !!(form.city && form.area && form.latitude && form.longitude),
    !!(form.width && form.height && form.perMonth),
    true,
  ][step];

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      images.forEach((img, i) => fd.append("images", { uri: img.uri, name: `photo${i}.jpg`, type: "image/jpeg" }));
      await hoardingService.add(fd);
      Alert.alert("Submitted!", "Hoarding verification ke liye bhej diya gaya.");
      navigation.navigate("MyHoardings");
    } catch (err) {
      setError(err.response?.data?.message || "Submit failed");
      setStep(0);
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pageTitle}>Add New Hoarding</Text>

      {/* Step indicators */}
      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ alignItems: "center", flex: 1 }}>
            <View style={[styles.stepCircle, i < step && styles.stepDone, i === step && styles.stepActive]}>
              <Text style={[styles.stepNum, (i <= step) && { color: colors.white }]}>{i < step ? "✓" : i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === step && { color: colors.gray900, fontWeight: "700" }]}>{s}</Text>
          </View>
        ))}
      </View>

      <Card>
        {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

        {step === 0 && (
          <View>
            <Text style={styles.label}>Hoarding Title *</Text>
            <TextInput style={styles.input} placeholder="e.g. Premium Hoarding at MG Road" value={form.title} onChangeText={(v) => set("title", v)} />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => set("category", c)} style={[styles.catChip, form.category === c && styles.catChipActive]}>
                  <Text style={[styles.catChipText, form.category === c && { color: colors.white }]}>{labelize(c)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, { height: 90 }]} multiline placeholder="Hoarding ke baare mein batao — visibility, highlights..." value={form.description} onChangeText={(v) => set("description", v)} />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.hint}>Map pe apni hoarding ki exact location pin karo</Text>
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={({ latitude, longitude, city, area }) => {
                setForm((f) => ({
                  ...f,
                  latitude: String(latitude),
                  longitude: String(longitude),
                  city: city && !f.city ? city : f.city,
                  area: area && !f.area ? area : f.area,
                }));
              }}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>City *</Text>
                <TextInput style={styles.input} placeholder="Delhi" value={form.city} onChangeText={(v) => set("city", v)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Area *</Text>
                <TextInput style={styles.input} placeholder="Connaught Place" value={form.area} onChangeText={(v) => set("area", v)} />
              </View>
            </View>
            <Text style={styles.label}>Full Address</Text>
            <TextInput style={styles.input} placeholder="Street address" value={form.address} onChangeText={(v) => set("address", v)} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Latitude *</Text>
                <TextInput style={[styles.input, styles.inputReadonly]} value={form.latitude} editable={false} placeholder="Map se select karo" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Longitude *</Text>
                <TextInput style={[styles.input, styles.inputReadonly]} value={form.longitude} editable={false} placeholder="Map se select karo" />
              </View>
            </View>
            <Text style={styles.label}>Nearby Landmark</Text>
            <TextInput style={styles.input} placeholder="Near XYZ Mall, Metro Station" value={form.landmarkNearby} onChangeText={(v) => set("landmarkNearby", v)} />
          </View>
        )}

        {step === 2 && (
          <View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Width (feet) *</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="40" value={form.width} onChangeText={(v) => set("width", v)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Height (feet) *</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="20" value={form.height} onChangeText={(v) => set("height", v)} />
              </View>
            </View>

            <Text style={styles.label}>Lighting</Text>
            <View style={styles.chipsWrap}>
              {LIGHTING.map((l) => (
                <TouchableOpacity key={l} onPress={() => set("lighting", l)} style={[styles.catChip, form.lighting === l && styles.catChipActive]}>
                  <Text style={[styles.catChipText, form.lighting === l && { color: colors.white }]}>{labelize(l)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Daily Traffic</Text>
            <View style={styles.chipsWrap}>
              {TRAFFIC.map((t) => (
                <TouchableOpacity key={t} onPress={() => set("dailyTraffic", t)} style={[styles.catChip, form.dailyTraffic === t && styles.catChipActive]}>
                  <Text style={[styles.catChipText, form.dailyTraffic === t && { color: colors.white }]}>{labelize(t)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Monthly Price (₹) *</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="25000" value={form.perMonth} onChangeText={(v) => set("perMonth", v)} />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Daily Price (₹)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="1000" value={form.perDay} onChangeText={(v) => set("perDay", v)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Weekly Price (₹)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="6000" value={form.perWeek} onChangeText={(v) => set("perWeek", v)} />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Switch value={form.isNegotiable} onValueChange={(v) => set("isNegotiable", v)} trackColor={{ true: colors.brand500 }} />
              <Text style={{ fontSize: 13, color: colors.gray700 }}>Price negotiable hai</Text>
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <TouchableOpacity onPress={pickImages} style={styles.uploadBox}>
              <Ionicons name="cloud-upload-outline" size={30} color={colors.gray300} />
              <Text style={styles.uploadTitle}>Hoarding ki photos yahan upload karo</Text>
              <Text style={styles.hint}>JPG, PNG — max 5MB each, upto 10 images</Text>
              <Text style={styles.uploadCta}>Tap to select</Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <>
                <Text style={[styles.label, { marginTop: 14 }]}>{images.length} photo(s) selected:</Text>
                <View style={styles.previewGrid}>
                  {images.map((img, i) => (
                    <Image key={i} source={{ uri: img.uri }} style={styles.previewImg} />
                  ))}
                </View>
              </>
            )}
            <Text style={[styles.hint, { marginTop: 10 }]}>* Images optional hain for now, baad mein bhi add kar sakte ho</Text>
          </View>
        )}
      </Card>

      <View style={styles.navRow}>
        <Button title="← Previous" variant="outline" disabled={step === 0} onPress={() => setStep((s) => s - 1)} style={{ flex: 1 }} />
        {step < STEPS.length - 1 ? (
          <Button title="Next →" disabled={!canNext} onPress={() => setStep((s) => s + 1)} style={{ flex: 1 }} />
        ) : (
          <Button title={loading ? "Submitting..." : "Submit ✓"} loading={loading} onPress={handleSubmit} style={{ flex: 1 }} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 20, fontWeight: "800", color: colors.gray900, marginBottom: 16 },
  stepsRow: { flexDirection: "row", marginBottom: 16 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  stepDone: { backgroundColor: "#22c55e" },
  stepActive: { backgroundColor: colors.brand500 },
  stepNum: { fontSize: 11, fontWeight: "700", color: colors.gray400 },
  stepLabel: { fontSize: 9.5, color: colors.gray400, marginTop: 4, textAlign: "center" },
  errorBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: radius.md, padding: 10, marginBottom: 12 },
  errorText: { color: colors.red, fontSize: 13 },
  label: { fontSize: 12.5, fontWeight: "600", color: colors.gray700, marginTop: 12, marginBottom: 6 },
  hint: { fontSize: 11, color: colors.gray400 },
  input: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, backgroundColor: colors.white },
  inputReadonly: { backgroundColor: colors.gray50, color: colors.gray500 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  catChip: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  catChipActive: { backgroundColor: colors.brand500, borderColor: colors.brand500 },
  catChipText: { fontSize: 11, color: colors.gray700, fontWeight: "600" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  uploadBox: { borderWidth: 1.5, borderColor: colors.gray200, borderStyle: "dashed", borderRadius: radius.lg, alignItems: "center", justifyContent: "center", padding: 30, gap: 4 },
  uploadTitle: { fontSize: 13, fontWeight: "600", color: colors.gray700, marginTop: 6 },
  uploadCta: { fontSize: 12, color: colors.brand500, fontWeight: "700", marginTop: 4 },
  previewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  previewImg: { width: "31%", aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.gray100 },
  navRow: { flexDirection: "row", gap: 10, marginTop: 18, marginBottom: 20 },
});
