import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Switch, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../theme';
import { suggestMosqueEdit } from '../services/api';

export default function EditMosqueScreen({ route, navigation }) {
  const { mosque } = route.params;
  const [form, setForm] = useState({
    address: mosque.address || '',
    women_section: mosque.facilities?.women_section || false,
    wudu: mosque.facilities?.wudu || false,
    parking: mosque.facilities?.parking || false,
    accessibility: mosque.facilities?.accessibility || false,
    ac: mosque.facilities?.ac || false,
    
    jumuah_time: mosque.jumuah_time || '',
    eid_info: mosque.eid_info || '',
    muazzin_name: mosque.muazzin_name || '',
    imam_5_prayers_name: mosque.imam_5_prayers_name || '',
    imam_jumua_name: mosque.imam_jumua_name || '',
  });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const submit = async () => {
    setLoading(true);
    try {
      // Build patch object (only sending what we support editing here)
      const patch = {
        address: form.address,
        facilities: {
           women_section: form.women_section,
           wudu: form.wudu,
           parking: form.parking,
           accessibility: form.accessibility,
           ac: form.ac,
        },
        jumuah_time: form.jumuah_time || undefined,
        eid_info: form.eid_info || undefined,
        muazzin_name: form.muazzin_name || undefined,
        imam_5_prayers_name: form.imam_5_prayers_name || undefined,
        imam_jumua_name: form.imam_jumua_name || undefined,
      };

      await suggestMosqueEdit(mosque.id, patch);
      Alert.alert('Success', 'Edit suggestion submitted for community review.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to submit edit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Suggest Edit / اقتراح تعديل</Text>
      <Text style={styles.sub}>{mosque.arabic_name}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Address / العنوان</Text>
        <TextInput style={styles.input} value={form.address} onChangeText={t => update('address', t)} />
      </View>

      <Text style={styles.sectionTitle}>Facilities / المرافق</Text>
      <View style={styles.switchRow}><Text>Women Section / مصلى نساء</Text><Switch value={form.women_section} onValueChange={v=>update('women_section',v)}/></View>
      <View style={styles.switchRow}><Text>Wudu / مكان وضوء</Text><Switch value={form.wudu} onValueChange={v=>update('wudu',v)}/></View>
      <View style={styles.switchRow}><Text>Parking / موقف سيارات</Text><Switch value={form.parking} onValueChange={v=>update('parking',v)}/></View>
      <View style={styles.switchRow}><Text>Accessibility / ولوج لذوي الاحتياجات</Text><Switch value={form.accessibility} onValueChange={v=>update('accessibility',v)}/></View>
      <View style={styles.switchRow}><Text>Air Conditioning / مكيف هواء</Text><Switch value={form.ac} onValueChange={v=>update('ac',v)}/></View>

      <Text style={styles.sectionTitle}>Staff & Info / القائمون والمسجد</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Muazzin / المؤذن</Text>
        <TextInput style={styles.input} value={form.muazzin_name} onChangeText={t => update('muazzin_name', t)} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Imam (5 Prayers) / إمام الصلوات</Text>
        <TextInput style={styles.input} value={form.imam_5_prayers_name} onChangeText={t => update('imam_5_prayers_name', t)} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Imam Jumuah / إمام الجمعة</Text>
        <TextInput style={styles.input} value={form.imam_jumua_name} onChangeText={t => update('imam_jumua_name', t)} />
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Jumuah Time / وقت الجمعة</Text>
        <TextInput style={styles.input} value={form.jumuah_time} onChangeText={t => update('jumuah_time', t)} placeholder="13:00" />
      </View>

      <TouchableOpacity style={[styles.btn, styles.primary]} onPress={submit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Submitting...' : 'Submit Suggestion / إرسال'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  title: { fontSize: 24, fontFamily: 'Cairo-Bold', color: theme.colors.primary, marginBottom: 8 },
  sub: { fontSize: 18, color: theme.colors.text, marginBottom: 20 },
  row: { marginBottom: 15 },
  label: { fontSize: 14, color: theme.colors.text, marginBottom: 5, fontFamily: 'Cairo-Medium' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontFamily: 'Cairo-Regular' },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo-Bold', marginTop: 10, marginBottom: 10, color: theme.colors.secondary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  btn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  primary: { backgroundColor: theme.colors.primary },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
