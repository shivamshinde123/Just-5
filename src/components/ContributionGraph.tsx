import { StyleSheet, Text, View } from 'react-native';
import type { ContributionDay } from '../db';
import { colors, radii, spacing } from '../theme';

const CELL_COLORS: Record<ContributionDay['kind'], string> = {
  none: colors.border,
  started: '#3D5BCB',
  converted: colors.success,
};

export function ContributionGraph({ days }: { days: ContributionDay[] }) {
  return (
    <View style={styles.row}>
      {days.map((d) => (
        <View key={d.dateKey} style={styles.col}>
          <View
            style={[styles.cell, { backgroundColor: CELL_COLORS[d.kind] }]}
            accessibilityLabel={`${d.weekday}: ${d.kind}`}
          />
          <Text style={styles.label}>{d.weekday[0]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  cell: { width: '85%', aspectRatio: 1, borderRadius: radii.sm },
  label: { color: colors.textMuted, fontSize: 11 },
});
