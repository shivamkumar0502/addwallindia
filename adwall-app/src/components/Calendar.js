import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme/colors";

/* Calendar — koi npm package nahi chahiye.
   @react-native-community/datetimepicker install karna padta tha aur wo
   na hone pe date manually type karni padti thi. Ye plain React Native se
   bana hai, kuch install nahi karna.

   Props:
     value       Date | null      — abhi selected date
     onChange    (Date) => void
     minDate     Date             — isse pehle ki dates disabled
     maxDate     Date             — optional
     markedFrom  Date | null      — range highlight ke liye (start date)  */

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function Calendar({ value, onChange, minDate, maxDate, markedFrom }) {
  const [cursor, setCursor] = useState(() => {
    const base = value || minDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const min = minDate ? startOfDay(minDate) : null;
  const max = maxDate ? startOfDay(maxDate) : null;

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const out = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    return out;
  }, [cursor]);

  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));

  const isDisabled = (d) => (min && d < min) || (max && d > max);
  const inRange = (d) =>
    markedFrom && value && d > startOfDay(markedFrom) && d < startOfDay(value);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => shift(-1)} style={styles.navBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={colors.gray700} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => shift(1)} style={styles.navBtn} hitSlop={8}>
          <Ionicons name="chevron-forward" size={18} color={colors.gray700} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {DAYS.map((d, i) => (
          <Text key={i} style={styles.weekday}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.cell} />;

          const disabled = isDisabled(d);
          const selected = sameDay(d, value);
          const ranged = inRange(d);

          return (
            <TouchableOpacity
              key={d.toISOString()}
              style={styles.cell}
              disabled={disabled}
              onPress={() => onChange(d)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.day,
                  ranged && styles.dayRanged,
                  selected && styles.daySelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    disabled && styles.dayTextDisabled,
                    selected && styles.dayTextSelected,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    padding: 10,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  navBtn: { padding: 6 },
  monthLabel: { fontSize: 14, fontWeight: "700", color: colors.gray900 },

  weekRow: { flexDirection: "row" },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: colors.gray400,
    paddingBottom: 6,
  },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  day: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayRanged: { backgroundColor: colors.brand50, borderRadius: 0, width: "100%" },
  daySelected: { backgroundColor: colors.brand500 },
  dayText: { fontSize: 13, color: colors.gray800 },
  dayTextDisabled: { color: colors.gray300 || "#d1d5db" },
  dayTextSelected: { color: colors.white, fontWeight: "700" },
});