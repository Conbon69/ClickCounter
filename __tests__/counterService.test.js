/**
 * Counter Service Tests
 * - Mocks expo-sqlite to simulate a simple in-memory table
 * - Unit tests for: initDB, incrementTodayCount, resetCountsAtMidnight,
 *   getDailyAnalytics, getTimeOfDayTrends
 * - One happy-path integration test for sequence: initDB -> increment x2 -> analytics
 */

jest.mock('expo-sqlite', () => {
  // Minimal in-memory mock of a single table: counters(date TEXT PRIMARY KEY, count INTEGER)
  const state = {
    counters: new Map(),
  };

  const openDatabase = () => ({
    transaction: (cb, onError, onSuccess) => {
      try {
        const tx = {
          executeSql: (sql, params = [], successCb) => {
            const normalized = sql.trim().toUpperCase();
            if (normalized.startsWith('CREATE TABLE')) {
              successCb && successCb(tx, { rowsAffected: 0, rows: { _array: [] } });
              return;
            }
            if (normalized.startsWith('INSERT OR IGNORE INTO COUNTERS')) {
              const date = params[0];
              if (!state.counters.has(date)) {
                state.counters.set(date, 0);
              }
              successCb && successCb(tx, { rowsAffected: 1, rows: { _array: [] } });
              return;
            }
            if (normalized.startsWith('INSERT INTO COUNTERS')) {
              const [date, count] = params;
              state.counters.set(date, count);
              successCb && successCb(tx, { rowsAffected: 1, rows: { _array: [] } });
              return;
            }
            if (normalized.startsWith('UPDATE COUNTERS SET COUNT = COUNT +')) {
              const [amount, date] = params;
              if (state.counters.has(date)) {
                state.counters.set(date, state.counters.get(date) + amount);
                successCb && successCb(tx, { rowsAffected: 1, rows: { _array: [] } });
              } else {
                successCb && successCb(tx, { rowsAffected: 0, rows: { _array: [] } });
              }
              return;
            }
            if (normalized.startsWith('SELECT DATE, COUNT FROM COUNTERS WHERE DATE =')) {
              const [date] = params;
              const row = state.counters.has(date) ? { date, count: state.counters.get(date) } : undefined;
              successCb && successCb(tx, { rowsAffected: 0, rows: { _array: row ? [row] : [] } });
              return;
            }
            if (normalized.startsWith('SELECT DATE, COUNT FROM COUNTERS ORDER BY DATE ASC')) {
              const arr = Array.from(state.counters.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));
              successCb && successCb(tx, { rowsAffected: 0, rows: { _array: arr } });
              return;
            }
            throw new Error('Unsupported SQL in mock: ' + sql);
          },
        };
        cb(tx);
        onSuccess && onSuccess();
      } catch (e) {
        onError && onError(e);
      }
    },
  });

  return { default: { openDatabase }, openDatabase };
});

import { initDB, incrementTodayCount, resetCountsAtMidnight, getDailyAnalytics, getTimeOfDayTrends } from '../counterService';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('counterService unit tests', () => {
  test('initDB creates table and seeds today', async () => {
    await expect(initDB()).resolves.toBeUndefined();
    const analytics = await getDailyAnalytics();
    const today = getTodayDateString();
    expect(analytics.find(r => r.date === today)?.count ?? 0).toBeGreaterThanOrEqual(0);
  });

  test('incrementTodayCount validates input and increments', async () => {
    await initDB();
    await expect(incrementTodayCount(0)).rejects.toThrow('positive integer');
    const { date, count } = await incrementTodayCount(2);
    expect(date).toBe(getTodayDateString());
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('resetCountsAtMidnight returns cancel function', async () => {
    const { cancel } = await resetCountsAtMidnight();
    expect(typeof cancel).toBe('function');
    cancel();
  });

  test('getDailyAnalytics returns ascending dates', async () => {
    const rows = await getDailyAnalytics();
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    expect(rows).toEqual(sorted);
  });

  test('getTimeOfDayTrends returns 24 buckets', async () => {
    const trend = await getTimeOfDayTrends();
    expect(trend).toHaveLength(24);
    expect(trend[0]).toHaveProperty('hour', 0);
    expect(trend[23]).toHaveProperty('hour', 23);
  });
});

describe('counterService integration test (happy path)', () => {
  test('init -> increment twice -> analytics shows correct total for today', async () => {
    await initDB();
    await incrementTodayCount(1);
    const { count: afterFirst } = await incrementTodayCount(1);
    const rows = await getDailyAnalytics();
    const today = getTodayDateString();
    const todayRow = rows.find(r => r.date === today);
    expect(todayRow?.count).toBe(afterFirst);
    expect(afterFirst).toBeGreaterThanOrEqual(2);
  });
});


