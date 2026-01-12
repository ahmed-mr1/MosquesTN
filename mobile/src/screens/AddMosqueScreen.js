import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Switch, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { theme } from '../theme';
import { suggestMosque } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMosques } from '../context/MosquesContext';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function AddMosqueScreen({ navigation }) {
  const { jwt } = useAuth();
  const [form, setForm] = useState({
    arabic_name: '',
    type: '',
    governorate: '',
    delegation: '',
    city: '',
    neighborhood: '',
    address: '',
    latitude: '',
    longitude: '',
    women_section: false,
    wudu: false,
    parking: false,
    accessibility: false,
    ac: false,
    jumuah_time: '',
    eid_info: '',
    iqama_fajr: '',
    iqama_dhuhr: '',
    iqama_asr: '',
    iqama_maghrib: '',
    iqama_isha: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { mosques } = useMosques();
  const [govPickerOpen, setGovPickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [region, setRegion] = useState({ latitude: 34.0, longitude: 9.6, latitudeDelta: 6.0, longitudeDelta: 6.0 });

  useEffect(() => {
    if (!jwt) {
      Alert.alert('Login required', 'Please login with phone OTP to submit a mosque.', [
        { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
    }
  }, [jwt]);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const governorates = useMemo(() => {
    const arr = Array.isArray(mosques) ? mosques : [];
    const set = new Set();
    for (const m of arr) { if (m?.governorate) set.add(m.governorate); }
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }, [mosques]);

  const cities = useMemo(() => {
    const arr = Array.isArray(mosques) ? mosques : [];
    const set = new Set();
    for (const m of arr) { if (m?.governorate === form.governorate && m?.city) set.add(m.city); }
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }, [mosques, form.governorate]);

  const useCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission denied', 'Location permission is required');
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      update('latitude', String(latitude));
      update('longitude', String(longitude));
      setRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to get location');
    }
  };

  const submit = async () => {
    if (!form.governorate || !form.city || !form.latitude || !form.longitude) {
      return Alert.alert('Missing fields', 'Governorate, city, latitude, and longitude are required.');
    }
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return Alert.alert('Invalid coordinates', 'Latitude and longitude must be numbers.');

    // compute iqama times by adding wait offsets (minutes) to Adhan times for this location
    const parseHM = (s) => {
      const [h, m] = String(s || '').split(':');
      return { h: parseInt(h || '0', 10), m: parseInt(m || '0', 10) };
    };
    let iqama_times = undefined;
    let iqama_offsets = undefined;
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`);
      const json = await res.json();
      const t = json?.data?.timings || {};
      const offsets = {
        fajr: parseInt(form.iqama_fajr || '0', 10) || undefined,
        dhuhr: parseInt(form.iqama_dhuhr || '0', 10) || undefined,
        asr: parseInt(form.iqama_asr || '0', 10) || undefined,
        maghrib: parseInt(form.iqama_maghrib || '0', 10) || undefined,
        isha: parseInt(form.iqama_isha || '0', 10) || undefined,
      };
      const calc = (adhan, off) => {
        if (!adhan || off === undefined) return undefined;
        const { h, m } = parseHM(adhan);
        const total = h * 60 + m + off;
        const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
        const mm = String(total % 60).padStart(2, '0');
        return `${hh}:${mm}`;
      };
      iqama_times = {
        fajr: calc(t.Fajr, offsets.fajr),
        dhuhr: calc(t.Dhuhr, offsets.dhuhr),
        asr: calc(t.Asr, offsets.asr),
        maghrib: calc(t.Maghrib, offsets.maghrib),
        isha: calc(t.Isha, offsets.isha),
      };
      iqama_offsets = offsets;
    } catch (e) {
      // If Al Adhan fails, submit without iqama_times; backend may compute later
      iqama_times = undefined;
    }

    const payload = {
      arabic_name: form.arabic_name || undefined,
      type: form.type || undefined,
      governorate: form.governorate,
      delegation: form.delegation || undefined,
      city: form.city,
      neighborhood: form.neighborhood || undefined,
      address: form.address || undefined,
      latitude: lat,
      longitude: lng,
      women_section: !!form.women_section,
      wudu: !!form.wudu,
      parking: !!form.parking,
      accessibility: !!form.accessibility,
      ac: !!form.ac,
      jumuah_time: form.jumuah_time || undefined,
      eid_info: form.eid_info || undefined,
      iqama_times,
      iqama_offsets,
    };

    try {
      setSubmitting(true);
      await suggestMosque(payload);
      Alert.alert('Submitted', 'Your suggestion was submitted. Pending moderation.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>اقتراح مسجد</Text>
      <View style={styles.row}><Text style={styles.label}>الاسم بالعربية*</Text><TextInput style={styles.input} value={form.arabic_name} onChangeText={(t)=>update('arabic_name', t)} /></View>
      <View style={styles.row}><Text style={styles.label}>النوع (مسجد/جامع/مصلى)</Text><TextInput style={styles.input} value={form.type} onChangeText={(t)=>update('type', t)} /></View>
      <View style={styles.row}>
        <Text style={styles.label}>الولاية*</Text>
        <TouchableOpacity style={styles.input} onPress={()=>setGovPickerOpen(true)}>
          <Text style={{ color: form.governorate ? theme.colors.text : theme.colors.muted }}>{form.governorate || 'اختر الولاية'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}><TextInput style={styles.input} placeholder="المعتمدية / البلدية" value={form.delegation} onChangeText={(t)=>update('delegation', t)} /></View>
      <View style={styles.row}>
        <Text style={styles.label}>المدينة*</Text>
        <TouchableOpacity style={styles.input} onPress={()=>setCityPickerOpen(true)}>
          <Text style={{ color: form.city ? theme.colors.text : theme.colors.muted }}>{form.city || 'اختر المدينة'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}><TextInput style={styles.input} placeholder="الحي" value={form.neighborhood} onChangeText={(t)=>update('neighborhood', t)} /></View>
      <View style={styles.row}><TextInput style={styles.input} placeholder="العنوان" value={form.address} onChangeText={(t)=>update('address', t)} /></View>
      <View style={styles.row2}>
        <TextInput style={[styles.input, styles.half]} placeholder="خط العرض*" keyboardType="decimal-pad" value={form.latitude} onChangeText={(t)=>update('latitude', t)} />
        <TextInput style={[styles.input, styles.half]} placeholder="خط الطول*" keyboardType="decimal-pad" value={form.longitude} onChangeText={(t)=>update('longitude', t)} />
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.secondary }]} onPress={useCurrentLocation}>
          <Text style={styles.btnText}>استخدام موقعي الحالي</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 260, borderRadius: theme.radius.md, overflow: 'hidden', marginBottom: theme.spacing.md }}>
        <MapView style={{ flex: 1 }} initialRegion={region} onPress={(e)=>{
          const { latitude, longitude } = e.nativeEvent.coordinate;
          update('latitude', String(latitude));
          update('longitude', String(longitude));
          setRegion({ ...region, latitude, longitude });
        }}>
          {(form.latitude && form.longitude) ? (
            <Marker coordinate={{ latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) }} />
          ) : null}
        </MapView>
      </View>

      <Text style={styles.sectionTitle}>Facilities</Text>
      <View style={styles.switchRow}><Text>Women Section</Text><Switch value={form.women_section} onValueChange={(v)=>update('women_section', v)} /></View>
      <View style={styles.switchRow}><Text>Wudu</Text><Switch value={form.wudu} onValueChange={(v)=>update('wudu', v)} /></View>
      <View style={styles.switchRow}><Text>Parking</Text><Switch value={form.parking} onValueChange={(v)=>update('parking', v)} /></View>
      <View style={styles.switchRow}><Text>Accessibility</Text><Switch value={form.accessibility} onValueChange={(v)=>update('accessibility', v)} /></View>
      <View style={styles.switchRow}><Text>Air Conditioning</Text><Switch value={form.ac} onValueChange={(v)=>update('ac', v)} /></View>

      <Text style={styles.sectionTitle}>Prayer Info</Text>
      <View style={styles.row}><TextInput style={styles.input} placeholder="وقت الجمعة (13:00)" value={form.jumuah_time} onChangeText={(t)=>update('jumuah_time', t)} /></View>
      <View style={styles.row}><TextInput style={styles.input} placeholder="معلومات العيد" value={form.eid_info} onChangeText={(t)=>update('eid_info', t)} /></View>
      <Text style={styles.sectionTitle}>مدة الانتظار لإقامة الصلاة (بالدقائق)</Text>
      <View style={styles.row2}>
        <TextInput style={[styles.input, styles.half]} placeholder="فجر (دقائق)" keyboardType="number-pad" value={form.iqama_fajr} onChangeText={(t)=>update('iqama_fajr', t)} />
        <TextInput style={[styles.input, styles.half]} placeholder="ظهر (دقائق)" keyboardType="number-pad" value={form.iqama_dhuhr} onChangeText={(t)=>update('iqama_dhuhr', t)} />
      </View>
      <View style={styles.row2}>
        <TextInput style={[styles.input, styles.half]} placeholder="عصر (دقائق)" keyboardType="number-pad" value={form.iqama_asr} onChangeText={(t)=>update('iqama_asr', t)} />
        <TextInput style={[styles.input, styles.half]} placeholder="مغرب (دقائق)" keyboardType="number-pad" value={form.iqama_maghrib} onChangeText={(t)=>update('iqama_maghrib', t)} />
      </View>
      <View style={styles.row}><TextInput style={styles.input} placeholder="عشاء (دقائق)" keyboardType="number-pad" value={form.iqama_isha} onChangeText={(t)=>update('iqama_isha', t)} /></View>

      <TouchableOpacity disabled={submitting} style={[styles.btn, submitting && { opacity: 0.7 }]} onPress={submit}>
        <Text style={styles.btnText}>{submitting ? 'Submitting…' : 'Submit Suggestion'}</Text>
      </TouchableOpacity>

      <Modal visible={govPickerOpen} transparent animationType="fade" onRequestClose={()=>setGovPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <FlatList
              data={governorates}
              keyExtractor={(item, idx)=>String(idx)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionRow} onPress={()=>{ update('governorate', item); setGovPickerOpen(false); }}>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={()=>setGovPickerOpen(false)}><Text style={styles.modalCloseText}>إغلاق</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={cityPickerOpen} transparent animationType="fade" onRequestClose={()=>setCityPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <FlatList
              data={cities}
              keyExtractor={(item, idx)=>String(idx)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionRow} onPress={()=>{ update('city', item); setCityPickerOpen(false); }}>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={()=>setCityPickerOpen(false)}><Text style={styles.modalCloseText}>إغلاق</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  title: { fontSize: 20, fontFamily: 'Cairo-Bold', color: theme.colors.text, marginBottom: theme.spacing.md },
  row: { marginBottom: theme.spacing.md },
  row2: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, color: theme.colors.text },
  half: { flex: 1 },
  sectionTitle: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm, fontFamily: 'Cairo-Bold', color: theme.colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  btn: { backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', marginTop: theme.spacing.lg },
  btnText: { color: '#fff', fontFamily: 'Cairo-Medium' },
  label: { marginBottom: 6, color: theme.colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '85%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  optionRow: { paddingVertical: 12 },
  optionText: { color: theme.colors.text, fontSize: 16 },
  modalClose: { marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.primary, borderRadius: 8 },
  modalCloseText: { color: '#fff' },
});
