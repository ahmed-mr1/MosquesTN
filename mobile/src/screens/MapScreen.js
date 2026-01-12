import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity, FlatList } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { theme } from '../theme';
import { useMosques } from '../context/MosquesContext';
import FullScreenLoader from '../components/FullScreenLoader';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
  const { mosques, loading, error } = useMosques();
  const [region] = useState({ latitude: 34.0, longitude: 9.6, latitudeDelta: 6.0, longitudeDelta: 6.0 });
  const [gov, setGov] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const mosqueIcon = require('../../assets/mosque.png');

  const markers = useMemo(() => {
    const arr = Array.isArray(mosques) ? mosques : [];
    const g = gov.trim().toLowerCase();
    const filtered = g ? arr.filter(m => (m.governorate || '').toLowerCase().includes(g)) : arr;
    return filtered.map((m) => ({
      key: String(m.id),
      id: m.id,
      title: m.arabic_name || m.type || 'Mosque',
      coordinate: { latitude: m.latitude, longitude: m.longitude },
    }));
  }, [mosques, gov]);

  const governorates = useMemo(() => {
    const arr = Array.isArray(mosques) ? mosques : [];
    const set = new Set();
    for (const m of arr) {
      if (m?.governorate) set.add(m.governorate);
    }
    return ['All', ...Array.from(set).sort((a,b)=>a.localeCompare(b))];
  }, [mosques]);

  return (
    <View style={styles.container}>
      {region ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          showsUserLocation
        >
          {markers.map((mk) => (
            <Marker key={mk.key} coordinate={mk.coordinate} image={mosqueIcon}>
              <Callout onPress={() => navigation.navigate('MosqueDetail', { id: mk.id })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{mk.title}</Text>
                  <Text style={styles.calloutLink}>Details</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      ) : (
        <FullScreenLoader message={error ? String(error) : 'جارٍ تحميل الخريطة…'} />
      )}
      {/* Governorate filter overlay */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterInput} onPress={() => setPickerOpen(true)}>
          <Text style={{ color: theme.colors.text }}>{gov || 'Governorate'}</Text>
        </TouchableOpacity>
        {(gov && gov !== 'All') ? <Text style={styles.filterCount}>{markers.length} نتائج</Text> : null}
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <FlatList
              data={governorates}
              keyExtractor={(item, idx) => String(idx)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => { setGov(item === 'All' ? '' : item); setPickerOpen(false); }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading overlay while fetching mosques */}
      {loading && <FullScreenLoader message="جارٍ تحميل المساجد…" />}
      {!loading && error ? (
        <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  map: { width, height },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.muted },
  callout: { maxWidth: 200 },
  calloutTitle: { fontFamily: 'Cairo-Bold', marginBottom: 4 },
  calloutLink: { color: theme.colors.primary },
  errorBar: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: '#fee', padding: 8, borderRadius: 8 },
  errorText: { color: '#900' },
  filterBar: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  filterCount: { marginLeft: 8, color: theme.colors.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '85%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  optionRow: { paddingVertical: 12 },
  optionText: { color: theme.colors.text, fontSize: 16 },
  modalClose: { marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.primary, borderRadius: 8 },
  modalCloseText: { color: '#fff' },
  
});
