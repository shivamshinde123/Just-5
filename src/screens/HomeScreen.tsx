import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadHomeStats, type ContributionDay, type HomeStats } from '../db';
import { hapticTap } from '../effects';
import { MILESTONE_LABELS, type MilestoneKey } from '../gamification';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, fonts, radii, shadows, spacing, text } from '../theme';
import { formatFocusTime } from '../utils/time';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

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
    }
  }, [route.params?.unlockedMilestones, navigation]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const onStart = () => {
    hapticTap();
    navigation.navigate('Timer', { startedAt: Date.now() });
  };

  const focusTitle = stats?.focusTitle ?? 'Warming Up';
  const dailyStreak = stats?.currentDailyStreak ?? 0;
  const conversionStreak = stats?.currentConversionStreak ?? 0;
  const bestConversion = stats?.bestConversionStreak ?? 0;
  const graces = stats?.gracesAvailable ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatar}>
            <View style={styles.avatarDot} />
          </View>
          <Text style={styles.topBarTitle}>Focus</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => navigation.navigate('Settings')}
          hitSlop={12}
          style={styles.topBarIcon}
        >
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StreakIndicator
          dailyStreak={dailyStreak}
          last7Days={stats?.last7Days ?? null}
          focusTitle={focusTitle}
        />

        <View style={styles.heroWrap}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start 5 minutes"
                onPress={onStart}
                style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
              >
                <Text style={styles.startTitle}>Start 5 Minutes</Text>
                <Text style={styles.startSubtitle}>Ready to focus?</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.heroQuote}>Clear your mind…</Text>
          <Text style={styles.heroKicker}>TAKE A BREATH</Text>
        </View>

        <View style={styles.bentoSection}>
          <Text style={styles.bentoHeading}>Your Focus</Text>
          <View style={styles.bentoGrid}>
            <BentoStat
              label="Sessions"
              value={String(stats?.totalSessions ?? 0)}
              tone="mint"
            />
            <BentoStat
              label="Total focus"
              value={formatFocusTime(stats?.totalFocusSeconds ?? 0)}
              tone="card"
            />
            <BentoStat
              label="Conversion"
              value={`${conversionStreak}d`}
              hint={`Best ${bestConversion}d`}
              tone="card"
            />
            <BentoStat
              label="Title"
              value={focusTitle}
              hint={graces > 0 ? `${graces} grace${graces === 1 ? '' : 's'}` : undefined}
              tone="cream"
            />
          </View>
        </View>
      </ScrollView>

      {toast && (
        <View style={styles.toast} accessibilityLiveRegion="polite">
          <Text style={styles.toastTitle}>MILESTONE UNLOCKED</Text>
          {toast.map((k) => (
            <Text key={k} style={styles.toastBody}>
              · {MILESTONE_LABELS[k]}
            </Text>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function StreakIndicator({
  dailyStreak,
  last7Days,
  focusTitle,
}: {
  dailyStreak: number;
  last7Days: ContributionDay[] | null;
  focusTitle: string;
}) {
  const todayIdx = last7Days ? last7Days.length - 1 : -1;
  return (
    <View style={styles.streakCard}>
      <View style={styles.streakHeader}>
        <Text style={styles.streakTitle}>
          {dailyStreak > 0 ? `${dailyStreak}-day focus streak` : 'Start your streak today'}
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{focusTitle}</Text>
        </View>
      </View>
      <View style={styles.weekRow}>
        {(last7Days ?? new Array(7).fill(null)).map((day: ContributionDay | null, i) => {
          const filled = day && day.kind !== 'none';
          const isToday = i === todayIdx;
          const letter = day ? day.weekday.charAt(0) : '';
          return (
            <View
              key={i}
              style={[
                styles.weekCircle,
                filled && styles.weekCircleFilled,
                !filled && isToday && styles.weekCircleToday,
              ]}
            >
              <Text
                style={[
                  styles.weekCircleLetter,
                  filled && styles.weekCircleLetterFilled,
                  isToday && !filled && styles.weekCircleLetterToday,
                ]}
              >
                {letter}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function BentoStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: 'mint' | 'card' | 'cream';
}) {
  const toneStyle =
    tone === 'mint'
      ? styles.tileMint
      : tone === 'cream'
        ? styles.tileCream
        : styles.tileCard;
  return (
    <View style={[styles.tile, toneStyle]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      {hint && <Text style={styles.tileHint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  topBarTitle: { ...text.h3, color: colors.primaryDeep, letterSpacing: -0.4 },
  topBarIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryDeep },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 120,
    gap: spacing.xl,
  },

  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakTitle: {
    ...text.cardTitle,
    color: colors.primary,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
  },
  pillText: { ...text.caption, color: colors.primarySubdued },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
  },
  weekCircleFilled: { backgroundColor: colors.primary },
  weekCircleToday: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  weekCircleLetter: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textBody,
  },
  weekCircleLetterFilled: { color: colors.textOnDark, fontFamily: fonts.semibold },
  weekCircleLetterToday: { color: colors.primary, fontFamily: fonts.bold },

  heroWrap: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  ringOuter: {
    width: 296,
    height: 296,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.ringOuter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 256,
    height: 256,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.ringInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    width: 224,
    height: 224,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cta,
  },
  startButtonPressed: { backgroundColor: colors.primaryDeep, transform: [{ scale: 0.98 }] },
  startTitle: { ...text.h2, color: colors.textOnDark, textAlign: 'center' },
  startSubtitle: {
    ...text.caption,
    color: colors.textOnDark,
    opacity: 0.8,
    marginTop: spacing.xs,
    textTransform: 'lowercase',
  },
  heroQuote: { ...text.h3, color: colors.textBody, textAlign: 'center' },
  heroKicker: {
    ...text.eyebrowLoose,
    color: colors.primary,
    textTransform: 'uppercase',
  },

  bentoSection: { gap: spacing.md },
  bentoHeading: { ...text.h1, color: colors.text },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 100,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tileMint: {
    backgroundColor: 'rgba(196, 234, 185, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(196, 234, 185, 0.6)',
  },
  tileCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  tileCream: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileLabel: { ...text.caption, color: colors.textBody },
  tileValue: { ...text.h2, color: colors.text },
  tileHint: { ...text.caption, color: colors.textMuted },

  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 110,
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.cardSoft,
  },
  toastTitle: { ...text.eyebrow, color: colors.primary },
  toastBody: { ...text.body, color: colors.text },
});
