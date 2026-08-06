import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator, TextInput, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { bookingService, quoteService, agreementService, paymentService } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/Card";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import usePayment from "../../hooks/usePayment";
import { formatCurrency, formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

const TIMELINE = [
  { key: "quote_requested", label: "Request" },
  { key: "quote_received", label: "Quote" },
  { key: "confirmed", label: "Confirmed" },
  { key: "payment_done", label: "Payment" },
  { key: "proof_submitted", label: "Proof" },
  { key: "completed", label: "Completed" },
];
const stepIdx = (status) => TIMELINE.findIndex((s) => s.key === status);

export default function BookingDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const isOwner = user?.role === "owner";
  const { pay } = usePayment();

  const [booking, setBooking] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [quoteForm, setQuoteForm] = useState({ amount: "", message: "" });
  const [sendingQuote, setSendingQuote] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: bData } = await bookingService.getById(id);
      setBooking(bData.data);
      try {
        const { data: qData } = await quoteService.getByBooking(id);
        setQuotes(qData.data || []);
      } catch { setQuotes([]); }
    } catch (e) {
      Alert.alert("Error", "Booking load nahi hua");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSendQuote = async () => {
    if (!quoteForm.amount) return Alert.alert("Amount required hai");
    setSendingQuote(true);
    try {
      await quoteService.send({ bookingId: id, amount: parseFloat(quoteForm.amount), message: quoteForm.message, validDays: 3 });
      Alert.alert("Quote bhej diya!", "Client review karega.");
      setQuoteForm({ amount: "", message: "" });
      fetchAll();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Quote send failed");
    } finally { setSendingQuote(false); }
  };

  const handleAcceptQuote = async (quoteId) => {
    try {
      await quoteService.accept(quoteId);
      Alert.alert("Quote accepted!", "Ab payment karo.");
      fetchAll();
    } catch (e) { Alert.alert("Error", "Accept failed"); }
  };

  const handleRejectQuote = async (quoteId) => {
    try {
      await quoteService.reject(quoteId);
      fetchAll();
    } catch (e) { Alert.alert("Error", "Reject failed"); }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const { data } = await paymentService.createOrder({ bookingId: id });
      const orderData = data.data; // { orderId, amount, currency, paymentId, keyId }
      const result = await pay({ orderData, description: `Booking Payment — ${booking.hoarding?.title}` });
      if (!result) return; // cancelled or failed, hook already alerted
      await paymentService.verify({
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      });
      Alert.alert("Payment successful!", "Escrow me safe hai. 🎉");
      fetchAll();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Payment failed");
    } finally { setPaymentLoading(false); }
  };

  const pickProofImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission chahiye", "Gallery access do photo select karne ke liye");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setProofImage(result.assets[0]);
  };

  const handleSubmitProof = async () => {
    if (!proofImage) return Alert.alert("Photo select karo");
    setProofLoading(true);
    try {
      const fd = new FormData();
      fd.append("images", { uri: proofImage.uri, name: "proof.jpg", type: "image/jpeg" });
      await bookingService.submitProof(id, fd);
      Alert.alert("Proof submitted!", "Client review karega.");
      setProofImage(null);
      fetchAll();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Upload failed");
    } finally { setProofLoading(false); }
  };

  const handleApprove = async () => {
    setApproveLoading(true);
    try {
      await bookingService.approve(id, {});
      Alert.alert("Approved!", "Payment release ho gaya. 🎉");
      fetchAll();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Approval failed");
    } finally { setApproveLoading(false); }
  };

  const handleAgreement = async () => {
    setAgreementLoading(true);
    try {
      const { data } = await agreementService.generate(id);
      if (data.data?.pdfUrl) Linking.openURL(data.data.pdfUrl);
      fetchAll();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Agreement failed");
    } finally { setAgreementLoading(false); }
  };

  const handleCancel = () => {
    Alert.prompt
      ? Alert.prompt("Cancellation reason", "Reason batao:", async (reason) => {
          if (!reason) return;
          try { await bookingService.cancel(id, { reason }); fetchAll(); } catch { Alert.alert("Cancel failed"); }
        })
      : Alert.alert("Cancel", "Booking cancel karni hai?", [
          { text: "Nahi" },
          { text: "Haan", onPress: async () => { try { await bookingService.cancel(id, { reason: "User cancelled" }); fetchAll(); } catch { Alert.alert("Cancel failed"); } } },
        ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;
  if (!booking) return <View style={styles.center}><Text style={{ color: colors.gray500 }}>Booking not found</Text></View>;

  const currentStep = stepIdx(booking.status);
  const isCancelled = ["cancelled", "disputed"].includes(booking.status);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.idText}>#{booking._id.slice(-8)}</Text>
        <StatusBadge status={booking.status} />
      </View>

      {/* Timeline */}
      {!isCancelled && (
        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row" }}>
            {TIMELINE.map((s, i) => {
              const done = i <= currentStep;
              return (
                <View key={s.key} style={{ alignItems: "center", flex: 1 }}>
                  <View style={[styles.stepCircle, done && styles.stepCircleDone]}>
                    <Text style={[styles.stepNum, done && { color: colors.white }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, done && { color: colors.brand600, fontWeight: "700" }]}>{s.label}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Hoarding info */}
      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={styles.thumb}>
            {booking.hoarding?.images?.[0] ? (
              <Image source={{ uri: booking.hoarding.images[0] }} style={{ width: "100%", height: "100%" }} />
            ) : <Text style={{ fontSize: 26 }}>🪧</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hoardingTitle}>{booking.hoarding?.title}</Text>
            <Text style={styles.subtle}>{booking.hoarding?.location?.area}, {booking.hoarding?.location?.city}</Text>
            <Text style={styles.subtle}>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</Text>
            <Text style={styles.amount}>{formatCurrency(booking.pricing?.totalAmount)}</Text>
          </View>
        </View>
      </Card>

      {/* Owner: send quote */}
      {isOwner && booking.status === "quote_requested" && (
        <Card style={{ marginBottom: 14 }}>
          <Text style={styles.cardHeading}>Quote Bhejo</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount (₹)"
            keyboardType="numeric"
            value={quoteForm.amount}
            onChangeText={(v) => setQuoteForm((f) => ({ ...f, amount: v }))}
          />
          <TextInput
            style={[styles.input, { height: 70, marginTop: 8 }]}
            placeholder="Message (optional)"
            multiline
            value={quoteForm.message}
            onChangeText={(v) => setQuoteForm((f) => ({ ...f, message: v }))}
          />
          <Button title="Quote Bhejo" onPress={handleSendQuote} loading={sendingQuote} style={{ marginTop: 10 }} />
        </Card>
      )}

      {/* Quotes list */}
      {quotes.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <Text style={styles.cardHeading}>Quotes</Text>
          {quotes.map((q) => (
            <View key={q._id} style={styles.quoteRow}>
              <View>
                <Text style={styles.amount}>{formatCurrency(q.amount)}</Text>
                {!!q.message && <Text style={styles.subtle}>{q.message}</Text>}
              </View>
              {isClient && q.status === "pending" && (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity onPress={() => handleRejectQuote(q._id)} style={styles.rejectBtn}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleAcceptQuote(q._id)} style={styles.acceptBtn}><Text style={styles.acceptText}>Accept</Text></TouchableOpacity>
                </View>
              )}
              {q.status !== "pending" && <StatusBadge status={q.status} />}
            </View>
          ))}
        </Card>
      )}

      {/* Client: pay */}
      {isClient && booking.status === "confirmed" && (
        <Button title="💳 Pay Now (Escrow Secure)" onPress={handlePayment} loading={paymentLoading} style={{ marginBottom: 14 }} />
      )}

      {/* Owner: submit proof */}
      {isOwner && booking.status === "payment_done" && (
        <Card style={{ marginBottom: 14 }}>
          <Text style={styles.cardHeading}>Installation Proof Submit Karo</Text>
          <TouchableOpacity onPress={pickProofImage} style={styles.uploadBox}>
            {proofImage ? (
              <Image source={{ uri: proofImage.uri }} style={{ width: "100%", height: "100%", borderRadius: radius.md }} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={26} color={colors.gray400} />
                <Text style={styles.subtle}>Photo select karo</Text>
              </>
            )}
          </TouchableOpacity>
          <Button title="Submit Proof" onPress={handleSubmitProof} loading={proofLoading} style={{ marginTop: 10 }} />
        </Card>
      )}

      {/* Client: approve */}
      {isClient && booking.status === "proof_submitted" && (
        <Button title="Approve Installation ✅" onPress={handleApprove} loading={approveLoading} style={{ marginBottom: 14 }} />
      )}

      {/* Agreement */}
      {["confirmed", "payment_done", "proof_submitted", "completed"].includes(booking.status) && (
        <Button title={agreementLoading ? "Generating..." : "📄 Agreement Download"} variant="outline" onPress={handleAgreement} loading={agreementLoading} style={{ marginBottom: 14 }} />
      )}

      {/* Chat */}
      <Button
        title="💬 Chat"
        variant="outline"
        onPress={() => navigation.navigate("Chat", { bookingId: id })}
        style={{ marginBottom: 14 }}
      />

      {/* Cancel */}
      {!["completed", "cancelled", "disputed"].includes(booking.status) && (
        <TouchableOpacity onPress={handleCancel} style={{ alignItems: "center", marginTop: 4, marginBottom: 20 }}>
          <Text style={{ color: colors.red, fontSize: 13, fontWeight: "600" }}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  idText: { fontSize: 12, color: colors.gray400 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.gray200, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  stepCircleDone: { backgroundColor: colors.brand500, borderColor: colors.brand500 },
  stepNum: { fontSize: 11, fontWeight: "700", color: colors.gray300 },
  stepLabel: { fontSize: 9, color: colors.gray400, marginTop: 4, textAlign: "center" },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  hoardingTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  subtle: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "800", color: colors.gray900, marginTop: 4 },
  cardHeading: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  quoteRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.gray100 },
  rejectBtn: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  rejectText: { fontSize: 11.5, color: colors.gray700, fontWeight: "600" },
  acceptBtn: { backgroundColor: colors.brand500, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  acceptText: { fontSize: 11.5, color: colors.white, fontWeight: "600" },
  uploadBox: { height: 140, borderWidth: 1.5, borderColor: colors.gray200, borderStyle: "dashed", borderRadius: radius.md, alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden" },
});
