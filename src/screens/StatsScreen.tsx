import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContributionGraph } from '../components/ContributionGraph';
import { HourBars } from '../components/HourBars';
import { LengthHistogram } from '../components/LengthHistogram';
import { loadStatsBundle, type StatsBundle } from '../db';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';
import { formatFocusTime } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;
type Tab = 'today' | 'week' | 'all';

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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Stats</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.tabs}>
        {(['today', 'week', 'all'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={styles.tab}>
            <Text style={[styles.tabText, tab === t && styles.tabActive]}>
              {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'All Time'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!data ? (
          <Text style={styles.emptyText}>Loading…</Text>
        ) : empty ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>
              Start a session to begin tracking your focus.
            </Text>
          </View>
        ) : tab === 'today' ? (
          <TodayView data={data} />
        ) : tab === 'week' ? (
          <WeekView data={data} />
        ) : (
          <AllTimeView data={data} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
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
  const { today } = data;
  return (
    <Card title="Today">
      <StatRow label="Started" value={today.startedToday ? 'Yes' : 'Not yet'} />
      <StatRow label="Focus time" value={formatFocusTime(today.totalFocusSeconds)} />
      <StatRow
        label="First session"
        value={today.firstStartTimestamp ? formatHourLabel(today.firstStartTimestamp) : '—'}
      />
    </Card>
  );
}

function WeekView({ data }: { data: StatsBundle }) {
  return (
    <>
      <Card title="Last 7 days">
        <ContributionGraph days={data.contribution} />
        <View style={styles.legend}>
          <LegendDot color={colors.border} label="None" />
          <LegendDot color="#3D5BCB" label="Started" />
          <LegendDot color={colors.success} label="Converted" />
        </View>
      </Card>
    </>
  );
}

function AllTimeView({ data }: { data: StatsBundle }) {
  const { allTime, hourCounts, lengthBuckets } = data;
  const conversionPct = Math.round(allTime.conversionRate * 100);
  return (
    <>
      <Card title="All time">
        <StatRow label="Sessions" value={String(allTime.totalSessions)} />
        <StatRow label="Total focus" value={formatFocusTime(allTime.totalFocusSeconds)} />
        <StatRow label="Avg session" value={formatFocusTime(allTime.averageSessionSeconds)} />
        <StatRow label="Conversion rate" value={`${conversionPct}%`} />
      </Card>
      <Card title="Best time of day">
        <HourBars counts={hourCounts} />
      </Card>
      <Card title="Session length">
        <LengthHistogram buckets={lengthBuckets} />
      </Card>
    </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: { color: colors.primary, fontSize: 16, width: 50 },
  title: { color: colors.text, fontSize: 20, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { color: colors.textMuted, fontSize: 14, letterSpacing: 0.5 },
  tabActive: { color: colors.text, fontWeight: '600' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  statLabel: { color: colors.textMuted, fontSize: 14 },
  statValue: { color: colors.text, fontSize: 16, fontWeight: '500' },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { color: colors.textMuted, fontSize: 11 },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
