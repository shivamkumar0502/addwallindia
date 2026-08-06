import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import StatusBadge from "../../components/StatusBadge";
import { formatDate } from "../../utils/format";
import { colors, radius } from "../../theme/colors";

const ROLE_FILTERS = [
  { role: "client", label: "Clients", icon: "👤" },
  { role: "owner", label: "Owners", icon: "🏢" },
  { role: "admin", label: "Admins", icon: "🛡️" },
];

export default function UsersScreen() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/admin/users", { params: { role, search, page: p } });
      setData(res.data);
    } catch (e) { setData(null); }
    finally { setLoading(false); }
  }, [role, search, page]);

  useEffect(() => { load(1); setPage(1); }, [role]);
  useEffect(() => { load(1); }, []);

  const toggleRole = (r) => setRole((cur) => (cur === r ? "" : r));

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={15} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Name, email ya mobile search karo..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => load(1)}
          />
        </View>
        <View style={styles.roleRow}>
          {ROLE_FILTERS.map((r) => (
            <TouchableOpacity key={r.role} onPress={() => toggleRole(r.role)} style={[styles.roleChip, role === r.role && styles.roleChipActive]}>
              <Text style={{ fontSize: 16 }}>{r.icon}</Text>
              <Text style={[styles.roleChipText, role === r.role && { color: colors.brand700 }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.totalText}>{data?.total || 0} total users</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand500} style={{ marginTop: 40 }} />
      ) : !data?.users?.length ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={44} color={colors.gray200} />
          <Text style={styles.emptyText}>Koi user nahi mila</Text>
        </View>
      ) : (
        <FlatList
          data={data.users}
          keyExtractor={(u) => u._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: u }) => (
            <View style={styles.userCard}>
              <View style={styles.avatar}>
                {u.avatar ? <Image source={{ uri: u.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} /> : <Text style={styles.avatarText}>{u.name?.[0]?.toUpperCase()}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                <View style={styles.tagsRow}>
                  <View style={styles.roleTag}><Text style={styles.roleTagText}>{u.role}</Text></View>
                  {u.role === "owner" && <StatusBadge status={u.kycStatus} />}
                  <Text style={styles.authTag}>{u.authProvider === "google" ? "🔵 Google" : "🔑 Email"}</Text>
                </View>
                <Text style={styles.joinedText}>Joined {formatDate(u.createdAt)} • {u.mobile?.startsWith("pending_") ? "—" : u.mobile}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            data.totalPages > 1 ? (
              <View style={styles.pagerRow}>
                <TouchableOpacity disabled={data.page <= 1} onPress={() => { setPage(data.page - 1); load(data.page - 1); }} style={styles.pagerBtn}>
                  <Text style={styles.pagerText}>← Prev</Text>
                </TouchableOpacity>
                <Text style={styles.pagerLabel}>Page {data.page} of {data.totalPages}</Text>
                <TouchableOpacity disabled={data.page >= data.totalPages} onPress={() => { setPage(data.page + 1); load(data.page + 1); }} style={styles.pagerBtn}>
                  <Text style={styles.pagerText}>Next →</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { backgroundColor: colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100, gap: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: 42, fontSize: 13 },
  roleRow: { flexDirection: "row", gap: 8 },
  roleChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 7, flex: 1, justifyContent: "center" },
  roleChipActive: { borderColor: colors.brand400, backgroundColor: colors.brand50 },
  roleChipText: { fontSize: 11.5, fontWeight: "600", color: colors.gray700 },
  totalText: { fontSize: 11.5, color: colors.gray400 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 6 },
  emptyText: { fontSize: 13, color: colors.gray400 },
  userCard: { flexDirection: "row", gap: 12, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray100, padding: 14, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand400, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: 14 },
  userName: { fontSize: 13.5, fontWeight: "700", color: colors.gray900 },
  userEmail: { fontSize: 11, color: colors.gray400, marginTop: 1 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6, alignItems: "center" },
  roleTag: { backgroundColor: colors.gray100, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  roleTagText: { fontSize: 10, fontWeight: "700", color: colors.gray700, textTransform: "capitalize" },
  authTag: { fontSize: 10, color: colors.gray400 },
  joinedText: { fontSize: 10, color: colors.gray400, marginTop: 4 },
  pagerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 10, marginBottom: 20 },
  pagerBtn: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  pagerText: { fontSize: 12, color: colors.gray800, fontWeight: "600" },
  pagerLabel: { fontSize: 12, color: colors.gray500 },
});
