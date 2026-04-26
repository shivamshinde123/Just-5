import * as SQLite from 'expo-sqlite';

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
      `);
      await migrateStreakState(db);
      return db;
    });
  }
  return dbPromise;
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

export type StatsBundle = {
  today: TodayStats;
  contribution: ContributionDay[];
  allTime: AllTimeStats;
  hourCounts: number[];
  lengthBuckets: { label: string; minSec: number; maxSec: number; count: number }[];
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

export async function recordSession(params: {
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  converted: boolean;
}): Promise<void> {
  const db = await getDb();
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
  });
}

export async function loadHomeStats(): Promise<HomeStats> {
  const db = await getDb();
  const totals = await db.getFirstAsync<{ count: number; total: number | null }>(
    'SELECT COUNT(*) AS count, SUM(duration_seconds) AS total FROM sessions',
  );
  const state = await readStreakState(db);
  const todayKey = toLocalDateKey(Date.now());

  let currentDaily = state.current_daily;
  if (state.last_started_date && currentDaily > 0) {
    const diff = dayDiffInDays(state.last_started_date, todayKey);
    if (diff > 1) {
      const missed = diff - 1;
      if (state.graces_available < missed) {
        currentDaily = 0;
      }
    }
  }

  let currentConversion = state.current_conversion;
  if (state.last_converted_date && currentConversion > 0) {
    const diff = dayDiffInDays(state.last_converted_date, todayKey);
    if (diff > 1) currentConversion = 0;
  }

  return {
    totalSessions: totals?.count ?? 0,
    totalFocusSeconds: totals?.total ?? 0,
    currentDailyStreak: currentDaily,
    bestDailyStreak: state.best_daily,
    currentConversionStreak: currentConversion,
    bestConversionStreak: state.best_conversion,
    gracesAvailable: state.graces_available,
  };
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfLocalDay(timestampMs: number): number {
  const d = new Date(timestampMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
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
    converted: number;
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
  for (const r of allRows) {
    const h = new Date(r.started_at).getHours();
    hourCounts[h] += 1;
  }

  const buckets = [
    { label: '5–15m', minSec: 0, maxSec: 15 * 60, count: 0 },
    { label: '15–30m', minSec: 15 * 60, maxSec: 30 * 60, count: 0 },
    { label: '30–45m', minSec: 30 * 60, maxSec: 45 * 60, count: 0 },
    { label: '45m+', minSec: 45 * 60, maxSec: Infinity, count: 0 },
  ];
  for (const r of allRows) {
    const s = r.duration_seconds;
    for (const b of buckets) {
      if (s >= b.minSec && s < b.maxSec) {
        b.count += 1;
        break;
      }
    }
  }

  return {
    today,
    contribution,
    allTime,
    hourCounts,
    lengthBuckets: buckets,
  };
}
