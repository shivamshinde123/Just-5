import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadHomeStats, type HomeStats } from '../db';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';
import { formatFocusTime } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [stats, setStats] = useState<HomeStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadHomeStats().then((s) => {
        if (!cancelled) setStats(s);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const onStart = () => {
    navigation.navigate('Timer', { startedAt: Date.now() });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.streaksHeader}>
          <StreakBlock
            label="Daily"
            current={stats?.currentDailyStreak ?? 0}
            best={stats?.bestDailyStreak ?? 0}
          />
          <View style={styles.streakDivider} />
          <StreakBlock
            label="Conversion"
            current={stats?.currentConversionStreak ?? 0}
            best={stats?.bestConversionStreak ?? 0}
          />
        </View>

        {(stats?.gracesAvailable ?? 0) > 0 && (
          <View style={styles.gracesBadge}>
            <Text style={styles.gracesText}>
              {stats?.gracesAvailable} grace{stats?.gracesAvailable === 1 ? '' : 's'} saved
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start 5 minutes"
          onPress={onStart}
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
        >
          <Text style={styles.startTitle}>Start</Text>
          <Text style={styles.startSubtitle}>5 minutes</Text>
        </Pressable>

        <View style={styles.statsRow}>
          <Stat label="Sessions" value={String(stats?.totalSessions ?? 0)} />
          <View style={styles.statDivider} />
          <Stat label="Total focus" value={formatFocusTime(stats?.totalFocusSeconds ?? 0)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function StreakBlock({
  label,
  current,
  best,
}: {
  label: string;
  current: number;
  best: number;
}) {
  return (
    <View style={styles.streakBlock}>
      <Text style={styles.streakLabel}>{label}</Text>
      <Text style={styles.streakValue}>{current}</Text>
      <Text style={styles.streakBest}>Best {best}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  streaksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  streakBlock: { alignItems: 'center', flex: 1, gap: 2 },
  streakDivider: { width: 1, height: 56, backgroundColor: colors.border },
  streakLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  streakValue: { color: colors.text, fontSize: 40, fontWeight: '700' },
  streakBest: { color: colors.textMuted, fontSize: 12 },
  gracesBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  gracesText: { color: colors.success, fontSize: 12, letterSpacing: 0.5 },
  startButton: {
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonPressed: { backgroundColor: colors.primaryPressed, transform: [{ scale: 0.98 }] },
  startTitle: { color: colors.text, fontSize: 44, fontWeight: '700', letterSpacing: 1 },
  startSubtitle: { color: colors.text, fontSize: 18, opacity: 0.85, marginTop: spacing.xs },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', gap: spacing.xs },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '600' },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
});
