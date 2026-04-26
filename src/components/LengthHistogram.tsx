import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

type Bucket = { label: string; count: number };

export function LengthHistogram({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <View style={styles.wrap}>
      {buckets.map((b) => (
        <View key={b.label} style={styles.row}>
          <Text style={styles.label}>{b.label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(b.count / max) * 100}%` }]} />
          </View>
          <Text style={styles.count}>{b.count}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { color: colors.textMuted, width: 56, fontSize: 12 },
  barTrack: {
    flex: 1,
    height: 18,
    backgroundColor: colors.border,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radii.sm },
  count: { color: colors.text, width: 24, textAlign: 'right', fontSize: 12 },
});
