import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, RefreshControl, ImageBackground } from 'react-native';
import { theme } from '../theme';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [cityName, setCityName] = useState('Loading...');
  const [nextPrayer, setNextPrayer] = useState(null);
  const [allPrayers, setAllPrayers] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hijriDate, setHijriDate] = useState('');
  const { jwt, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCityName('Permission denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (geo && geo.length) setCityName(geo[0].city || geo[0].region || 'موقعك');
      } catch {}

      const date = new Date();
      // Hijri Date
      try {
        const hijri = new Intl.DateTimeFormat('ar-TN-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        setHijriDate(hijri);
      } catch (e) {
        setHijriDate(date.toLocaleDateString());
      }

      // Prayer Times (Method 18: Tunisia)
      const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=18`;
      const res = await fetch(url);
      const json = await res.json();
      const timings = json?.data?.timings;

      if (timings) {
        setAllPrayers(timings);
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const now = new Date();
        const prayerList = prayers.map((key) => {
          const [h, m] = timings[key].split(':');
          const pDate = new Date();
          pDate.setHours(h, m, 0, 0);
          return { name: key, time: timings[key], date: pDate, arabic: getArabicName(key) };
        });

        const next = prayerList.find(p => p.date > now) || prayerList[0];
        setNextPrayer(next);
      }
    } catch (e) {
      console.log(e);
      setCityName('Error fetching data');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, []);

  const getArabicName = (name) => {
    const map = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
    return map[name] || name;
  };

  const ActionCard = ({ icon, title, subtitle, onPress, color }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.scroll} 
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.gregorianDate}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <Text style={styles.hijriDate}>{hijriDate}</Text>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
          <MaterialCommunityIcons name="dots-vertical" size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Hero Card: Next Prayer */}
      <View style={styles.heroCard}>
        <ImageBackground 
          source={require('../../assets/zitouna2.png')} 
          style={styles.heroBg} 
          imageStyle={{ opacity: 0.15, resizeMode: 'cover' }}
        >
          <View style={styles.heroContent}>
            <View>
              <Text style={styles.heroLabel}>الصلاة القادمة</Text>
              <Text style={styles.heroPrayerName}>{nextPrayer ? nextPrayer.arabic : '...'}</Text>
              <View style={styles.locationTag}>
                <MaterialCommunityIcons name="map-marker" size={14} color="#fff" />
                <Text style={styles.locationText}>{cityName}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroTime}>{nextPrayer ? nextPrayer.time : '--:--'}</Text>
              <Text style={styles.heroTimeLabel}>{nextPrayer ? nextPrayer.name.toUpperCase() : ''}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.gridContainer}>
        <ActionCard 
          icon="map-search" 
          title="Find Mosques" 
          subtitle="البحث عن المساجد" 
          color={theme.colors.primary} 
          onPress={() => navigation.navigate('MapTab')} 
        />
        <ActionCard 
          icon="plus-circle" 
          title="Add Mosque" 
          subtitle="إضافة مسجد" 
          color={theme.colors.secondary} 
          onPress={() => navigation.navigate('AddMosque')} 
        />
        <ActionCard 
          icon="star-outline" 
          title="Rate & Review" 
          subtitle="قيم مسجد" 
          color="#F39C12" 
          onPress={() => navigation.navigate('Tabs', { screen: 'ListTab' })} 
        />
        <ActionCard 
          icon="clock-outline" 
          title="Prayer Times" 
          subtitle="أوقات الصلاة" 
          color="#8E44AD" 
          onPress={() => navigation.navigate('PrayerTimes')} 
        />
      </View>

      {/* Daily Content / Hadith */}
      <View style={styles.dailyCard}>
        <View style={styles.dailyHeader}>
          <MaterialCommunityIcons name="book-open-page-variant" size={20} color={theme.colors.primary} />
          <Text style={styles.dailyTitle}>Daily Wisdom / حكمة اليوم</Text>
        </View>
        <Text style={styles.dailyText}>
          "The best among you are those who have the best manners and character."
        </Text>
        <Text style={styles.dailySource}>Sahih al-Bukhari</Text>
      </View>

      {allPrayers && (
        <View style={styles.miniTimesRow}>
           {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p, i) => (
             <View key={i} style={styles.miniTimeItem}>
               <Text style={styles.miniTimeName}>{p[0]}</Text>
               <Text style={styles.miniTimeValue}>{allPrayers[p]}</Text>
             </View>
           ))}
        </View>
      )}

      {/* Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Menu / القائمة</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); navigation.navigate('Login'); }}>
              <MaterialCommunityIcons name="login" size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
              <Text style={styles.menuText}>{jwt ? 'Switch Account / تبديل الحساب' : 'Login / تسجيل الدخول'}</Text>
            </TouchableOpacity>
            {jwt && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); signOut(); }}>
                <MaterialCommunityIcons name="logout" size={20} color={theme.colors.error} style={{ marginRight: 12 }} />
                <Text style={[styles.menuText, { color: theme.colors.error }]}>Log Out / خروج</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f7fa' },
  container: { padding: theme.spacing.md },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, marginTop: 10 },
  gregorianDate: { fontSize: 14, color: theme.colors.muted, fontFamily: 'Cairo-Medium', textTransform: 'uppercase' },
  hijriDate: { fontSize: 18, color: theme.colors.text, fontFamily: 'Cairo-Bold', marginTop: 2 },
  menuBtn: { padding: 4 },

  heroCard: { backgroundColor: theme.colors.primary, borderRadius: 24, overflow: 'hidden', marginBottom: 24, elevation: 8, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  heroBg: { padding: 24 },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'Cairo-Medium', marginBottom: 4 },
  heroPrayerName: { color: '#fff', fontSize: 32, fontFamily: 'Cairo-Bold', marginBottom: 8 },
  locationTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  locationText: { color: '#fff', fontSize: 12, marginLeft: 4, fontFamily: 'Cairo-Medium' },
  heroTime: { color: '#fff', fontSize: 36, fontFamily: 'Cairo-Bold' },
  heroTimeLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: -4, fontWeight: 'bold' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  actionCard: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, marginBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 16, fontFamily: 'Cairo-Bold', color: theme.colors.text, marginBottom: 2 },
  actionSubtitle: { fontSize: 12, color: theme.colors.muted, fontFamily: 'Cairo-Medium' },

  dailyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: theme.colors.secondary },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dailyTitle: { fontSize: 16, fontFamily: 'Cairo-Bold', color: theme.colors.text, marginLeft: 8 },
  dailyText: { fontSize: 15, color: theme.colors.text, lineHeight: 24, fontStyle: 'italic', marginBottom: 8 },
  dailySource: { fontSize: 12, color: theme.colors.muted, textAlign: 'right', fontWeight: 'bold' },

  miniTimesRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 1 },
  miniTimeItem: { alignItems: 'center' },
  miniTimeName: { fontSize: 12, color: theme.colors.muted, marginBottom: 4, fontWeight: 'bold' },
  miniTimeValue: { fontSize: 14, color: theme.colors.text, fontFamily: 'Cairo-Bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontFamily: 'Cairo-Bold', marginBottom: 16, color: theme.colors.text, textAlign: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { fontSize: 16, color: theme.colors.text, fontFamily: 'Cairo-Medium' },
});
