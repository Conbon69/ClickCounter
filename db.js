import SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('counter.db');

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initialize table and seed today's row with count = 0 if not present
db.transaction((tx) => {
  tx.executeSql(
    'CREATE TABLE IF NOT EXISTS counters (date TEXT PRIMARY KEY, count INTEGER)'
  );
  tx.executeSql(
    'CREATE TABLE IF NOT EXISTS increments (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, hour INTEGER NOT NULL, iso TEXT NOT NULL, amount INTEGER NOT NULL)'
  );
  tx.executeSql('CREATE INDEX IF NOT EXISTS idx_increments_date ON increments(date)');
  tx.executeSql(
    'INSERT OR IGNORE INTO counters (date, count) VALUES (?, 0)',
    [getTodayDateString()]
  );
});

export default db;


