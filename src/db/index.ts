import * as SQLite from 'expo-sqlite';

const DB_NAME = 'just5.db';

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
      return db;
    });
  }
  return dbPromise;
}

export type SessionRow = {
  id: number;
  started_at: number;
  ended_at: number;
  duration_seconds: number;
  converted: number;
};

export type StreakState = {
  current_daily: number;
  last_started_date: string | null;
};

export type HomeStats = {
  totalSessions: number;
  totalFocusSeconds: number;
  currentDailyStreak: number;
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

export async function recordSession(params: {
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  converted: boolean;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO sessions (started_at, ended_at, duration_seconds, converted) VALUES (?, ?, ?, ?)',
    params.startedAt,
    params.endedAt,
    params.durationSeconds,
    params.converted ? 1 : 0,
  );

  const todayKey = toLocalDateKey(params.startedAt);
  const state = await db.getFirstAsync<StreakState>(
    'SELECT current_daily, last_started_date FROM streak_state WHERE id = 1',
  );

  let nextStreak = 1;
  if (state?.last_started_date) {
    if (state.last_started_date === todayKey) {
      nextStreak = state.current_daily;
    } else {
      const diff = dayDiffInDays(state.last_started_date, todayKey);
      nextStreak = diff === 1 ? state.current_daily + 1 : 1;
    }
  }

  await db.runAsync(
    'UPDATE streak_state SET current_daily = ?, last_started_date = ? WHERE id = 1',
    nextStreak,
    todayKey,
  );
}

export async function loadHomeStats(): Promise<HomeStats> {
  const db = await getDb();
  const totals = await db.getFirstAsync<{ count: number; total: number | null }>(
    'SELECT COUNT(*) AS count, SUM(duration_seconds) AS total FROM sessions',
  );
  const state = await db.getFirstAsync<StreakState>(
    'SELECT current_daily, last_started_date FROM streak_state WHERE id = 1',
  );

  let currentDailyStreak = state?.current_daily ?? 0;
  if (state?.last_started_date && currentDailyStreak > 0) {
    const todayKey = toLocalDateKey(Date.now());
    const diff = dayDiffInDays(state.last_started_date, todayKey);
    if (diff > 1) currentDailyStreak = 0;
  }

  return {
    totalSessions: totals?.count ?? 0,
    totalFocusSeconds: totals?.total ?? 0,
    currentDailyStreak,
  };
}
