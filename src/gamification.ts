export type FocusTitle = 'Warming Up' | 'In The Zone' | 'Flow State';

export type MilestoneKey =
  | 'first_session'
  | 'ten_sessions'
  | 'first_60min_session'
  | 'first_7_day_streak'
  | 'first_30_day_streak';

export const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  first_session: 'First session',
  ten_sessions: '10 sessions',
  first_60min_session: '60+ minute session',
  first_7_day_streak: '7-day streak',
  first_30_day_streak: '30-day streak',
};

export function deriveFocusTitle(input: {
  currentDailyStreak: number;
  conversionRate: number;
}): FocusTitle {
  if (input.currentDailyStreak >= 30 && input.conversionRate >= 0.7) return 'Flow State';
  if (input.currentDailyStreak >= 7) return 'In The Zone';
  return 'Warming Up';
}
