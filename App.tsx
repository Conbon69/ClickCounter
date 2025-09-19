import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, SafeAreaView, ScrollView } from 'react-native';
import { initDB, incrementTodayCount, getDailyAnalytics, getTimeOfDayTrends, resetTodayCount } from './counterService';

export default function App() {
  const [todayCount, setTodayCount] = useState<number>(0);
  const [last7Days, setLast7Days] = useState<Array<{ date: string; count: number }>>([]);
  const [hourlyTrend, setHourlyTrend] = useState<Array<{ hour: number; count: number }>>([]);

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
        const trend = await getTimeOfDayTrends();
        setHourlyTrend(trend);
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
      const trend = await getTimeOfDayTrends();
      setHourlyTrend(trend);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      const { count } = await resetTodayCount();
      setTodayCount(count);
      const analytics = await getDailyAnalytics();
      const last7 = analytics.slice(Math.max(analytics.length - 7, 0));
      setLast7Days(last7);
      const trend = await getTimeOfDayTrends();
      setHourlyTrend(trend);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Today's Count</Text>
        <Text style={styles.count} accessibilityRole="header" accessibilityLabel={`Today's count is ${todayCount}`}>{todayCount}</Text>

        <View style={styles.buttonRow}>
          <Button title="Increment" onPress={handleIncrement} accessibilityLabel="Increment today's count" />
          <View style={{ height: 12 }} />
          <Button color="#cc0000" title="Reset Today" onPress={handleReset} accessibilityLabel="Reset today's count to zero" />
        </View>

        <View style={styles.analytics}>
          <Text style={styles.subtitle}>Last 7 Days</Text>
          {last7Days.length === 0 ? (
            <Text style={styles.muted}>No data yet</Text>
          ) : (
            last7Days.map((row) => (
              <Text key={row.date} style={styles.analyticsRow}>{row.date}: {row.count}</Text>
            ))
          )}

          <Text style={[styles.subtitle, { marginTop: 16 }]}>Today by Hour</Text>
          {hourlyTrend.length === 0 ? (
            <Text style={styles.muted}>No data yet</Text>
          ) : (
            hourlyTrend.map((b) => (
              <Text key={b.hour} style={styles.analyticsRow}>{String(b.hour).padStart(2, '0')}:00 — {b.count}</Text>
            ))
          )}
        </View>
        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  count: {
    fontSize: 56,
    fontWeight: '700',
    marginBottom: 16,
  },
  buttonRow: {
    marginBottom: 24,
    width: '100%',
    maxWidth: 420,
  },
  analytics: {
    width: '100%',
    maxWidth: 640,
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
  muted: {
    fontSize: 14,
    color: '#666',
  },
});
