import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';

export function HourBars({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  return (
    <View>
      <View style={styles.row}>
        {counts.map((c, h) => {
          const ratio = c / max;
          const tint =
            ratio === 0
              ? 'rgba(196, 234, 185, 0.3)'
              : ratio < 0.34
                ? 'rgba(196, 234, 185, 0.6)'
                : ratio < 0.67
                  ? colors.cellMid
                  : colors.cellHigh;
          return (
            <View key={h} style={styles.col}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${Math.max(2, ratio * 100)}%`, backgroundColor: tint },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.axis}>
        <Text style={styles.axisLabel}>00:00</Text>
        <Text style={styles.axisLabel}>06:00</Text>
        <Text style={styles.axisLabel}>12:00</Text>
        <Text style={styles.axisLabel}>18:00</Text>
        <Text style={styles.axisLabel}>23:59</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 3 },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { flex: 1, justifyContent: 'flex-end' },
  barFill: { borderTopLeftRadius: radii.sm, borderTopRightRadius: radii.sm, minHeight: 2 },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  axisLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
});
