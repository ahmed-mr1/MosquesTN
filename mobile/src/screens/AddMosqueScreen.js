import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Switch, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { suggestMosque } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMosques } from '../context/MosquesContext';
import { governorates as GOVS, fetchDelegations, fetchCities } from '../services/locations';
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
  const [delPickerOpen, setDelPickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [delegations, setDelegations] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingDel, setLoadingDel] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [searchDel, setSearchDel] = useState('');
  const [searchCity, setSearchCity] = useState('');
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

  const governorates = GOVS;

  useEffect(() => {
    (async () => {
      setLoadingDel(true);
      try {
        if (form.governorate) {
          const list = await fetchDelegations(form.governorate);
          setDelegations(list);
        } else {
          setDelegations([]);
        }
      } finally {
        setLoadingDel(false);
      }
      update('delegation', '');
      update('city', '');
      setCities([]);
      setSearchDel('');
      setSearchCity('');
    })();
  }, [form.governorate]);

  useEffect(() => {
    (async () => {
      setLoadingCity(true);
      try {
        if (form.governorate && form.delegation) {
          const list = await fetchCities(form.governorate, form.delegation);
          setCities(list);
        } else {
          setCities([]);
        }
      } finally {
        setLoadingCity(false);
      }
      update('city', '');
      setSearchCity('');
    })();
  }, [form.delegation]);

  const setLocationAndAddress = async (lat, lng) => {
    update('latitude', String(lat));
    update('longitude', String(lng));
    setRegion({ ...region, latitude: lat, longitude: lng });
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results && results.length > 0) {
        const addr = results[0];
        const fullAddr = [addr.street, addr.name, addr.subregion, addr.region, addr.city, addr.country].filter(Boolean).join(', ');
        update('address', fullAddr);
      }
    } catch (e) {
      // ignore geocode error
    }
  };

  const useCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission denied', 'Location permission is required');
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      await setLocationAndAddress(latitude, longitude);
      setRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to get location');
    }
  };

  const submit = async () => {
    if (!form.arabic_name?.trim()) {
      return Alert.alert('Missing fields', 'Arabic name is required.');
    }
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
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=18`);
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
      arabic_name: form.arabic_name,
      type: (form.type && form.type.trim()) ? form.type.trim() : 'mosque',
      governorate: form.governorate,
      delegation: form.delegation || undefined,
      city: form.city,
      address: form.address || undefined,
      latitude: lat,
      longitude: lng,
      facilities: {
        women_section: !!form.women_section,
        wudu: !!form.wudu,
        parking: !!form.parking,
        accessibility: !!form.accessibility,
        ac: !!form.ac,
      },
      jumuah_time: form.jumuah_time || undefined,
      eid_info: form.eid_info || undefined,
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
      <Text style={styles.title}>Add Mosque / اقتراح مسجد</Text>
      
      {/* 1. Basic Info */}
      <View style={styles.row}>
        <Text style={styles.label}>Arabic Name / الاسم بالعربية*</Text>
        <TextInput style={styles.input} value={form.arabic_name} onChangeText={(t)=>update('arabic_name', t)} />
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Type / النوع</Text>
        <TouchableOpacity style={styles.input} onPress={()=>setTypePickerOpen(true)}>
          <Text style={{ color: form.type ? theme.colors.text : theme.colors.muted }}>{form.type || 'Select Type / اختر النوع'}</Text>
        </TouchableOpacity>
      </View>
      {/* 2. Location Selectors */}
      <View style={styles.row}>
        <Text style={styles.label}>Governorate / الولاية*</Text>
        <TouchableOpacity style={styles.input} onPress={()=>setGovPickerOpen(true)}>
          <Text style={{ color: form.governorate ? theme.colors.text : theme.colors.muted }}>{form.governorate || 'Select / اختر'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Delegation / المعتمدية</Text>
        <TouchableOpacity style={styles.input} disabled={!form.governorate} onPress={()=>setDelPickerOpen(true)}>
          <Text style={{ color: form.delegation ? theme.colors.text : theme.colors.muted }}>{form.delegation || 'Select / اختر'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>City/Locality / المدينة*</Text>
        <TouchableOpacity style={styles.input} onPress={()=>setCityPickerOpen(true)}>
          <Text style={{ color: form.city ? theme.colors.text : theme.colors.muted }}>{form.city || 'Select / اختر'}</Text>
        </TouchableOpacity>
      </View>
    
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.secondary, marginTop: 0 }]} onPress={useCurrentLocation}>
          <Text style={styles.btnText}>Use Current Location / استخدام موقعي الحالي</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 260, borderRadius: theme.radius.md, overflow: 'hidden', marginBottom: theme.spacing.md }}>
        <MapView style={{ flex: 1 }} region={region} onPress={(e)=>{
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setLocationAndAddress(latitude, longitude);
        }}>
          {(form.latitude && form.longitude) ? (
            <Marker coordinate={{ latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) }} />
          ) : null}
        </MapView>
      </View>

      <View style={styles.row2}>
        <View style={styles.half}>
          <Text style={styles.label}>Lat / خط العرض</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={form.latitude} onChangeText={(t)=>update('latitude', t)} />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Lng / خط الطول</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={form.longitude} onChangeText={(t)=>update('longitude', t)} />
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Address / العنوان (Auto/Manual)</Text>
        <TextInput style={styles.input} placeholder="Address / العنوان" value={form.address} onChangeText={(t)=>update('address', t)} />
      </View>

      <Text style={styles.sectionTitle}>Facilities / المرافق</Text>
      <View style={styles.switchRow}><Text>Women Section / مصلى نساء</Text><Switch value={form.women_section} onValueChange={(v)=>update('women_section', v)} /></View>
      <View style={styles.switchRow}><Text>Wudu / مكان وضوء</Text><Switch value={form.wudu} onValueChange={(v)=>update('wudu', v)} /></View>
      <View style={styles.switchRow}><Text>Parking / موقف سيارات</Text><Switch value={form.parking} onValueChange={(v)=>update('parking', v)} /></View>
      <View style={styles.switchRow}><Text>Accessibility / ولوج لذوي الاحتياجات</Text><Switch value={form.accessibility} onValueChange={(v)=>update('accessibility', v)} /></View>
      <View style={styles.switchRow}><Text>Air Conditioning / مكيف هواء</Text><Switch value={form.ac} onValueChange={(v)=>update('ac', v)} /></View>

      {/* 5. Prayer Info */}
      <Text style={styles.sectionTitle}>Prayer Times / أوقات الصلاة</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Jumuah / الجمعة</Text>
        <TextInput style={styles.input} placeholder="13:00" value={form.jumuah_time} onChangeText={(t)=>update('jumuah_time', t)} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Eid Info / معلومات العيد</Text>
        <TextInput style={styles.input} placeholder="Eid info / معلومات العيد" value={form.eid_info} onChangeText={(t)=>update('eid_info', t)} />
      </View>

      <Text style={styles.sectionTitle}>Iqama Wait Times (minutes) / الانتظار (دقائق)</Text>
      <View style={styles.row2}>
        <View style={styles.half}>
          <Text style={styles.label}>Fajr / فجر</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={form.iqama_fajr} onChangeText={(t)=>update('iqama_fajr', t)} />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Dhuhr / ظهر</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={form.iqama_dhuhr} onChangeText={(t)=>update('iqama_dhuhr', t)} />
        </View>
      </View>
      <View style={styles.row2}>
        <View style={styles.half}>
          <Text style={styles.label}>Asr / عصر</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={form.iqama_asr} onChangeText={(t)=>update('iqama_asr', t)} />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Maghrib / مغرب</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={form.iqama_maghrib} onChangeText={(t)=>update('iqama_maghrib', t)} />
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Isha / عشاء</Text>
        <TextInput style={styles.input} keyboardType="number-pad" value={form.iqama_isha} onChangeText={(t)=>update('iqama_isha', t)} />
      </View>

      <TouchableOpacity disabled={submitting} style={[styles.btn, submitting && { opacity: 0.7 }]} onPress={submit}>
        <Text style={styles.btnText}>{submitting ? 'Submitting… / جاري الإرسال…' : 'Submit Suggestion / إرسال الاقتراح'}</Text>
      </TouchableOpacity>

      <Modal visible={typePickerOpen} transparent animationType="fade" onRequestClose={()=>setTypePickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <FlatList
              data={[
                { label: 'Mosque / مسجد', value: 'mosque' },
                { label: 'Jamii / جامع', value: 'jamii' },
                { label: 'Musalla / مصلى', value: 'musalla' },
              ]}
              keyExtractor={(item, idx)=>String(idx)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionRow} onPress={()=>{ update('type', item.value); setTypePickerOpen(false); }}>
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={()=>setTypePickerOpen(false)}><Text style={styles.modalCloseText}>Close / إغلاق</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            {loadingCity ? (
              <ActivityIndicator style={{ marginTop: theme.spacing.md }} />
            ) : (
              <>
                <TextInput style={styles.input} placeholder="بحث" value={searchCity} onChangeText={setSearchCity} />
                <FlatList
                  data={cities.filter(c => c.toLowerCase().includes(searchCity.toLowerCase()))}
                  keyExtractor={(item, idx)=>String(idx)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.optionRow} onPress={()=>{ update('city', item); setCityPickerOpen(false); }}>
                      <Text style={styles.optionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={()=>setCityPickerOpen(false)}><Text style={styles.modalCloseText}>إغلاق</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={delPickerOpen} transparent animationType="fade" onRequestClose={()=>setDelPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {loadingDel ? (
              <ActivityIndicator style={{ marginTop: theme.spacing.md }} />
            ) : (
              <>
                <TextInput style={styles.input} placeholder="بحث" value={searchDel} onChangeText={setSearchDel} />
                <FlatList
                  data={delegations.filter(d => d.toLowerCase().includes(searchDel.toLowerCase()))}
                  keyExtractor={(item, idx)=>String(idx)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.optionRow} onPress={()=>{ update('delegation', item); setDelPickerOpen(false); }}>
                      <Text style={styles.optionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={()=>setDelPickerOpen(false)}><Text style={styles.modalCloseText}>إغلاق</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  title: { fontSize: 20, fontFamily: 'Cairo-Bold', color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.md },
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
