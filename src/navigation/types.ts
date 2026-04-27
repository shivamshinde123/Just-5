export type RootStackParamList = {
  Home: undefined;
  Timer: { startedAt: number };
  SessionEnd: { startedAt: number; reachedFiveAt: number };
  Stats: undefined;
};
