import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import HoardingCard from "../../components/HoardingCard";
import { colors, radius } from "../../theme/colors";
import { hoardingService } from "../../api/api";

export default function SearchScreen({ navigation, route }) {
  const [city, setCity] = useState(route?.params?.city || "");
  const [category, setCategory] = useState(route?.params?.category || "");
  const [hoardings, setHoardings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, hasNextPage: false });
  const [loading, setLoading] = useState(false);

  const fetchHoardings = useCallback(async (filters = {}, page = 1) => {
    setLoading(true);
    try {
      const params = { city, category, ...filters, page, limit: 12 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await hoardingService.search(params);
      setHoardings(data.data.hoardings || []);
      setPagination(data.data.pagination || { total: 0, page: 1, totalPages: 1, hasNextPage: false });
    } catch (err) {
      setHoardings([]);
    } finally {
      setLoading(false);
    }
  }, [city, category]);

  useEffect(() => { fetchHoardings(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <View style={styles.filterBar}>
        <Input
          icon={<Ionicons name="location-outline" size={16} color={colors.gray400} />}
          placeholder="City"
          value={city}
          onChangeText={setCity}
          style={{ flex: 1 }}
        />
        <Button title="" icon={<Ionicons name="search" size={18} color={colors.white} />} onPress={() => fetchHoardings({ city, category })} style={{ paddingHorizontal: 16 }} />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>{loading ? "Searching..." : `${pagination.total} ad spaces mile`}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand500} style={{ marginTop: 40 }} />
      ) : hoardings.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 44 }}>🔍</Text>
          <Text style={styles.emptyTitle}>Koi hoarding nahi mili</Text>
          <Text style={styles.emptySub}>Filters change karke try karo</Text>
        </View>
      ) : (
        <FlatList
          data={hoardings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <HoardingCard hoarding={item} onPress={() => navigation.navigate("HoardingDetail", { id: item._id })} />
          )}
          ListFooterComponent={
            pagination.totalPages > 1 ? (
              <View style={styles.pagerRow}>
                <TouchableOpacity disabled={pagination.page <= 1} onPress={() => fetchHoardings({}, pagination.page - 1)} style={styles.pagerBtn}>
                  <Text style={styles.pagerText}>Prev</Text>
                </TouchableOpacity>
                <Text style={styles.pagerLabel}>Page {pagination.page} of {pagination.totalPages}</Text>
                <TouchableOpacity disabled={!pagination.hasNextPage} onPress={() => fetchHoardings({}, pagination.page + 1)} style={styles.pagerBtn}>
                  <Text style={styles.pagerText}>Next</Text>
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
  filterBar: { flexDirection: "row", gap: 8, padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  resultsHeader: { paddingHorizontal: 16, paddingTop: 12 },
  resultsText: { fontSize: 13, color: colors.gray500 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  emptySub: { fontSize: 13, color: colors.gray500 },
  pagerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 10, marginBottom: 20 },
  pagerBtn: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  pagerText: { fontSize: 13, color: colors.gray800, fontWeight: "600" },
  pagerLabel: { fontSize: 13, color: colors.gray500 },
});
