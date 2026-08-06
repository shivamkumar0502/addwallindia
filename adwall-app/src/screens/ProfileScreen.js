import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { Card } from "../components/Card";
import Button from "../components/Button";
import { colors, radius } from "../theme/colors";

const ROLE_LABEL = { client: "Advertiser", owner: "Space Owner", admin: "Administrator" };

export default function ProfileScreen({ navigation }) {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    mobile: user?.mobile?.startsWith("pending_") ? "" : (user?.mobile || ""),
    companyName: user?.businessDetails?.companyName || "",
    agencyName: user?.businessDetails?.agencyName || "",
    address: user?.businessDetails?.address || "",
  });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatar, setAvatar] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission chahiye");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setAvatar(result.assets[0]);
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (avatar) fd.append("avatar", { uri: avatar.uri, name: "avatar.jpg", type: "image/jpeg" });
      const { data } = await api.patch("/profile/update", fd, { headers: { "Content-Type": "multipart/form-data" } });
      updateUser(data.data);
      Alert.alert("Saved", "Profile updated!");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Update failed");
    } finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (passForm.newPassword !== passForm.confirmPassword) return Alert.alert("New passwords match nahi kar rahe");
    if (passForm.newPassword.length < 6) return Alert.alert("Password minimum 6 characters hona chahiye");
    setPassLoading(true);
    try {
      await api.patch("/profile/change-password", { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      Alert.alert("Success", "Password changed!");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Password change failed");
    } finally { setPassLoading(false); }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Account Delete", "Kya aap sure hain? Ye action undo nahi hoga!", [
      { text: "Cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          setDeleteLoading(true);
          try {
            await api.delete("/profile/delete", { data: {} });
            await logout();
          } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Delete failed");
          } finally { setDeleteLoading(false); }
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray50 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.pageTitle}>My Profile</Text>
      <Text style={styles.pageSub}>Account details aur settings manage karo</Text>

      <Card style={{ marginTop: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap}>
            {avatar || user?.avatar ? (
              <Image source={{ uri: avatar?.uri || user.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{user?.name?.[0]?.toUpperCase()}</Text></View>
            )}
            <View style={styles.avatarCamera}><Ionicons name="camera" size={12} color={colors.white} /></View>
          </TouchableOpacity>
          <View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{ROLE_LABEL[user?.role] || user?.role}</Text></View>
              {user?.role === "owner" && (
                <View style={[styles.roleBadge, user?.kycStatus === "verified" ? styles.kycVerified : styles.kycPending]}>
                  <Text style={[styles.roleBadgeText, user?.kycStatus === "verified" ? { color: "#15803d" } : { color: "#a16207" }]}>KYC {user?.kycStatus}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <Text style={styles.cardHeading}>👤 Basic Information</Text>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Aapka naam" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, styles.inputDisabled]} value={user?.email} editable={false} />
        <Text style={styles.hint}>Email change nahi ho sakta</Text>

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput style={styles.input} value={form.mobile} onChangeText={(v) => setForm((f) => ({ ...f, mobile: v }))} placeholder="10-digit mobile" keyboardType="phone-pad" />

        {user?.role === "owner" && (
          <>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Company Name</Text>
                <TextInput style={styles.input} value={form.companyName} onChangeText={(v) => setForm((f) => ({ ...f, companyName: v }))} placeholder="ABC Pvt Ltd" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Agency Name</Text>
                <TextInput style={styles.input} value={form.agencyName} onChangeText={(v) => setForm((f) => ({ ...f, agencyName: v }))} placeholder="XYZ Advertising" />
              </View>
            </View>
            <Text style={styles.label}>Business Address</Text>
            <TextInput style={styles.input} value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Full address" />
          </>
        )}

        <Button title={profileLoading ? "Saving..." : "Save Changes"} onPress={handleProfileSave} loading={profileLoading} style={{ marginTop: 16 }} />
      </Card>

      {user?.authProvider !== "google" && (
        <Card style={{ marginTop: 14 }}>
          <Text style={styles.cardHeading}>🔒 Change Password</Text>
          <Text style={styles.label}>Current Password</Text>
          <TextInput style={styles.input} secureTextEntry value={passForm.currentPassword} onChangeText={(v) => setPassForm((f) => ({ ...f, currentPassword: v }))} placeholder="••••••" />
          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} secureTextEntry value={passForm.newPassword} onChangeText={(v) => setPassForm((f) => ({ ...f, newPassword: v }))} placeholder="Min 6 characters" />
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput style={styles.input} secureTextEntry value={passForm.confirmPassword} onChangeText={(v) => setPassForm((f) => ({ ...f, confirmPassword: v }))} placeholder="Repeat password" />
          <Button title={passLoading ? "Changing..." : "Change Password"} variant="outline" onPress={handlePasswordChange} loading={passLoading} style={{ marginTop: 16 }} />
        </Card>
      )}

      <Card style={{ marginTop: 14, borderColor: "#fecaca" }}>
        <Text style={[styles.cardHeading, { color: colors.red }]}>🗑️ Danger Zone</Text>
        <Text style={styles.dangerText}>Account delete karne se saara data permanently remove ho jayega. Ye action undo nahi ho sakta.</Text>
        <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>{deleteLoading ? "Deleting..." : "Delete My Account"}</Text>
        </TouchableOpacity>
      </Card>

      <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={16} color={colors.gray700} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 20, fontWeight: "800", color: colors.gray900 },
  pageSub: { fontSize: 12.5, color: colors.gray500, marginTop: 3 },
  avatarWrap: { width: 72, height: 72 },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand100, alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontSize: 24, fontWeight: "800", color: colors.brand600 },
  avatarCamera: { position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
  userName: { fontSize: 17, fontWeight: "800", color: colors.gray900 },
  userEmail: { fontSize: 12.5, color: colors.gray500, marginTop: 2 },
  roleBadge: { backgroundColor: colors.brand100, borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  roleBadgeText: { fontSize: 10.5, fontWeight: "700", color: colors.brand700 },
  kycVerified: { backgroundColor: "#dcfce7" },
  kycPending: { backgroundColor: "#fef9c3" },
  cardHeading: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 10 },
  label: { fontSize: 12.5, fontWeight: "600", color: colors.gray700, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, backgroundColor: colors.white },
  inputDisabled: { backgroundColor: colors.gray50, color: colors.gray400 },
  hint: { fontSize: 10.5, color: colors.gray400, marginTop: 4 },
  dangerText: { fontSize: 12, color: colors.gray500, lineHeight: 18, marginBottom: 12 },
  deleteBtn: { borderWidth: 1, borderColor: "#fecaca", borderRadius: radius.md, paddingVertical: 10, alignItems: "center", backgroundColor: "#fef2f2" },
  deleteBtnText: { fontSize: 12.5, fontWeight: "700", color: colors.red },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 18, marginBottom: 30, paddingVertical: 10 },
  logoutText: { fontSize: 13, fontWeight: "600", color: colors.gray700 },
});
