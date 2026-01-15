import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { theme } from '../theme';
import { useMosques } from '../context/MosquesContext';
import FullScreenLoader from '../components/FullScreenLoader';
import { governorates as GOVS, fetchDelegations, fetchCities } from '../services/locations';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
  const { mosques, loading, error } = useMosques();
  const [region] = useState({ latitude: 34.0, longitude: 9.6, latitudeDelta: 6.0, longitudeDelta: 6.0 });
  const [gov, setGov] = useState('');
  const [del, setDel] = useState('');
  const [city, setCity] = useState('');
  
  const [govPickerOpen, setGovPickerOpen] = useState(false);
  const [delPickerOpen, setDelPickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const [delegations, setDelegations] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingDel, setLoadingDel] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);

  const mosqueIcon = require('../../assets/mosque.png');

  useEffect(() => {
    (async () => {
      setLoadingDel(true);
      try {
        if (gov) {
          const list = await fetchDelegations(gov);
          setDelegations(list);
        } else {
          setDelegations([]);
        }
      } finally {
        setLoadingDel(false);
      }
      setDel('');
      setCity('');
      setCities([]);
    })();
  }, [gov]);

  useEffect(() => {
    (async () => {
      setLoadingCity(true);
      try {
        if (gov && del) {
          const list = await fetchCities(gov, del);
          setCities(list);
        } else {
          setCities([]);
        }
      } finally {
        setLoadingCity(false);
      }
      setCity('');
    })();
  }, [del]);

  const markers = useMemo(() => {
    const arr = Array.isArray(mosques) ? mosques : [];
    const g = gov.trim().toLowerCase();
    const d = del.trim().toLowerCase();
    const c = city.trim().toLowerCase();
    
    let filtered = arr;
    if (g || d || c) {
      filtered = arr.filter(m => {
        const mg = (m.governorate || '').toLowerCase();
        const md = (m.delegation || '').toLowerCase();
        const mc = (m.city || '').toLowerCase();
        return (!g || mg === g) && (!d || md === d) && (!c || mc === c);
      });
    }

    return filtered.map((m) => ({
      key: String(m.id),
      id: m.id,
      title: m.arabic_name || m.type || 'Mosque',
      coordinate: { latitude: m.latitude, longitude: m.longitude },
    }));
  }, [mosques, gov, del, city]);

  const governorates = ['All', ...GOVS];

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
      
      {/* Filters Overlay */}
      <View style={styles.filterBar}>
        <View style={styles.filterRow}>
            {/* Filter Buttons */}
              <TouchableOpacity style={styles.filterInput} onPress={() => setGovPickerOpen(true)}>
                <Text style={{ color: theme.colors.text }} numberOfLines={1}>{gov || 'Gov / ولاية'}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.muted} />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.filterInput, !gov && { opacity: 0.6 }]} disabled={!gov} onPress={() => setDelPickerOpen(true)}>
                <Text style={{ color: theme.colors.text }} numberOfLines={1}>{del || 'Del / معتمدية'}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.muted} />
              </TouchableOpacity>

              {(gov || del || city) ? (
                <TouchableOpacity style={[styles.filterInput, { flex: 0, paddingHorizontal: 12, backgroundColor: theme.colors.primary }]} onPress={() => { setGov(''); setDel(''); setCity(''); }}>
                  <MaterialCommunityIcons name="filter-off" size={16} color="#fff" />
                </TouchableOpacity>
              ) : null}
        </View>

        {/* Pending Mosques Section */}
        <TouchableOpacity 
          style={styles.pendingBtn}
          onPress={() => navigation.navigate('Tabs', { 
            screen: 'ListTab',
            params: { filter: 'pending' } 
          })}
        >
          <MaterialCommunityIcons name="clock-outline" size={16} color="#fff" />
          <Text style={styles.pendingText}>Pending Mosques ({mosques.filter(m => m.approved === false).length})</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={govPickerOpen} transparent animationType="fade" onRequestClose={() => setGovPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <FlatList
              data={governorates}
              keyExtractor={(item, idx) => String(idx)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionRow} onPress={() => { setGov(item === 'All' ? '' : item); setGovPickerOpen(false); }}>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setGovPickerOpen(false)}><Text style={styles.modalCloseText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={delPickerOpen} transparent animationType="fade" onRequestClose={() => setDelPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
             {loadingDel ? <ActivityIndicator color={theme.colors.primary} /> : (
              <FlatList
                data={['All', ...delegations]}
                keyExtractor={(item, idx) => String(idx)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.optionRow} onPress={() => { setDel(item === 'All' ? '' : item); setDelPickerOpen(false); }}>
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
             )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setDelPickerOpen(false)}><Text style={styles.modalCloseText}>Close</Text></TouchableOpacity>
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
  filterBar: { position: 'absolute', top: 12, left: 12, right: 12, gap: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 3 },
  filterCount: { marginLeft: 8, color: theme.colors.muted },
  pendingBtn: { backgroundColor: theme.colors.secondary, borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 3 },
  pendingText: { color: '#fff', fontFamily: 'Cairo-Bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '85%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  optionRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  optionText: { color: theme.colors.text, fontSize: 16, fontFamily: 'Cairo-Medium' },
  modalClose: { marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.primary, borderRadius: 8 },
  modalCloseText: { color: '#fff' },
  
});
