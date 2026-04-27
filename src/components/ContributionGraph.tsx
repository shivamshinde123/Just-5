import { StyleSheet, Text, View } from 'react-native';
import type { ContributionDay } from '../db';
import { colors, fonts, radii, spacing } from '../theme';

const CELL_COLORS: Record<ContributionDay['kind'], string> = {
  none: colors.cellEmpty,
  started: colors.cellMid,
  converted: colors.cellHigh,
};

export function ContributionGraph({ days }: { days: ContributionDay[] }) {
  return (
    <View style={styles.row}>
      {days.map((d) => (
        <View key={d.dateKey} style={styles.col}>
          <View
            style={[styles.cell, { backgroundColor: CELL_COLORS[d.kind] }]}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${d.weekday}: ${d.kind}`}
          />
          <Text style={styles.label}>{d.weekday[0]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  col: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  cell: { width: '100%', aspectRatio: 1, borderRadius: radii.sm },
  label: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
});
