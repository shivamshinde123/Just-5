import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';

type Bucket = { label: string; count: number };

export function LengthHistogram({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const tallestIdx = buckets.reduce(
    (best, b, i) => (b.count > buckets[best].count ? i : best),
    0,
  );
  return (
    <View>
      <View style={styles.barsRow}>
        {buckets.map((b, i) => {
          const heightPct = (b.count / max) * 100;
          const isTallest = i === tallestIdx && b.count > 0;
          return (
            <View key={b.label} style={styles.col}>
              {isTallest && <Text style={styles.avgTag}>Avg</Text>}
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(b.count > 0 ? 8 : 0, heightPct)}%`,
                    backgroundColor: isTallest ? colors.cellMid : 'rgba(196, 234, 185, 0.7)',
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labelRow}>
        {buckets.map((b) => (
          <Text key={b.label} style={styles.label}>
            {b.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: {
    width: '100%',
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
  },
  avgTag: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
});
