import type { MilestoneKey } from '../gamification';

export type RootStackParamList = {
  Home: { unlockedMilestones?: MilestoneKey[] } | undefined;
  Timer: { startedAt: number };
  SessionEnd: { startedAt: number; reachedFiveAt: number };
  Stats: undefined;
};
