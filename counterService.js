import db from './db';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * initDB
 * Ensures the `counters` table exists and seeds today's row to 0 if missing.
 *
 * Example:
 *   initDB().then(() => console.log('ready'))
 *           .catch(err => console.error(err));
 * Expected:
 *   resolves to undefined on success.
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS counters (date TEXT PRIMARY KEY, count INTEGER)'
          );
          tx.executeSql(
            'INSERT OR IGNORE INTO counters (date, count) VALUES (?, 0)',
            [getTodayDateString()]
          );
        },
        (error) => reject(new Error(`initDB: failed to initialize database: ${error?.message || String(error)}`)),
        () => resolve()
      );
    } catch (error) {
      reject(new Error(`initDB: unexpected error: ${error?.message || String(error)}`));
    }
  });
}

/**
 * incrementTodayCount
 * Increments today's counter by a positive integer amount (default 1).
 *
 * Example:
 *   incrementTodayCount(1).then(({ date, count }) => console.log(date, count));
 * Expected:
 *   resolves to { date: 'YYYY-MM-DD', count: <newTotal> } for today after increment.
 */
export function incrementTodayCount(amount = 1) {
  return new Promise((resolve, reject) => {
    try {
      if (!Number.isInteger(amount) || amount <= 0) {
        reject(new Error('incrementTodayCount: amount must be a positive integer'));
        return;
      }
      const today = getTodayDateString();
      db.transaction(
        (tx) => {
          // Ensure today's row exists, then update
          tx.executeSql(
            'INSERT OR IGNORE INTO counters (date, count) VALUES (?, 0)',
            [today]
          );
          tx.executeSql(
            'UPDATE counters SET count = count + ? WHERE date = ?;',
            [amount, today],
            (_tx, result) => {
              if (result.rowsAffected === 0) {
                // Fallback if row did not exist for some reason
                _tx.executeSql(
                  'INSERT INTO counters (date, count) VALUES (?, ?);',
                  [today, amount]
                );
              }
            }
          );
          tx.executeSql(
            'SELECT date, count FROM counters WHERE date = ? LIMIT 1;',
            [today],
            (_tx, { rows }) => {
              const row = rows?._array?.[0];
              resolve({ date: row?.date || today, count: row?.count ?? amount });
            }
          );
        },
        (error) => reject(new Error(`incrementTodayCount: database error: ${error?.message || String(error)}`))
      );
    } catch (error) {
      reject(new Error(`incrementTodayCount: unexpected error: ${error?.message || String(error)}`));
    }
  });
}

/**
 * resetCountsAtMidnight
 * Schedules an automatic insert/ensure of a new row for the next local midnight
 * so that the day starts at 0. Returns an object with a cancel() method.
 *
 * Example:
 *   resetCountsAtMidnight().then(({ cancel }) => { // call cancel() to stop });
 * Expected:
 *   resolves to { cancel: Function } immediately; at midnight, it ensures a new
 *   row for the new date with count = 0 and reschedules for the following night.
 */
export function resetCountsAtMidnight() {
  return new Promise((resolve, reject) => {
    try {
      const scheduleNext = () => {
        const now = new Date();
        const next = new Date(now);
        next.setHours(24, 0, 0, 0); // next local midnight
        const delay = Math.max(0, next.getTime() - now.getTime());

        timeoutId = setTimeout(() => {
          const newDate = getTodayDateString();
          db.transaction(
            (tx) => {
              tx.executeSql(
                'INSERT OR IGNORE INTO counters (date, count) VALUES (?, 0)',
                [newDate]
              );
            },
            // On error, we still reschedule to avoid stopping the daily setup
            () => scheduleNext(),
            () => scheduleNext()
          );
        }, delay);
      };

      let timeoutId = null;
      scheduleNext();
      resolve({ cancel: () => timeoutId && clearTimeout(timeoutId) });
    } catch (error) {
      reject(new Error(`resetCountsAtMidnight: unexpected error: ${error?.message || String(error)}`));
    }
  });
}

/**
 * getDailyAnalytics
 * Returns all daily counts as an array of { date, count }, ordered ascending by date.
 *
 * Example:
 *   getDailyAnalytics().then(rows => console.log(rows));
 * Expected:
 *   resolves to e.g. [ { date: '2025-09-18', count: 12 }, { date: '2025-09-19', count: 4 } ]
 */
export function getDailyAnalytics() {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'SELECT date, count FROM counters ORDER BY date ASC;',
            [],
            (_tx, { rows }) => resolve(rows?._array || [])
          );
        },
        (error) => reject(new Error(`getDailyAnalytics: database error: ${error?.message || String(error)}`))
      );
    } catch (error) {
      reject(new Error(`getDailyAnalytics: unexpected error: ${error?.message || String(error)}`));
    }
  });
}

/**
 * getTimeOfDayTrends
 * NOTE: With the current schema (date/count only), per-hour trends cannot be
 * computed historically. This function returns a zeroed 24-bucket trend for
 * the current day as a placeholder until per-increment timestamps are stored.
 *
 * Example:
 *   getTimeOfDayTrends().then(trend => console.log(trend[0]));
 * Expected:
 *   resolves to an array of 24 objects like { hour: 0..23, count: 0 } for today.
 */
export function getTimeOfDayTrends() {
  return new Promise((resolve, reject) => {
    try {
      const trend = Array.from({ length: 24 }, (_v, hour) => ({ hour, count: 0 }));
      resolve(trend);
    } catch (error) {
      reject(new Error(`getTimeOfDayTrends: unexpected error: ${error?.message || String(error)}`));
    }
  });
}


