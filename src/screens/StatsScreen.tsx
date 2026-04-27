import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContributionGraph } from '../components/ContributionGraph';
import { HourBars } from '../components/HourBars';
import { LengthHistogram } from '../components/LengthHistogram';
import { MonthGrid } from '../components/MonthGrid';
import { loadStatsBundle, type StatsBundle } from '../db';
import { MILESTONE_LABELS, type MilestoneKey } from '../gamification';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, fonts, radii, shadows, spacing, text } from '../theme';
import { formatFocusTime } from '../utils/time';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Stats'>,
  NativeStackScreenProps<RootStackParamList>
>;
type Tab = 'today' | 'consistency' | 'all';

export default function StatsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('today');
  const [data, setData] = useState<StatsBundle | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadStatsBundle().then((d) => {
        if (!cancelled) setData(d);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const empty = data && data.allTime.totalSessions === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatar}>
            <View style={styles.avatarDot} />
          </View>
          <Text style={styles.topBarTitle}>Insights</Text>
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

      <View style={styles.tabs} accessibilityRole="tablist">
        {(['today', 'consistency', 'all'] as Tab[]).map((t) => {
          const label =
            t === 'today' ? 'Today' : t === 'consistency' ? 'Consistency' : 'All Time';
          const selected = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.tabText, selected && styles.tabActive]}>{label}</Text>
              {selected && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!data ? (
          <Text style={styles.bodyMuted}>Loading…</Text>
        ) : empty ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.bodyMuted}>Start a session to begin tracking your focus.</Text>
          </View>
        ) : tab === 'today' ? (
          <TodayView data={data} />
        ) : tab === 'consistency' ? (
          <ConsistencyView data={data} />
        ) : (
          <AllTimeView data={data} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({
  title,
  children,
  variant = 'cream',
}: {
  title?: string;
  children: ReactNode;
  variant?: 'cream' | 'white' | 'moss';
}) {
  const cardStyle =
    variant === 'moss'
      ? styles.cardMoss
      : variant === 'white'
        ? styles.cardWhite
        : styles.cardCream;
  return (
    <View style={[styles.card, cardStyle]}>
      {title && (
        <Text style={[styles.cardTitle, variant === 'moss' && styles.cardTitleOnMoss]}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function formatHourLabel(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function TodayView({ data }: { data: StatsBundle }) {
  const { today, allTime } = data;
  return (
    <>
      <View style={styles.heroBlock}>
        <Text style={styles.heroEyebrow}>CURRENT MOMENTUM</Text>
        <View style={styles.heroValueRow}>
          <Text style={styles.heroValue}>{formatFocusTime(today.totalFocusSeconds)}</Text>
          <Text style={styles.heroSuffix}>today</Text>
        </View>
        <Text style={styles.heroBody}>
          {today.firstStartTimestamp
            ? `Your first session began at ${formatHourLabel(today.firstStartTimestamp)}.`
            : 'Tap Start to begin your first session today.'}
        </Text>
      </View>

      <View style={[styles.heroPill, today.startedToday && styles.heroPillActive]}>
        <View style={styles.heroPillDot} />
        <Text style={styles.heroPillText}>
          {today.startedToday ? 'Focus Mode Active' : 'Idle'}
        </Text>
      </View>

      <Card title="Today">
        <StatRow label="Started" value={today.startedToday ? 'Yes' : 'Not yet'} />
        <StatRow label="Focus time" value={formatFocusTime(today.totalFocusSeconds)} />
        <StatRow
          label="First session"
          value={today.firstStartTimestamp ? formatHourLabel(today.firstStartTimestamp) : '—'}
        />
        <StatRow label="All-time conversion" value={`${Math.round(allTime.conversionRate * 100)}%`} />
      </Card>
    </>
  );
}

function ConsistencyView({ data }: { data: StatsBundle }) {
  return (
    <>
      <Card title="Last 7 days">
        <ContributionGraph days={data.contribution} />
      </Card>
      <Card title={data.monthGrid.monthLabel}>
        <MonthGrid data={data.monthGrid} />
        <View style={styles.legend}>
          <LegendDot color={colors.cellEmpty} label="None" />
          <LegendDot color={colors.cellMid} label="Started" />
          <LegendDot color={colors.cellHigh} label="Converted" />
        </View>
      </Card>
    </>
  );
}

function formatDateKey(key: string | null): string {
  if (!key) return '—';
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateMs(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function peakHourLabel(counts: number[]): string {
  if (counts.every((c) => c === 0)) return '—';
  let peakStart = 0;
  let peakSum = 0;
  for (let i = 0; i < counts.length; i++) {
    const sum = counts[i] + counts[(i + 1) % 24];
    if (sum > peakSum) {
      peakSum = sum;
      peakStart = i;
    }
  }
  const fmt = (h: number) => {
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12} ${ampm}`;
  };
  return `${fmt(peakStart)} – ${fmt((peakStart + 2) % 24)}`;
}

function AllTimeView({ data }: { data: StatsBundle }) {
  const { allTime, hourCounts, lengthBuckets, records, focusTitle, unlockedMilestones } = data;
  const conversionPct = Math.round(allTime.conversionRate * 100);
  const allMilestoneKeys = Object.keys(MILESTONE_LABELS) as MilestoneKey[];
  const achievedMap = new Map(unlockedMilestones.map((m) => [m.key, m.achievedAt]));

  return (
    <>
      <View style={styles.summaryGrid}>
        <SummaryTile label="Total Sessions" value={String(allTime.totalSessions)} />
        <SummaryTile label="Focus Time" value={formatFocusTime(allTime.totalFocusSeconds)} />
        <SummaryTile label="Avg. Session" value={formatFocusTime(allTime.averageSessionSeconds)} />
        <SummaryTile label="Conversion" value={`${conversionPct}%`} />
      </View>

      <Card variant="moss">
        <Text style={styles.mossEyebrow}>PEAK FOCUS</Text>
        <Text style={styles.mossValue}>{peakHourLabel(hourCounts)}</Text>
        <Text style={styles.mossBody}>
          {focusTitle === 'Flow State'
            ? 'You’re in flow. Your peak hours are paying off.'
            : 'Your neural clarity is highest in these hours.'}
        </Text>
      </Card>

      <Card title="Personal records">
        <StatRow label="Longest session" value={formatFocusTime(records.longestSessionSeconds)} />
        <StatRow label="Longest daily streak" value={`${records.longestDailyStreak} days`} />
        <StatRow label="Longest conversion" value={`${records.longestConversionStreak} days`} />
        <StatRow
          label="Most focus in a day"
          value={
            records.mostFocusInDaySeconds > 0
              ? `${formatFocusTime(records.mostFocusInDaySeconds)} (${formatDateKey(records.mostFocusInDayKey)})`
              : '—'
          }
        />
      </Card>

      <Card title="Focus Distribution" variant="white">
        <Text style={styles.cardSubtitle}>Sessions across the 24-hour cycle.</Text>
        <HourBars counts={hourCounts} />
      </Card>

      <Card title="Session Duration">
        <LengthHistogram buckets={lengthBuckets} />
      </Card>

      <Card title="Milestones">
        {allMilestoneKeys.map((k) => {
          const achievedAt = achievedMap.get(k);
          return (
            <View key={k} style={styles.milestoneRow}>
              <View style={[styles.milestoneDot, achievedAt ? styles.milestoneDotOn : null]} />
              <Text style={[styles.milestoneLabel, !achievedAt && styles.milestoneLabelLocked]}>
                {MILESTONE_LABELS[k]}
              </Text>
              {achievedAt && <Text style={styles.milestoneDate}>{formatDateMs(achievedAt)}</Text>}
            </View>
          );
        })}
      </Card>

      <Card title="Title">
        <Text style={styles.titleValue}>{focusTitle}</Text>
      </Card>
    </>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
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
  avatarDot: { width: 12, height: 12, borderRadius: radii.pill, backgroundColor: colors.primary },
  topBarTitle: { ...text.h3, color: colors.primaryDeep, letterSpacing: -0.4 },
  topBarIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryDeep },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },
  tab: {
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  tabText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.navInactive,
  },
  tabActive: { color: colors.primaryDeep },
  tabIndicator: {
    height: 2,
    backgroundColor: colors.primary,
    alignSelf: 'stretch',
    marginTop: 6,
    borderRadius: 1,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },

  heroBlock: { gap: spacing.xs, marginTop: spacing.sm },
  heroEyebrow: { ...text.eyebrow, color: colors.primary },
  heroValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  heroValue: {
    fontFamily: fonts.bold,
    fontSize: 44,
    letterSpacing: -1,
    color: colors.text,
  },
  heroSuffix: { ...text.h3, color: colors.textMuted, fontFamily: fonts.regular },
  heroBody: { ...text.body, color: colors.textBody },

  heroPill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    ...shadows.ctaSoft,
    marginBottom: spacing.sm,
  },
  heroPillActive: { backgroundColor: colors.primary },
  heroPillDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.mint },
  heroPillText: { ...text.body, color: colors.textOnDark },

  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardCream: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorderTan,
  },
  cardWhite: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(193, 201, 187, 0.15)',
    ...shadows.card,
  },
  cardMoss: {
    backgroundColor: colors.primaryMoss,
    padding: spacing.lg,
  },
  cardTitle: { ...text.h2, color: colors.text },
  cardTitleOnMoss: { color: colors.textOnDark },
  cardSubtitle: { ...text.body, color: colors.textBody, opacity: 0.85 },

  mossEyebrow: {
    fontFamily: fonts.regular,
    fontSize: 14,
    letterSpacing: 0.7,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  mossValue: {
    fontFamily: fonts.bold,
    fontSize: 32,
    letterSpacing: -0.6,
    color: colors.textOnDark,
    marginVertical: spacing.xs,
  },
  mossBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textOnDark,
    opacity: 0.92,
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statLabel: { ...text.body, color: colors.textBody },
  statValue: { ...text.body, color: colors.text, fontFamily: fonts.semibold },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  summaryTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceTile,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    minHeight: 96,
  },
  summaryLabel: { ...text.body, color: colors.textMuted },
  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    letterSpacing: -0.4,
    color: colors.text,
  },

  titleValue: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.primary,
  },

  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...text.h2, color: colors.text },
  bodyMuted: { ...text.body, color: colors.textMuted, textAlign: 'center' },

  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  milestoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  milestoneDotOn: { backgroundColor: colors.primary },
  milestoneLabel: { ...text.body, color: colors.text, flex: 1 },
  milestoneLabelLocked: { color: colors.textMuted },
  milestoneDate: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
});
