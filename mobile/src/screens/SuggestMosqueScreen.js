import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { theme } from '../theme';
import { suggestMosque } from '../api';
import { governorates, fetchDelegations, fetchCities } from '../services/locations';

export default function SuggestMosqueScreen() {
  const [form, setForm] = useState({ arabic_name: '', type: 'mosque', governorate: '' });
  const [delegations, setDelegations] = useState([]);
  const [cities, setCities] = useState([]);
  const [showGovSelect, setShowGovSelect] = useState(false);
  const [showDelSelect, setShowDelSelect] = useState(false);
  const [showCitySelect, setShowCitySelect] = useState(false);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      if (form.governorate) {
        const list = await fetchDelegations(form.governorate);
        setDelegations(list);
      } else {
        setDelegations([]);
      }
      setForm((f) => ({ ...f, delegation: '', city: '' }));
      setCities([]);
    })();
  }, [form.governorate]);

  useEffect(() => {
    (async () => {
      if (form.governorate && form.delegation) {
        const list = await fetchCities(form.governorate, form.delegation);
        setCities(list);
      } else {
        setCities([]);
      }
      setForm((f) => ({ ...f, city: '' }));
    })();
  }, [form.delegation]);

  const onSubmit = async () => {
    if (!form.governorate?.trim()) { return alert('Governorate is required'); }
    try {
      const payload = {};
      if (form.arabic_name) payload.arabic_name = form.arabic_name;
      if (form.type) payload.type = form.type;
      if (form.governorate) payload.governorate = form.governorate;
      if (form.delegation) payload.delegation = form.delegation;
      if (form.city) payload.city = form.city;
      if (form.neighborhood) payload.neighborhood = form.neighborhood;
      if (form.address) payload.address = form.address;
      if (form.latitude) payload.latitude = Number(form.latitude);
      if (form.longitude) payload.longitude = Number(form.longitude);
      if (form.facilities_details) payload.facilities_details = form.facilities_details;
      if (form.jumuah_time) payload.jumuah_time = form.jumuah_time;
      if (form.eid_info) payload.eid_info = form.eid_info;

      const res = await suggestMosque(payload);
      alert('Suggestion submitted, status: ' + res.status);
    } catch (e) {
      alert('Submit failed: ' + (e?.response?.data?.message || e?.message || e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Suggest Mosque</Text>
      <TextInput style={styles.input} placeholder="Arabic Name" value={form.arabic_name} onChangeText={(t) => setField('arabic_name', t)} />
      <TextInput style={styles.input} placeholder="Type (mosque/jamii)" value={form.type} onChangeText={(t) => setField('type', t)} />
      <TouchableOpacity style={styles.select} onPress={() => setShowGovSelect(true)}>
        <Text style={styles.selectText}>{form.governorate || 'Select Governorate*'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.select} disabled={!form.governorate} onPress={() => setShowDelSelect(true)}>
        <Text style={[styles.selectText, !form.governorate && styles.disabledText]}>{form.delegation || 'Select Delegation'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.select} disabled={!form.delegation} onPress={() => setShowCitySelect(true)}>
        <Text style={[styles.selectText, !form.delegation && styles.disabledText]}>{form.city || 'Select City'}</Text>
      </TouchableOpacity>
      <TextInput style={styles.input} placeholder="Neighborhood" value={form.neighborhood} onChangeText={(t) => setField('neighborhood', t)} />
      <TextInput style={styles.input} placeholder="Address" value={form.address} onChangeText={(t) => setField('address', t)} />
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Latitude" value={form.latitude} onChangeText={(t) => setField('latitude', t)} />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Longitude" value={form.longitude} onChangeText={(t) => setField('longitude', t)} />
      </View>
      <TextInput style={styles.input} placeholder="Facilities details" value={form.facilities_details} onChangeText={(t) => setField('facilities_details', t)} />
      <TextInput style={styles.input} placeholder="Jumuah time (HH:MM)" value={form.jumuah_time} onChangeText={(t) => setField('jumuah_time', t)} />
      <TextInput style={styles.input} placeholder="Eid info" value={form.eid_info} onChangeText={(t) => setField('eid_info', t)} />

      <TouchableOpacity style={styles.btn} onPress={onSubmit}>
        <Text style={styles.btnText}>Submit</Text>
      </TouchableOpacity>

      {/* Governorate Modal */}
      <Modal visible={showGovSelect} transparent animationType="slide" onRequestClose={() => setShowGovSelect(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView>
              {governorates.map((g) => (
                <TouchableOpacity key={g} style={styles.option} onPress={() => { setField('governorate', g); setShowGovSelect(false); }}>
                  <Text style={styles.optionText}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowGovSelect(false)}><Text style={styles.modalCloseText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delegation Modal */}
      <Modal visible={showDelSelect} transparent animationType="slide" onRequestClose={() => setShowDelSelect(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView>
              {delegations.length === 0 ? (
                <Text style={styles.muted}>No delegations found. Configure locations API.</Text>
              ) : delegations.map((d) => (
                <TouchableOpacity key={d} style={styles.option} onPress={() => { setField('delegation', d); setShowDelSelect(false); }}>
                  <Text style={styles.optionText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowDelSelect(false)}><Text style={styles.modalCloseText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* City Modal */}
      <Modal visible={showCitySelect} transparent animationType="slide" onRequestClose={() => setShowCitySelect(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView>
              {cities.length === 0 ? (
                <Text style={styles.muted}>No cities found. Configure locations API.</Text>
              ) : cities.map((c) => (
                <TouchableOpacity key={c} style={styles.option} onPress={() => { setField('city', c); setShowCitySelect(false); }}>
                  <Text style={styles.optionText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowCitySelect(false)}><Text style={styles.modalCloseText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  title: { fontSize: theme.typography.h1, color: theme.colors.primary, marginBottom: theme.spacing.md, fontFamily: 'Cairo-Bold' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  select: { borderWidth: 1, borderColor: '#ddd', borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, backgroundColor: '#fff' },
  selectText: { fontFamily: 'Cairo-Regular', color: theme.colors.text },
  disabledText: { color: theme.colors.muted },
  btn: { marginTop: theme.spacing.lg, backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.radius.md },
  btnText: { color: '#fff', textAlign: 'center', fontFamily: 'Cairo-Medium' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '60%', backgroundColor: '#fff', borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg, padding: theme.spacing.md },
  option: { paddingVertical: theme.spacing.md },
  optionText: { fontFamily: 'Cairo-Regular', fontSize: 16 },
  modalClose: { marginTop: theme.spacing.md, alignSelf: 'center' },
  modalCloseText: { color: theme.colors.primary, fontFamily: 'Cairo-Medium' },
  muted: { color: theme.colors.muted, fontFamily: 'Cairo-Regular', textAlign: 'center', paddingVertical: theme.spacing.md }
});
