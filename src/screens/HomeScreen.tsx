import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadHomeStats, type HomeStats } from '../db';
import { MILESTONE_LABELS, type MilestoneKey } from '../gamification';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';
import { formatFocusTime } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const TOAST_DURATION_MS = 4000;

export default function HomeScreen({ navigation, route }: Props) {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [toast, setToast] = useState<MilestoneKey[] | null>(null);

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

  useEffect(() => {
    const unlocked = route.params?.unlockedMilestones;
    if (unlocked && unlocked.length > 0) {
      setToast(unlocked);
      navigation.setParams({ unlockedMilestones: undefined });
      const t = setTimeout(() => setToast(null), TOAST_DURATION_MS);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [route.params?.unlockedMilestones, navigation]);

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

        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{stats?.focusTitle ?? 'Warming Up'}</Text>
          {(stats?.gracesAvailable ?? 0) > 0 && (
            <View style={styles.gracesBadge}>
              <Text style={styles.gracesText}>
                {stats?.gracesAvailable} grace{stats?.gracesAvailable === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start 5 minutes"
          onPress={onStart}
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
        >
          <Text style={styles.startTitle}>Start</Text>
          <Text style={styles.startSubtitle}>5 minutes</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View stats"
          onPress={() => navigation.navigate('Stats')}
          style={({ pressed }) => [styles.statsRow, pressed && { opacity: 0.7 }]}
        >
          <Stat label="Sessions" value={String(stats?.totalSessions ?? 0)} />
          <View style={styles.statDivider} />
          <Stat label="Total focus" value={formatFocusTime(stats?.totalFocusSeconds ?? 0)} />
          <View style={styles.statDivider} />
          <Text style={styles.statsLink}>Stats ›</Text>
        </Pressable>

        {toast && (
          <View style={styles.toast} accessibilityLiveRegion="polite">
            <Text style={styles.toastTitle}>Milestone unlocked</Text>
            {toast.map((k) => (
              <Text key={k} style={styles.toastBody}>
                • {MILESTONE_LABELS[k]}
              </Text>
            ))}
          </View>
        )}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  titleText: {
    color: colors.text,
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  gracesBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gracesText: { color: colors.success, fontSize: 11, letterSpacing: 0.5 },
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
  statsLink: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  toastTitle: {
    color: colors.success,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  toastBody: { color: colors.text, fontSize: 14 },
});
