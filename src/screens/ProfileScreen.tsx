import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  loadHomeStats,
  loadStatsBundle,
  loadUserProfile,
  type HomeStats,
  type StatsBundle,
  type UserProfile,
} from '../db';
import { MILESTONE_LABELS, type MilestoneKey } from '../gamification';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, fonts, radii, shadows, spacing, text } from '../theme';
import { formatFocusTime } from '../utils/time';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [bundle, setBundle] = useState<StatsBundle | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([loadUserProfile(), loadHomeStats(), loadStatsBundle()]).then(
        ([p, s, b]) => {
          if (cancelled) return;
          setProfile(p);
          setStats(s);
          setBundle(b);
        },
      );
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const initial = (profile?.displayName ?? 'Y').trim().charAt(0).toUpperCase() || 'Y';
  const allMilestoneKeys = Object.keys(MILESTONE_LABELS) as MilestoneKey[];
  const achievedMap = new Map(
    (bundle?.unlockedMilestones ?? []).map((m) => [m.key, m.achievedAt]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatarSm}>
            <View style={styles.avatarSmDot} />
          </View>
          <Text style={styles.topBarTitle}>Profile</Text>
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroRow}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {profile?.displayName ?? 'You'}
              </Text>
              <View style={styles.titlePill}>
                <Text style={styles.titlePillText}>{stats?.focusTitle ?? 'Warming Up'}</Text>
              </View>
            </View>
            <Text style={styles.bio}>
              Member since{' '}
              {profile
                ? new Date(profile.joinedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <KPI label="Sessions" value={String(stats?.totalSessions ?? 0)} tone="card" />
          <KPI
            label="Total focus"
            value={formatFocusTime(stats?.totalFocusSeconds ?? 0)}
            tone="mint"
          />
          <KPI
            label="Daily streak"
            value={`${stats?.currentDailyStreak ?? 0}d`}
            hint={`Best ${stats?.bestDailyStreak ?? 0}d`}
            tone="card"
          />
          <KPI
            label="Conversion"
            value={`${Math.round((bundle?.allTime.conversionRate ?? 0) * 100)}%`}
            hint={`${stats?.currentConversionStreak ?? 0}d streak`}
            tone="cream"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <View style={styles.milestoneGrid}>
            {allMilestoneKeys.map((k) => {
              const achievedAt = achievedMap.get(k);
              return (
                <View
                  key={k}
                  style={[styles.milestone, achievedAt == null && styles.milestoneLocked]}
                >
                  <View
                    style={[styles.milestoneIcon, !!achievedAt && styles.milestoneIconOn]}
                  />
                  <Text
                    style={[
                      styles.milestoneLabel,
                      !achievedAt && styles.milestoneLabelLocked,
                    ]}
                    numberOfLines={2}
                  >
                    {MILESTONE_LABELS[k]}
                  </Text>
                  {achievedAt && (
                    <Text style={styles.milestoneDate}>
                      {new Date(achievedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Settings')}
          style={({ pressed }) => [styles.settingsLink, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.settingsLinkText}>Open settings ›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function KPI({
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
    tone === 'mint' ? styles.kpiMint : tone === 'cream' ? styles.kpiCream : styles.kpiCard;
  return (
    <View style={[styles.kpi, toneStyle]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {hint && <Text style={styles.kpiHint}>{hint}</Text>}
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
  avatarSm: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmDot: { width: 12, height: 12, borderRadius: radii.pill, backgroundColor: colors.primary },
  topBarTitle: { ...text.h3, color: colors.primaryDeep, letterSpacing: -0.4 },
  topBarIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryDeep },

  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 140 },

  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarLg: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(196, 234, 185, 0.6)',
    ...shadows.cardSoft,
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.primary,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: {
    fontFamily: fonts.bold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.primary,
    maxWidth: '70%',
  },
  titlePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
  },
  titlePillText: { ...text.caption, color: colors.primarySubdued },
  bio: { ...text.body, color: colors.textMuted, marginTop: 2 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 96,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  kpiMint: {
    backgroundColor: 'rgba(196, 234, 185, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(196, 234, 185, 0.6)',
  },
  kpiCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  kpiCream: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: { ...text.caption, color: colors.textBody },
  kpiValue: { ...text.h2, color: colors.text },
  kpiHint: { ...text.caption, color: colors.textMuted },

  section: { gap: spacing.md },
  sectionTitle: { ...text.h2, color: colors.text },
  milestoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  milestone: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 96,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  milestoneLocked: { backgroundColor: colors.surface, opacity: 0.85 },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  milestoneIconOn: { backgroundColor: colors.mint },
  milestoneLabel: { ...text.cardTitle, color: colors.text, fontFamily: fonts.semibold },
  milestoneLabelLocked: { color: colors.textMuted },
  milestoneDate: { ...text.caption, color: colors.textMuted },

  settingsLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  settingsLinkText: { ...text.body, color: colors.primary, fontFamily: fonts.semibold },
});
