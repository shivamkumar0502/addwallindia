import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme/colors";

const PALETTE = [colors.brand500, "#2563eb", "#16a34a", "#eab308", "#dc2626", "#8b5cf6", "#0891b2"];

// data: [{ label, value }]
export default function DonutChart({ data, size = 140, strokeWidth = 22 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.gray100} strokeWidth={strokeWidth} fill="none" />
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const circle = (
            <Circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offsetAcc}
              strokeLinecap="butt"
              fill="none"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          );
          offsetAcc += dash;
          return circle;
        })}
      </Svg>
      <View style={{ gap: 6, flex: 1 }}>
        {data.map((d, i) => (
          <View key={d.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{d.label}</Text>
            <Text style={styles.legendValue}>{d.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.gray600, flex: 1 },
  legendValue: { fontSize: 11, fontWeight: "700", color: colors.gray900 },
});
