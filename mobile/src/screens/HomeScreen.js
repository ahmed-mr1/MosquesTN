import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { theme } from '../theme';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const [cityName, setCityName] = useState('...');
  const [nextPrayer, setNextPrayer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { jwt, signOut } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          if (geo && geo.length) setCityName(geo[0].city || geo[0].region || 'موقعك');
        } catch {}
        const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`;
        const res = await fetch(url);
        const json = await res.json();
        const timings = json?.data?.timings;
        if (timings) {
          const prayers = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const list = prayers.map((name) => {
            const [h,m] = String(timings[name]||'').split(':');
            const d = new Date(today);
            d.setHours(parseInt(h||'0',10), parseInt(m||'0',10), 0, 0);
            return { name, time: timings[name], date: d };
          });
          let found = null;
          for (const p of list) {
            if (p.date > now) { found = p; break; }
            if (now - p.date < 30*60*1000) { found = { ...p, isNow: true }; break; }
          }
          setNextPrayer(found || list[0]);
        }
      } catch {}
    })();
  }, []);

  return (
    <ScrollView style={[styles.scroll]} contentContainerStyle={styles.container}>
      <View style={styles.headerTop}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="menu" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appTitle, { textAlign: 'right' }]}>Mosques TN</Text>
            <Text style={[styles.appSubtitle, { textAlign: 'right' }]}>مساجد تونس</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.mosqueCard} onPress={() => navigation.navigate('PrayerTimes') }>
        <View style={styles.prayerInfoBlock}>
          <Text style={styles.nextPrayer}>{nextPrayer?.isNow ? 'الصلاة القائمة' : 'الصلاة القادمة'}</Text>
          <Text style={styles.prayerTime}>{nextPrayer ? `${nextPrayer.name} ${nextPrayer.time}` : '...'}</Text>
          <Text style={styles.remaining}>{cityName}</Text>
        </View>
        <Image source={require('../../assets/mosqueicon.png')} style={styles.mosqueImage} />
      </TouchableOpacity>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('MapTab') }>
          <Text style={styles.quickText}>الخريطة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Tabs', { screen: 'ListTab' }) }>
          <Text style={styles.quickText}>القائمة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('AddMosque') }>
          <Text style={styles.quickText}>إضافة مسجد</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); navigation.navigate('Login'); }}>
              <Text style={styles.menuText}>{jwt ? 'تبديل الحساب' : 'تسجيل الدخول'}</Text>
            </TouchableOpacity>
            {jwt ? (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); signOut(); }}>
                <Text style={styles.menuText}>تسجيل الخروج</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.menuItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' }]} onPress={() => setMenuOpen(false)}>
              <Text style={[styles.menuText, { color: theme.colors.muted }]}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, alignItems: 'center' },
  headerTop: { width: '100%', marginBottom: theme.spacing.md },
  appTitle: { fontSize: 22, fontFamily: 'Cairo-Bold', color: theme.colors.primary, textAlign: 'right' },
  appSubtitle: { marginTop: 4, fontSize: 18, color: theme.colors.secondary, textAlign: 'right' },
  mosqueCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: theme.radius.lg, padding: theme.spacing.lg, width: '100%', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 5, marginBottom: theme.spacing.xl },
  prayerInfoBlock: { flex: 1, alignItems: 'center', paddingRight: theme.spacing.md },
  nextPrayer: { fontSize: 16, fontFamily: 'Cairo-Medium', color: theme.colors.text, marginBottom: theme.spacing.sm, textAlign: 'right' },
  prayerTime: { fontSize: 14, color: theme.colors.text, marginBottom: theme.spacing.sm, textAlign: 'right' },
  remaining: { fontSize: 12, color: theme.colors.muted, textAlign: 'right' },
  mosqueImage: { width: 130, height: 130, resizeMode: 'contain' },
  quickRow: { flexDirection: 'row', gap: theme.spacing.md },
  quickBtn: { backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.md },
  quickText: { color: '#fff', fontFamily: 'Cairo-Medium' },
  footer: { marginTop: theme.spacing.lg, color: theme.colors.muted, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  menuItem: { paddingVertical: 12 },
  menuText: { color: theme.colors.text, fontSize: 16 },
});
