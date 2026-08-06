import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { colors, radius } from "../theme/colors";

// data: [{ label, value }]
export default function BarChart({ data, height = 160, barColor = colors.brand500 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const width = Math.max(data.length * 56, 280);
  const chartHeight = height - 30;

  return (
    <View style={{ width: "100%" }}>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (chartHeight - 20);
          const x = i * 56 + 12;
          const y = chartHeight - barHeight;
          return (
            <React.Fragment key={d.label}>
              <SvgText x={x + 16} y={y - 6} fontSize="10" fill={colors.gray700} textAnchor="middle" fontWeight="700">
                {d.value}
              </SvgText>
              <Rect x={x} y={y} width={32} height={barHeight} rx={6} fill={barColor} />
              <SvgText x={x + 16} y={height - 8} fontSize="9.5" fill={colors.gray400} textAnchor="middle">
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export function LegendDot({ color, label }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.gray600 },
});
