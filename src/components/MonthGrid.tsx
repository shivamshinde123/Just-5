import { StyleSheet, Text, View } from 'react-native';
import type { MonthGrid as MonthGridData, MonthCell } from '../db';
import { colors, fonts, radii, spacing } from '../theme';

const CELL_COLORS = {
  none: colors.cellEmpty,
  started: colors.cellMid,
  converted: colors.cellHigh,
} as const;

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function MonthGrid({ data }: { data: MonthGridData }) {
  const rows: (MonthCell | null)[][] = [];
  for (let r = 0; r < data.cells.length; r += 7) {
    rows.push(data.cells.slice(r, r + 7));
  }
  const trimmed = rows.filter((row) => row.some((c) => c !== null));

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        {WEEKDAY_HEADERS.map((d, i) => (
          <Text key={i} style={styles.headerLetter}>
            {d}
          </Text>
        ))}
      </View>
      {trimmed.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((cell, ci) => (
            <View key={ci} style={styles.cellWrap}>
              {cell ? (
                <View
                  style={[
                    styles.cell,
                    { backgroundColor: CELL_COLORS[cell.kind] },
                    cell.isToday && styles.cellToday,
                  ]}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={`${cell.dateKey}: ${cell.kind}`}
                >
                  <Text
                    style={[
                      styles.cellDay,
                      cell.kind !== 'none' && styles.cellDayOnFilled,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </View>
              ) : (
                <View style={styles.cellEmpty} />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  headerRow: { flexDirection: 'row' },
  headerLetter: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.textMuted,
    paddingBottom: spacing.xs,
  },
  row: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  cellWrap: { flex: 1, aspectRatio: 1 },
  cell: {
    flex: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmpty: { flex: 1 },
  cellToday: {
    borderWidth: 1.5,
    borderColor: colors.primaryDeep,
  },
  cellDay: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  cellDayOnFilled: { color: colors.textOnDark, fontFamily: fonts.semibold },
});
