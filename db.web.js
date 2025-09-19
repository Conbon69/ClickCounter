// Web fallback for SQLite using localStorage. This emulates the minimal subset
// of SQL used by the app so the web build does not require the wasm module.

const STORAGE_KEY = 'counters_storage_v1';

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { counters: {} };
  } catch (_e) {
    return { counters: {} };
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_e) {
    // ignore storage errors on web
  }
}

const db = {
  transaction(callback, onError, onSuccess) {
    try {
      const state = loadState();

      const tx = {
        executeSql(sql, params = [], successCb) {
          const normalized = String(sql).trim().toUpperCase();

          // CREATE TABLE IF NOT EXISTS counters (...)
          if (normalized.startsWith('CREATE TABLE')) {
            successCb && successCb(tx, { rowsAffected: 0, rows: { _array: [] } });
            return;
          }

          // INSERT OR IGNORE INTO counters (date, count) VALUES (?, 0)
          if (normalized.startsWith('INSERT OR IGNORE INTO COUNTERS')) {
            const date = params[0];
            if (!state.counters[date]) {
              state.counters[date] = 0;
              saveState(state);
            }
            successCb && successCb(tx, { rowsAffected: 1, rows: { _array: [] } });
            return;
          }

          // INSERT INTO counters (date, count) VALUES (?, ?)
          if (normalized.startsWith('INSERT INTO COUNTERS')) {
            const [date, count] = params;
            state.counters[date] = Number(count) || 0;
            saveState(state);
            successCb && successCb(tx, { rowsAffected: 1, rows: { _array: [] } });
            return;
          }

          // UPDATE counters SET count = count + ? WHERE date = ?
          if (normalized.startsWith('UPDATE COUNTERS SET COUNT = COUNT +')) {
            const [amount, date] = params;
            if (state.counters[date] == null) {
              // emulate rowsAffected = 0 when row missing
              successCb && successCb(tx, { rowsAffected: 0, rows: { _array: [] } });
              return;
            }
            state.counters[date] = (Number(state.counters[date]) || 0) + Number(amount || 0);
            saveState(state);
            successCb && successCb(tx, { rowsAffected: 1, rows: { _array: [] } });
            return;
          }

          // SELECT date, count FROM counters WHERE date = ? LIMIT 1
          if (normalized.startsWith('SELECT DATE, COUNT FROM COUNTERS WHERE DATE =')) {
            const [date] = params;
            const row = state.counters[date] != null ? { date, count: state.counters[date] } : undefined;
            successCb && successCb(tx, { rowsAffected: 0, rows: { _array: row ? [row] : [] } });
            return;
          }

          // SELECT date, count FROM counters ORDER BY DATE ASC
          if (normalized.startsWith('SELECT DATE, COUNT FROM COUNTERS ORDER BY DATE ASC')) {
            const arr = Object.keys(state.counters)
              .sort((a, b) => a.localeCompare(b))
              .map((date) => ({ date, count: state.counters[date] }));
            successCb && successCb(tx, { rowsAffected: 0, rows: { _array: arr } });
            return;
          }

          throw new Error('Unsupported SQL in web fallback: ' + sql);
        },
      };

      callback(tx);
      onSuccess && onSuccess();
    } catch (e) {
      onError && onError(e);
    }
  },
};

export default db;


