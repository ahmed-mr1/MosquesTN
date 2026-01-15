import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground, ScrollView, RefreshControl, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const PRAYER_ICONS = {
  Fajr: 'weather-sunset-up',
  Sunrise: 'weather-sunset',
  Dhuhr: 'weather-sunny',
  Asr: 'weather-partly-cloudy',
  Maghrib: 'weather-sunset-down',
  Isha: 'weather-night',
};

const PRAYER_NAMES = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

export default function PrayerTimesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');
  const [data, setData] = useState(null); // stores full api response data
  const [nextPrayer, setNextPrayer] = useState(null);

  const fetchTimings = async () => {
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission denied / إذن الموقع مرفوض');
      
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      
      // Fetch Prayer Times
      const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=18`;

      // Parallel execution for speed
      const [geo, res] = await Promise.all([
        Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => null),
        fetch(url)
      ]);

      if (geo && geo.length) {
        const loc = geo[0];
        setCity(loc.city || loc.region || loc.subregion || 'موقعك');
      }

      const json = await res.json();
      
      if (json.code === 200 && json.data) {
        setData(json.data);
        calculateNextPrayer(json.data.timings);
      } else {
        throw new Error('Invalid data from API');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load timings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateNextPrayer = (timings) => {
    if (!timings) return;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    let found = null;
    for (const p of prayers) {
      const timeStr = timings[p];
      if (!timeStr) continue;
      const [h, m] = timeStr.split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      
      if (prayerMinutes > currentTime) {
        found = p;
        break;
      }
    }
    // If none found, next is Fajr (tomorrow)
    setNextPrayer(found || 'Fajr');
  };

  useEffect(() => {
    fetchTimings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTimings();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.muted }}>Loading Prayer Times...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.danger} />
        <Text style={styles.error}>{error}</Text>
        <Text style={[styles.btnText, {color: theme.colors.primary, marginTop: 20}]} onPress={fetchTimings}>Try Again</Text>
      </View>
    );
  }

  const { timings, date } = data || {};
  const orderedKeys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.city}>{city || 'Unknown Location'}</Text>
          <Text style={styles.gregorian}>{date?.gregorian?.date} ({date?.gregorian?.weekday?.en})</Text>
          <Text style={styles.hijri}>{date?.hijri?.day} {date?.hijri?.month?.ar} {date?.hijri?.year}</Text>
        </View>
        <MaterialCommunityIcons name="mosque" size={60} color={theme.colors.primary} style={{ opacity: 0.8 }} />
      </View>

      {/* Next Prayer Highlight */}
      {nextPrayer && timings && (
        <View style={styles.nextPrayerCard}>
          <Text style={styles.nextLabel}>Next Prayer / الصلاة القادمة</Text>
          <View style={styles.nextRow}>
            <Text style={styles.nextName}>{PRAYER_NAMES[nextPrayer]}</Text>
            <Text style={styles.nextTime}>{timings[nextPrayer]}</Text>
          </View>
        </View>
      )}

      {/* Prayer List */}
      <View style={styles.listContainer}>
        {orderedKeys.map((key) => {
          const isNext = key === nextPrayer;
          return (
            <View key={key} style={[styles.prayerRow, isNext && styles.activeRow]}>
              <View style={styles.iconContainer}>
                 <MaterialCommunityIcons 
                   name={PRAYER_ICONS[key]} 
                   size={24} 
                   color={isNext ? theme.colors.surface : theme.colors.primary} 
                 />
              </View>
              <Text style={[styles.prayerNameEn, isNext && styles.activeText]}>{key}</Text>
              
              <View style={styles.separator} />
              
              <Text style={[styles.prayerTime, isNext && styles.activeText]}>{timings[key]}</Text>
              <Text style={[styles.prayerNameAr, isNext && styles.activeText]}>{PRAYER_NAMES[key]}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.note}>
        Times calculation: {data?.meta?.method?.name || 'Al Adhan API'}
      </Text>
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  
  header: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  city: { fontSize: 22, fontFamily: 'Cairo-Bold', color: theme.colors.primary, marginBottom: 4 },
  gregorian: { fontSize: 14, color: theme.colors.muted, fontFamily: 'Cairo-Regular' },
  hijri: { fontSize: 16, color: theme.colors.secondary, fontFamily: 'Cairo-Bold', marginTop: 2 },
  
  error: { color: theme.colors.danger, textAlign: 'center', marginTop: 10, fontSize: 16 },
  
  nextPrayerCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nextLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8, fontFamily: 'Cairo-Regular' },
  nextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextName: { color: '#fff', fontSize: 28, fontFamily: 'Cairo-Bold' },
  nextTime: { color: theme.colors.accent, fontSize: 32, fontFamily: 'Cairo-Bold' },

  listContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  activeRow: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  activeText: {
    color: '#fff',
  },
  
  iconContainer: { width: 32, alignItems: 'center' },
  prayerNameEn: { flex: 2, fontSize: 16, color: theme.colors.text, marginLeft: 10, fontFamily: 'Cairo-Regular' },
  separator: { width: 1, height: '100%', backgroundColor: '#eee', marginHorizontal: 10 }, 
  prayerTime: { flex: 2, fontSize: 20, textAlign: 'right', fontFamily: 'Cairo-Bold', color: theme.colors.primary },
  prayerNameAr: { flex: 2, fontSize: 18, textAlign: 'right', fontFamily: 'Cairo-Regular', color: theme.colors.text, marginLeft: 10 },
  
  note: { textAlign: 'center', color: theme.colors.muted, fontSize: 12, marginTop: 20, opacity: 0.7 },
  btnText: { fontSize: 16, fontWeight: 'bold' } 
});
