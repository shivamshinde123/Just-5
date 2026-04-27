import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

export function HourBars({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  return (
    <View>
      <View style={styles.row}>
        {counts.map((c, h) => (
          <View key={h} style={styles.col}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: `${(c / max) * 100}%`, opacity: c === 0 ? 0.3 : 1 },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        <Text style={styles.axisLabel}>12a</Text>
        <Text style={styles.axisLabel}>6a</Text>
        <Text style={styles.axisLabel}>12p</Text>
        <Text style={styles.axisLabel}>6p</Text>
        <Text style={styles.axisLabel}>11p</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 2 },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { flex: 1, justifyContent: 'flex-end' },
  barFill: { backgroundColor: colors.primary, borderRadius: radii.sm, minHeight: 2 },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  axisLabel: { color: colors.textMuted, fontSize: 10 },
});
