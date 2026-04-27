import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MilestoneKey } from '../gamification';

export type MainTabParamList = {
  Home: { unlockedMilestones?: MilestoneKey[] } | undefined;
  Stats: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Timer: { startedAt: number };
  SessionEnd: { startedAt: number; reachedFiveAt: number };
  Settings: undefined;
};
