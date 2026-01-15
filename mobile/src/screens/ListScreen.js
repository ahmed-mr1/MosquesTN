import React, { useMemo, useState, useCallback, memo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useMosques } from '../context/MosquesContext';
import { theme } from '../theme';
import FullScreenLoader from '../components/FullScreenLoader';
import { governorates as GOVS, fetchDelegations, fetchCities } from '../services/locations';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ListScreen({ navigation, route }) {
  const { mosques, loading, error, lastUpdated, refresh } = useMosques();
  const [gov, setGov] = useState(route.params?.initialGov || '');
  const [del, setDel] = useState('');
  const [city, setCity] = useState('');
  
  const [filterMode, setFilterMode] = useState(route.params?.filter || 'all');

  
  // Picker states
  const [govPickerOpen, setGovPickerOpen] = useState(false);
  const [delPickerOpen, setDelPickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [delegations, setDelegations] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingDel, setLoadingDel] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);

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

  const data = useMemo(() => {
    const arr = Array.isArray(mosques) ? mosques : [];
    
    // First, filter by pending status if requested
    let filtered = arr;
    if (filterMode === 'pending') {
      filtered = arr.filter(m => m.approved === false);
    } else {
      // By default show approved only, or standard feed
      filtered = arr.filter(m => m.approved !== false); 
    }

    const g = gov.trim().toLowerCase();
    const d = del.trim().toLowerCase();
    const c = city.trim().toLowerCase();

    if (!g && !d && !c) return filtered;

    return filtered.filter(m => {
      const mg = (m.governorate || '').toLowerCase();
      const md = (m.delegation || '').toLowerCase();
      const mc = (m.city || '').toLowerCase();
      return (!g || mg === g) && (!d || md === d) && (!c || mc === c);
    });
  }, [mosques, gov, del, city, filterMode]);

  const governorates = ['All', ...GOVS];

  if (loading && data.length === 0) {
    return <FullScreenLoader message="جارٍ تحميل المساجد…" />;
  }
  if (error && data.length === 0) {
    return (
      <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
    );
  }

  const Row = memo(function Row({ item, onPress }) {
    return (
      <TouchableOpacity style={styles.row} onPress={() => onPress(item.id)}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="mosque" size={24} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>{item.arabic_name || item.type || 'Mosque'}</Text>
          <Text style={styles.subtitle}>{[item.type, item.city].filter(Boolean).join(' • ')}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.muted} />
      </TouchableOpacity>
    );
  });

  const onPressItem = useCallback((id) => {
    navigation.navigate('MosqueDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <Row item={item} onPress={onPressItem} />
  ), [onPressItem]);

  useEffect(() => {
    if (route.params?.filter) {
      setFilterMode(route.params.filter);
    }
  }, [route.params?.filter]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.filters}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={styles.filterTitle}>
            {filterMode === 'pending' ? 'Pending Confirmations / مساجد قيد التأكيد' : 'Filter Mosques / تصفية'}
          </Text>
          {filterMode === 'pending' && (
            <TouchableOpacity onPress={() => setFilterMode('all')}>
              <Text style={{color: theme.colors.primary, fontSize: 12}}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setGovPickerOpen(true)}>
             <Text style={styles.filterBtnText} numberOfLines={1}>{gov || 'Governorate / ولاية'}</Text>
             <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, !gov && styles.disabled]} disabled={!gov} onPress={() => setDelPickerOpen(true)}>
             <Text style={styles.filterBtnText} numberOfLines={1}>{del || 'Delegation / معتمدية'}</Text>
             <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, !del && styles.disabled]} disabled={!del} onPress={() => setCityPickerOpen(true)}>
             <Text style={styles.filterBtnText} numberOfLines={1}>{city || 'City / مدينة'}</Text>
             <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{data.length} Mosques found</Text>
          <TouchableOpacity onPress={() => refresh()}><Text style={styles.refresh}>Refresh</Text></TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.lg }}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
      />

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

      <Modal visible={cityPickerOpen} transparent animationType="fade" onRequestClose={() => setCityPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {loadingCity ? <ActivityIndicator color={theme.colors.primary} /> : (
              <FlatList
                data={['All', ...cities]}
                keyExtractor={(item, idx) => String(idx)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.optionRow} onPress={() => { setCity(item === 'All' ? '' : item); setCityPickerOpen(false); }}>
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setCityPickerOpen(false)}><Text style={styles.modalCloseText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#c00' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, backgroundColor: '#fff', marginBottom: 8, paddingHorizontal: 12, borderRadius: 12, elevation: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary + '10', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Cairo-Bold', fontSize: 16, color: theme.colors.text },
  subtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 2, fontFamily: 'Cairo-Regular' },
  sep: { height: 0 },
  filters: { padding: theme.spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterTitle: { fontFamily: 'Cairo-Bold', fontSize: 14, marginBottom: 8, color: theme.colors.text },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 10 },
  filterBtnText: { fontSize: 12, color: theme.colors.text, flex: 1, fontFamily: 'Cairo-Medium' },
  disabled: { opacity: 0.5, backgroundColor: '#f0f0f0' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metaText: { color: theme.colors.muted, fontSize: 12 },
  refresh: { color: theme.colors.primary, fontSize: 12, fontFamily: 'Cairo-Bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '85%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  optionRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  optionText: { color: theme.colors.text, fontSize: 16, fontFamily: 'Cairo-Medium' },
  modalClose: { marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.primary, borderRadius: 8 },
  modalCloseText: { color: '#fff' },
});
