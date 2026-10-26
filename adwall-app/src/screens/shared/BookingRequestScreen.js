import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, KeyboardAvoidingView, ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import Calendar from "../../components/Calendar";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { hoardingService, bookingService } from "../../api/api";
import { colors, radius } from "../../theme/colors";

/* Nayi screen.
   HoardingDetailScreen ka "Book Now" button navigation.navigate("BookingRequest")
   karta tha, par ye screen kabhi bani hi nahi thi aur navigator me register
   bhi nahi thi — isliye button dabane pe kuch nahi hota tha.

   Backend POST /bookings expect karta hai:
     { hoardingId, startDate, endDate, requirements }                        */

const fmt = (d) =>
  d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Select date";

// Calendar dates are local dates; UTC conversion shifts India midnight to yesterday.
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function BookingRequestScreen({ route, navigation }) {
  const { hoardingId } = route.params || {};
  const { setBookingIntent } = useAuth();
  useEffect(() => { setBookingIntent(null); }, [setBookingIntent]);

  const [hoarding, setHoarding] = useState(null);
  const [loadingHoarding, setLoadingHoarding] = useState(true);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [picker, setPicker] = useState(null); // "start" | "end" | null
  const [requirements, setRequirements] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hoardingId) {
      setError("Hoarding nahi mili. Peeche jaake dobara try karo.");
      setLoadingHoarding(false);
      return;
    }
    hoardingService
      .getById(hoardingId)
      .then(({ data }) => setHoarding(data.data.hoarding || data.data))
      .catch(() => setError("Hoarding details load nahi hui."))
      .finally(() => setLoadingHoarding(false));
  }, [hoardingId]);

  const days = useMemo(() => {
    if (!hoarding) return setError("Hoarding details load nahi hui. Peeche jaake dobara try karo.");
    if (startDate && toISO(startDate) < toISO(new Date())) return setError("Start date aaj ya uske baad chuno");
    if (!startDate || !endDate) return 0;
    return Math.ceil((endDate - startDate) / 86400000);
  }, [startDate, endDate]);

  const perMonth = hoarding?.pricing?.perMonth || 0;
  const estimate = days > 0 ? Math.ceil((perMonth / 30) * days) : 0;

  const pickDate = (d) => {
    if (picker === "start") {
      setStartDate(d);
      if (endDate && endDate <= d) setEndDate(null);
    } else {
      setEndDate(d);
    }
    setPicker(null);
  };

  const submit = async () => {
    setError("");

    if (!hoarding) return setError("Hoarding details load nahi hui. Peeche jaake dobara try karo.");
    if (startDate && toISO(startDate) < toISO(new Date())) return setError("Start date aaj ya uske baad chuno");
    if (!startDate || !endDate) return setError("Start aur end dono dates chuno");
    if (days < 1) return setError("End date start ke baad honi chahiye");

    setSubmitting(true);
    try {
      const { data } = await bookingService.create({
        hoardingId,
        startDate: toISO(startDate),
        endDate: toISO(endDate),
        requirements: requirements.trim(),
      });

      const booking = data.data;
      const id = booking?._id || booking?.id;
      if (id) navigation.replace("BookingDetail", { id });
      else navigation.navigate("MyBookings");
    } catch (err) {
      if (!err.response)
        setError("Server se connect nahi ho paya. Internet check karo ya thodi der baad try karo.");
      else setError(err.response.data?.message || "Booking request fail ho gayi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingHoarding) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand500} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.gray50 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Hoarding summary */}
        {hoarding && (
          <View style={styles.card}>
            <Text style={styles.hoardingTitle} numberOfLines={2}>
              {hoarding.title}
            </Text>
            <View style={styles.row}>
              <Ionicons name="location-outline" size={14} color={colors.gray400} />
              <Text style={styles.muted}>
                {hoarding.location?.area}
                {hoarding.location?.area && hoarding.location?.city ? ", " : ""}
                {hoarding.location?.city}
              </Text>
            </View>
            <Text style={styles.price}>
              ₹{perMonth.toLocaleString("en-IN")}
              <Text style={styles.muted}> /month</Text>
            </Text>
          </View>
        )}

        {/* Dates */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Kab se kab tak?</Text>

          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity style={styles.dateBox} onPress={() => setPicker("start")}>
            <Ionicons name="calendar-outline" size={16} color={colors.gray400} />
            <Text style={[styles.dateText, !startDate && { color: colors.gray400 }]}>
              {fmt(startDate)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>End Date</Text>
          <TouchableOpacity
            style={[styles.dateBox, !startDate && { opacity: 0.5 }]}
            disabled={!startDate}
            onPress={() => setPicker("end")}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.gray400} />
            <Text style={[styles.dateText, !endDate && { color: colors.gray400 }]}>
              {fmt(endDate)}
            </Text>
          </TouchableOpacity>

          {picker === "start" && (
            <Calendar
              value={startDate}
              minDate={new Date()}
              onChange={pickDate}
            />
          )}

          {picker === "end" && (
            <Calendar
              value={endDate}
              markedFrom={startDate}
              minDate={new Date((startDate?.getTime() || Date.now()) + 86400000)}
              onChange={pickDate}
            />
          )}
        </View>

        {/* Requirements */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Koi special requirement?</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Creative size, design brief, installation date — jo bhi batana ho"
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={4}
            value={requirements}
            onChangeText={setRequirements}
            textAlignVertical="top"
          />
        </View>

        {/* Estimate */}
        {days > 0 && (
          <View style={[styles.card, styles.estimateCard]}>
            <View style={styles.rowBetween}>
              <Text style={styles.muted}>{days} din</Text>
              <Text style={styles.muted}>
                ₹{Math.ceil(perMonth / 30).toLocaleString("en-IN")} / din
              </Text>
            </View>
            <View style={[styles.rowBetween, { marginTop: 8 }]}>
              <Text style={styles.estimateLabel}>Anumaanit amount</Text>
              <Text style={styles.estimateValue}>₹{estimate.toLocaleString("en-IN")}</Text>
            </View>
            <Text style={styles.note}>
              Ye sirf andaza hai. Owner apna final quote bhejega, tabhi payment karni hogi.
            </Text>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          title={submitting ? "Bhej rahe hain..." : "Booking Request Bhejo"}
          onPress={submit}
          loading={submitting}
          disabled={!hoarding || !startDate || !endDate || days < 1}
          style={{ marginTop: 6 }}
        />

        <Text style={styles.footNote}>
          Request bhejne se paisa nahi katega. Owner quote bhejega, aap accept karoge, tabhi
          payment step aayega.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.gray50 },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
    marginBottom: 14,
  },
  hoardingTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muted: { fontSize: 12, color: colors.gray500 },
  price: { fontSize: 18, fontWeight: "800", color: colors.brand500, marginTop: 10 },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  label: { fontSize: 12, fontWeight: "600", color: colors.gray500, marginTop: 14, marginBottom: 6 },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  dateText: { fontSize: 14, color: colors.gray900 },

  textarea: {
    marginTop: 12,
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    color: colors.gray900,
    backgroundColor: colors.white,
  },

  estimateCard: { backgroundColor: colors.brand50, borderColor: "#fed7aa" },
  estimateLabel: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  estimateValue: { fontSize: 20, fontWeight: "800", color: colors.brand600 },
  note: { fontSize: 11, color: colors.gray500, marginTop: 10, lineHeight: 16 },

  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: colors.red, fontSize: 13 },
  footNote: {
    fontSize: 11,
    color: colors.gray500,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 16,
  },
});