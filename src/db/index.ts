import * as SQLite from 'expo-sqlite';
import { deriveFocusTitle, type FocusTitle, type MilestoneKey } from '../gamification';

const DB_NAME = 'just5.db';
const MAX_GRACES = 3;
const GRACE_EARN_INTERVAL = 7;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          started_at INTEGER NOT NULL,
          ended_at INTEGER NOT NULL,
          duration_seconds INTEGER NOT NULL,
          converted INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS streak_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          current_daily INTEGER NOT NULL DEFAULT 0,
          last_started_date TEXT
        );
        INSERT OR IGNORE INTO streak_state (id, current_daily, last_started_date)
          VALUES (1, 0, NULL);
        CREATE TABLE IF NOT EXISTS milestones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          achieved_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          display_name TEXT NOT NULL DEFAULT 'You',
          joined_at INTEGER NOT NULL,
          sound_enabled INTEGER NOT NULL DEFAULT 1,
          haptics_enabled INTEGER NOT NULL DEFAULT 1
        );
        INSERT OR IGNORE INTO user_profile (id, display_name, joined_at, sound_enabled, haptics_enabled)
          VALUES (1, 'You', strftime('%s','now') * 1000, 1, 1);
      `);
      await migrateStreakState(db);
      return db;
    });
  }
  return dbPromise;
}

export type UserProfile = {
  displayName: string;
  joinedAt: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

export async function loadUserProfile(): Promise<UserProfile> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    display_name: string;
    joined_at: number;
    sound_enabled: number;
    haptics_enabled: number;
  }>(
    'SELECT display_name, joined_at, sound_enabled, haptics_enabled FROM user_profile WHERE id = 1',
  );
  return {
    displayName: row?.display_name ?? 'You',
    joinedAt: row?.joined_at ?? Date.now(),
    soundEnabled: (row?.sound_enabled ?? 1) === 1,
    hapticsEnabled: (row?.haptics_enabled ?? 1) === 1,
  };
}

export async function updateDisplayName(name: string): Promise<void> {
  const db = await getDb();
  const trimmed = name.trim().slice(0, 40) || 'You';
  await db.runAsync('UPDATE user_profile SET display_name = ? WHERE id = 1', trimmed);
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE user_profile SET sound_enabled = ? WHERE id = 1', enabled ? 1 : 0);
}

export async function setHapticsEnabled(enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE user_profile SET haptics_enabled = ? WHERE id = 1',
    enabled ? 1 : 0,
  );
}

export async function resetAllData(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM sessions');
    await db.runAsync('DELETE FROM milestones');
    await db.runAsync(
      `UPDATE streak_state SET
         current_daily = 0, best_daily = 0, last_started_date = NULL,
         current_conversion = 0, best_conversion = 0, last_converted_date = NULL,
         graces_available = 0, graces_earned_at_streak = 0
       WHERE id = 1`,
    );
  });
}

async function migrateStreakState(db: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(streak_state)');
  const has = (n: string) => cols.some((c) => c.name === n);

  if (!has('best_daily')) {
    await db.execAsync('ALTER TABLE streak_state ADD COLUMN best_daily INTEGER NOT NULL DEFAULT 0');
  }
  if (!has('current_conversion')) {
    await db.execAsync(
      'ALTER TABLE streak_state ADD COLUMN current_conversion INTEGER NOT NULL DEFAULT 0',
    );
  }
  if (!has('best_conversion')) {
    await db.execAsync(
      'ALTER TABLE streak_state ADD COLUMN best_conversion INTEGER NOT NULL DEFAULT 0',
    );
  }
  if (!has('last_converted_date')) {
    await db.execAsync('ALTER TABLE streak_state ADD COLUMN last_converted_date TEXT');
  }
  if (!has('graces_available')) {
    await db.execAsync(
      'ALTER TABLE streak_state ADD COLUMN graces_available INTEGER NOT NULL DEFAULT 0',
    );
  }
  if (!has('graces_earned_at_streak')) {
    await db.execAsync(
      'ALTER TABLE streak_state ADD COLUMN graces_earned_at_streak INTEGER NOT NULL DEFAULT 0',
    );
  }

  await db.runAsync(
    'UPDATE streak_state SET best_daily = current_daily WHERE best_daily < current_daily',
  );
}

export type SessionRow = {
  id: number;
  started_at: number;
  ended_at: number;
  duration_seconds: number;
  converted: number;
};

export type StreakStateRow = {
  current_daily: number;
  best_daily: number;
  last_started_date: string | null;
  current_conversion: number;
  best_conversion: number;
  last_converted_date: string | null;
  graces_available: number;
  graces_earned_at_streak: number;
};

export type HomeStats = {
  totalSessions: number;
  totalFocusSeconds: number;
  currentDailyStreak: number;
  bestDailyStreak: number;
  currentConversionStreak: number;
  bestConversionStreak: number;
  gracesAvailable: number;
  focusTitle: FocusTitle;
  last7Days: ContributionDay[];
};

export type DayKind = 'none' | 'started' | 'converted';

export type ContributionDay = {
  dateKey: string;
  weekday: string;
  kind: DayKind;
  sessionCount: number;
};

export type TodayStats = {
  startedToday: boolean;
  totalFocusSeconds: number;
  firstStartTimestamp: number | null;
};

export type AllTimeStats = {
  totalSessions: number;
  totalFocusSeconds: number;
  averageSessionSeconds: number;
  conversionRate: number;
};

export type PersonalRecords = {
  longestSessionSeconds: number;
  longestDailyStreak: number;
  longestConversionStreak: number;
  mostFocusInDaySeconds: number;
  mostFocusInDayKey: string | null;
};

export type MonthCell = {
  dateKey: string;
  day: number;
  kind: DayKind;
  sessionCount: number;
  isToday: boolean;
};

export type MonthGrid = {
  monthLabel: string;
  cells: (MonthCell | null)[];
};

export type StatsBundle = {
  today: TodayStats;
  contribution: ContributionDay[];
  monthGrid: MonthGrid;
  allTime: AllTimeStats;
  hourCounts: number[];
  lengthBuckets: { label: string; minSec: number; maxSec: number; count: number }[];
  records: PersonalRecords;
  focusTitle: FocusTitle;
  unlockedMilestones: { key: MilestoneKey; achievedAt: number }[];
};

function toLocalDateKey(timestampMs: number): string {
  const d = new Date(timestampMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayDiffInDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const aMs = new Date(ay, am - 1, ad).getTime();
  const bMs = new Date(by, bm - 1, bd).getTime();
  return Math.round((bMs - aMs) / (1000 * 60 * 60 * 24));
}

function effectiveCurrentDaily(state: StreakStateRow, todayKey: string): number {
  if (!state.last_started_date || state.current_daily <= 0) return state.current_daily;
  const diff = dayDiffInDays(state.last_started_date, todayKey);
  if (diff <= 1) return state.current_daily;
  const missed = diff - 1;
  return state.graces_available >= missed ? state.current_daily : 0;
}

function effectiveCurrentConversion(state: StreakStateRow, todayKey: string): number {
  if (!state.last_converted_date || state.current_conversion <= 0) return state.current_conversion;
  const diff = dayDiffInDays(state.last_converted_date, todayKey);
  return diff > 1 ? 0 : state.current_conversion;
}

async function readStreakState(db: SQLite.SQLiteDatabase): Promise<StreakStateRow> {
  const row = await db.getFirstAsync<StreakStateRow>(
    `SELECT current_daily, best_daily, last_started_date,
            current_conversion, best_conversion, last_converted_date,
            graces_available, graces_earned_at_streak
     FROM streak_state WHERE id = 1`,
  );
  return (
    row ?? {
      current_daily: 0,
      best_daily: 0,
      last_started_date: null,
      current_conversion: 0,
      best_conversion: 0,
      last_converted_date: null,
      graces_available: 0,
      graces_earned_at_streak: 0,
    }
  );
}

function applyDailyOnSave(
  prev: StreakStateRow,
  todayKey: string,
): { current: number; graces: number; gracesEarnedAt: number } {
  if (!prev.last_started_date) {
    return { current: 1, graces: prev.graces_available, gracesEarnedAt: 0 };
  }
  if (prev.last_started_date === todayKey) {
    return {
      current: prev.current_daily,
      graces: prev.graces_available,
      gracesEarnedAt: prev.graces_earned_at_streak,
    };
  }
  const diff = dayDiffInDays(prev.last_started_date, todayKey);
  if (diff === 1) {
    return {
      current: prev.current_daily + 1,
      graces: prev.graces_available,
      gracesEarnedAt: prev.graces_earned_at_streak,
    };
  }
  if (diff > 1) {
    const missed = diff - 1;
    if (prev.graces_available >= missed) {
      return {
        current: prev.current_daily + 1,
        graces: prev.graces_available - missed,
        gracesEarnedAt: prev.graces_earned_at_streak,
      };
    }
  }
  return { current: 1, graces: prev.graces_available, gracesEarnedAt: 0 };
}

function applyConversionOnSave(
  prev: StreakStateRow,
  todayKey: string,
  converted: boolean,
): { current: number; lastDate: string | null } {
  if (!converted) {
    if (prev.last_converted_date === todayKey) {
      return { current: prev.current_conversion, lastDate: prev.last_converted_date };
    }
    return { current: 0, lastDate: prev.last_converted_date };
  }
  if (!prev.last_converted_date) {
    return { current: 1, lastDate: todayKey };
  }
  if (prev.last_converted_date === todayKey) {
    return { current: prev.current_conversion, lastDate: todayKey };
  }
  const diff = dayDiffInDays(prev.last_converted_date, todayKey);
  if (diff === 1) {
    return { current: prev.current_conversion + 1, lastDate: todayKey };
  }
  return { current: 1, lastDate: todayKey };
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfLocalDay(timestampMs: number): number {
  const d = new Date(timestampMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function maybeEarnGrace(
  newDailyStreak: number,
  gracesAvailable: number,
  gracesEarnedAtStreak: number,
): { graces: number; earnedAt: number } {
  const milestone = Math.floor(newDailyStreak / GRACE_EARN_INTERVAL) * GRACE_EARN_INTERVAL;
  if (milestone > gracesEarnedAtStreak) {
    return {
      graces: Math.min(MAX_GRACES, gracesAvailable + 1),
      earnedAt: milestone,
    };
  }
  return { graces: gracesAvailable, earnedAt: gracesEarnedAtStreak };
}

async function readUnlockedMilestoneKeys(db: SQLite.SQLiteDatabase): Promise<Set<MilestoneKey>> {
  const rows = await db.getAllAsync<{ key: MilestoneKey }>('SELECT key FROM milestones');
  return new Set(rows.map((r) => r.key));
}

async function unlockMilestones(
  db: SQLite.SQLiteDatabase,
  keys: MilestoneKey[],
  achievedAt: number,
): Promise<void> {
  for (const k of keys) {
    await db.runAsync(
      'INSERT OR IGNORE INTO milestones (key, achieved_at) VALUES (?, ?)',
      k,
      achievedAt,
    );
  }
}

export async function recordSession(params: {
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  converted: boolean;
}): Promise<{ newlyUnlocked: MilestoneKey[] }> {
  const db = await getDb();
  let newlyUnlocked: MilestoneKey[] = [];
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO sessions (started_at, ended_at, duration_seconds, converted) VALUES (?, ?, ?, ?)',
      params.startedAt,
      params.endedAt,
      params.durationSeconds,
      params.converted ? 1 : 0,
    );

    const todayKey = toLocalDateKey(params.startedAt);
    const prev = await readStreakState(db);

    const daily = applyDailyOnSave(prev, todayKey);
    const conv = applyConversionOnSave(prev, todayKey, params.converted);
    const grace = maybeEarnGrace(daily.current, daily.graces, daily.gracesEarnedAt);

    const nextBestDaily = Math.max(prev.best_daily, daily.current);
    const nextBestConversion = Math.max(prev.best_conversion, conv.current);

    await db.runAsync(
      `UPDATE streak_state SET
         current_daily = ?, best_daily = ?, last_started_date = ?,
         current_conversion = ?, best_conversion = ?, last_converted_date = ?,
         graces_available = ?, graces_earned_at_streak = ?
       WHERE id = 1`,
      daily.current,
      nextBestDaily,
      todayKey,
      conv.current,
      nextBestConversion,
      conv.lastDate,
      grace.graces,
      grace.earnedAt,
    );

    const totals = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM sessions',
    );
    const sessionCount = totals?.count ?? 0;
    const already = await readUnlockedMilestoneKeys(db);
    const candidates: MilestoneKey[] = [];
    if (sessionCount >= 1 && !already.has('first_session')) candidates.push('first_session');
    if (sessionCount >= 10 && !already.has('ten_sessions')) candidates.push('ten_sessions');
    if (params.durationSeconds >= 60 * 60 && !already.has('first_60min_session')) {
      candidates.push('first_60min_session');
    }
    if (daily.current >= 7 && !already.has('first_7_day_streak')) {
      candidates.push('first_7_day_streak');
    }
    if (daily.current >= 30 && !already.has('first_30_day_streak')) {
      candidates.push('first_30_day_streak');
    }
    if (candidates.length > 0) {
      await unlockMilestones(db, candidates, params.endedAt);
      newlyUnlocked = candidates;
    }
  });
  return { newlyUnlocked };
}

export async function loadHomeStats(): Promise<HomeStats> {
  const db = await getDb();
  const totals = await db.getFirstAsync<{
    count: number;
    total: number | null;
    converted: number | null;
  }>(
    'SELECT COUNT(*) AS count, SUM(duration_seconds) AS total, SUM(converted) AS converted FROM sessions',
  );
  const state = await readStreakState(db);
  const now = Date.now();
  const todayKey = toLocalDateKey(now);

  const currentDaily = effectiveCurrentDaily(state, todayKey);
  const currentConversion = effectiveCurrentConversion(state, todayKey);

  const totalSessions = totals?.count ?? 0;
  const conversionRate = totalSessions > 0 ? (totals?.converted ?? 0) / totalSessions : 0;

  const startToday = startOfLocalDay(now);
  const endToday = startToday + 24 * 60 * 60 * 1000;
  const start7Days = startToday - 6 * 24 * 60 * 60 * 1000;
  const weekRows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions WHERE started_at >= ? AND started_at < ? ORDER BY started_at ASC',
    start7Days,
    endToday,
  );
  const byDay = new Map<string, { count: number; converted: boolean }>();
  for (const r of weekRows) {
    const key = toLocalDateKey(r.started_at);
    const prev = byDay.get(key) ?? { count: 0, converted: false };
    byDay.set(key, {
      count: prev.count + 1,
      converted: prev.converted || r.converted === 1,
    });
  }
  const last7Days: ContributionDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dayMs = start7Days + i * 24 * 60 * 60 * 1000;
    const key = toLocalDateKey(dayMs);
    const entry = byDay.get(key);
    const kind: DayKind = !entry ? 'none' : entry.converted ? 'converted' : 'started';
    last7Days.push({
      dateKey: key,
      weekday: WEEKDAY_LABELS[new Date(dayMs).getDay()],
      kind,
      sessionCount: entry?.count ?? 0,
    });
  }

  return {
    totalSessions,
    totalFocusSeconds: totals?.total ?? 0,
    currentDailyStreak: currentDaily,
    bestDailyStreak: state.best_daily,
    currentConversionStreak: currentConversion,
    bestConversionStreak: state.best_conversion,
    gracesAvailable: state.graces_available,
    focusTitle: deriveFocusTitle({
      currentDailyStreak: currentDaily,
      conversionRate,
    }),
    last7Days,
  };
}

export async function loadStatsBundle(): Promise<StatsBundle> {
  const db = await getDb();
  const now = Date.now();
  const startToday = startOfLocalDay(now);
  const endToday = startToday + 24 * 60 * 60 * 1000;
  const start7Days = startToday - 6 * 24 * 60 * 60 * 1000;

  const todayRows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions WHERE started_at >= ? AND started_at < ? ORDER BY started_at ASC',
    startToday,
    endToday,
  );
  const today: TodayStats = {
    startedToday: todayRows.length > 0,
    totalFocusSeconds: todayRows.reduce((acc, r) => acc + r.duration_seconds, 0),
    firstStartTimestamp: todayRows[0]?.started_at ?? null,
  };

  const weekRows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions WHERE started_at >= ? AND started_at < ? ORDER BY started_at ASC',
    start7Days,
    endToday,
  );
  const byDay = new Map<string, { count: number; converted: boolean }>();
  for (const r of weekRows) {
    const key = toLocalDateKey(r.started_at);
    const prev = byDay.get(key) ?? { count: 0, converted: false };
    byDay.set(key, {
      count: prev.count + 1,
      converted: prev.converted || r.converted === 1,
    });
  }
  const contribution: ContributionDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dayMs = start7Days + i * 24 * 60 * 60 * 1000;
    const key = toLocalDateKey(dayMs);
    const entry = byDay.get(key);
    const kind: DayKind = !entry ? 'none' : entry.converted ? 'converted' : 'started';
    contribution.push({
      dateKey: key,
      weekday: WEEKDAY_LABELS[new Date(dayMs).getDay()],
      kind,
      sessionCount: entry?.count ?? 0,
    });
  }

  const allTotals = await db.getFirstAsync<{
    count: number;
    total: number | null;
    converted: number | null;
  }>(
    `SELECT COUNT(*) AS count,
            SUM(duration_seconds) AS total,
            SUM(converted) AS converted
     FROM sessions`,
  );
  const totalSessions = allTotals?.count ?? 0;
  const totalFocusSeconds = allTotals?.total ?? 0;
  const allTime: AllTimeStats = {
    totalSessions,
    totalFocusSeconds,
    averageSessionSeconds: totalSessions > 0 ? Math.round(totalFocusSeconds / totalSessions) : 0,
    conversionRate: totalSessions > 0 ? (allTotals?.converted ?? 0) / totalSessions : 0,
  };

  const allRows = await db.getAllAsync<{ started_at: number; duration_seconds: number }>(
    'SELECT started_at, duration_seconds FROM sessions',
  );

  const hourCounts = new Array(24).fill(0) as number[];
  const buckets = [
    { label: '<5m', minSec: 0, maxSec: 5 * 60, count: 0 },
    { label: '5–15m', minSec: 5 * 60, maxSec: 15 * 60, count: 0 },
    { label: '15–30m', minSec: 15 * 60, maxSec: 30 * 60, count: 0 },
    { label: '30–45m', minSec: 30 * 60, maxSec: 45 * 60, count: 0 },
    { label: '45m+', minSec: 45 * 60, maxSec: Infinity, count: 0 },
  ];
  let longestSessionSeconds = 0;
  const focusByDay = new Map<string, number>();

  for (const r of allRows) {
    hourCounts[new Date(r.started_at).getHours()] += 1;
    const s = r.duration_seconds;
    for (const b of buckets) {
      if (s >= b.minSec && s < b.maxSec) {
        b.count += 1;
        break;
      }
    }
    if (s > longestSessionSeconds) longestSessionSeconds = s;
    const dayKey = toLocalDateKey(r.started_at);
    focusByDay.set(dayKey, (focusByDay.get(dayKey) ?? 0) + s);
  }

  let mostFocusInDaySeconds = 0;
  let mostFocusInDayKey: string | null = null;
  for (const [key, total] of focusByDay) {
    if (total > mostFocusInDaySeconds) {
      mostFocusInDaySeconds = total;
      mostFocusInDayKey = key;
    }
  }

  const state = await readStreakState(db);
  const todayKey = toLocalDateKey(now);

  const records: PersonalRecords = {
    longestSessionSeconds,
    longestDailyStreak: state.best_daily,
    longestConversionStreak: state.best_conversion,
    mostFocusInDaySeconds,
    mostFocusInDayKey,
  };

  const focusTitle = deriveFocusTitle({
    currentDailyStreak: effectiveCurrentDaily(state, todayKey),
    conversionRate: allTime.conversionRate,
  });

  const milestoneRows = await db.getAllAsync<{ key: MilestoneKey; achieved_at: number }>(
    'SELECT key, achieved_at FROM milestones ORDER BY achieved_at ASC',
  );

  const monthGrid = await loadMonthGrid(db, now);

  return {
    today,
    contribution,
    monthGrid,
    allTime,
    hourCounts,
    lengthBuckets: buckets,
    records,
    focusTitle,
    unlockedMilestones: milestoneRows.map((m) => ({ key: m.key, achievedAt: m.achieved_at })),
  };
}

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

async function loadMonthGrid(
  db: SQLite.SQLiteDatabase,
  nowMs: number,
): Promise<MonthGrid> {
  const now = new Date(nowMs);
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startMs = firstOfMonth.getTime();
  const endMs = new Date(year, month + 1, 1).getTime();
  const todayKey = toLocalDateKey(nowMs);

  const monthRows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions WHERE started_at >= ? AND started_at < ? ORDER BY started_at ASC',
    startMs,
    endMs,
  );
  const byDay = new Map<string, { count: number; converted: boolean }>();
  for (const r of monthRows) {
    const key = toLocalDateKey(r.started_at);
    const prev = byDay.get(key) ?? { count: 0, converted: false };
    byDay.set(key, {
      count: prev.count + 1,
      converted: prev.converted || r.converted === 1,
    });
  }

  const totalCells = 42;
  const cells: (MonthCell | null)[] = new Array(totalCells).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const idx = firstWeekday + (day - 1);
    if (idx >= totalCells) break;
    const dayDate = new Date(year, month, day);
    const key = toLocalDateKey(dayDate.getTime());
    const entry = byDay.get(key);
    const kind: DayKind = !entry ? 'none' : entry.converted ? 'converted' : 'started';
    cells[idx] = {
      dateKey: key,
      day,
      kind,
      sessionCount: entry?.count ?? 0,
      isToday: key === todayKey,
    };
  }

  return {
    monthLabel: `${MONTH_LABELS[month]} ${year}`,
    cells,
  };
}
