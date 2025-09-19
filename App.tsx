import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { initDB, incrementTodayCount, getDailyAnalytics } from './counterService';

export default function App() {
  const [todayCount, setTodayCount] = useState<number>(0);
  const [last7Days, setLast7Days] = useState<Array<{ date: string; count: number }>>([]);

  function getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    (async () => {
      try {
        await initDB();
        const analytics = await getDailyAnalytics();
        const today = getTodayDateString();
        const todayRow = analytics.find((r: any) => r.date === today);
        setTodayCount(todayRow?.count ?? 0);
        const last7 = analytics.slice(Math.max(analytics.length - 7, 0));
        setLast7Days(last7);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleIncrement = async () => {
    try {
      const { count } = await incrementTodayCount(1);
      setTodayCount(count);
      const analytics = await getDailyAnalytics();
      const last7 = analytics.slice(Math.max(analytics.length - 7, 0));
      setLast7Days(last7);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Count</Text>
      <Text style={styles.count}>{todayCount}</Text>
      <View style={styles.buttonRow}>
        <Button title="Increment" onPress={handleIncrement} />
      </View>
      <View style={styles.analytics}>
        <Text style={styles.subtitle}>Last 7 Days</Text>
        {last7Days.map((row) => (
          <Text key={row.date} style={styles.analyticsRow}>{row.date}: {row.count}</Text>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  count: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 16,
  },
  buttonRow: {
    marginBottom: 24,
  },
  analytics: {
    width: '80%',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  analyticsRow: {
    fontSize: 16,
    marginBottom: 4,
  },
});
