import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { theme } from '../theme';

export default function PrayerTimesScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');
  const [timings, setTimings] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');
        const pos = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo && geo.length) setCity(geo[0].city || geo[0].region || 'موقعك');
        } catch {}
        const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`;
        const res = await fetch(url);
        const json = await res.json();
        const t = json?.data?.timings;
        setTimings(t || null);
      } catch (e) {
        setError(e?.message || 'Failed to load timings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  if (!timings) return <View style={styles.center}><Text style={styles.muted}>No timings available</Text></View>;

  const rows = [
    ['Fajr', 'الفجر'], ['Sunrise', 'الشروق'], ['Dhuhr', 'الظهر'], ['Asr', 'العصر'], ['Maghrib', 'المغرب'], ['Isha', 'العشاء']
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>أوقات الصلاة — {city}</Text>
      {rows.map(([k, label]) => (
        <View key={k} style={styles.row}>
          <Text style={styles.left}>{label}</Text>
          <Text style={styles.right}>{timings[k]}</Text>
        </View>
      ))}
      <Text style={styles.note}>المواقيت حسب موقعك عبر Al Adhan API</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontFamily: 'Cairo-Bold', color: theme.colors.text, marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  left: { color: theme.colors.text },
  right: { color: theme.colors.text, fontFamily: 'Cairo-Bold' },
  error: { color: '#c00' },
  muted: { color: theme.colors.muted },
  note: { marginTop: theme.spacing.lg, color: theme.colors.muted },
});
