import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { theme } from '../theme';
import { useMosques } from '../context/MosquesContext';
import FullScreenLoader from '../components/FullScreenLoader';
import { governorates as GOVS, fetchDelegations, fetchCities } from '../services/locations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen({ navigation }) {
  const { mosques, loading, error } = useMosques();
  const [region] = useState({ latitude: 34.0, longitude: 9.6, latitudeDelta: 6.0, longitudeDelta: 6.0 });
  const [gov, setGov] = useState('');
  const [del, setDel] = useState('');
  const [city, setCity] = useState('');
  
  const [search, setSearch] = useState(''); // Added Search state

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


  const markers = useMemo(() => {
    const arr = Array.isArray(mosques) ? mosques : [];
    const g = gov.trim().toLowerCase();
    const d = del.trim().toLowerCase();
    const c = city.trim().toLowerCase();
    const s = search.trim().toLowerCase(); 

    let filtered = arr;
    
    if (g || d || c) {
      filtered = filtered.filter(m => {
        const mg = (m.governorate || '').toLowerCase();
        const md = (m.delegation || '').toLowerCase();
        const mc = (m.city || '').toLowerCase();
        return (!g || mg === g) && (!d || md === d) && (!c || mc === c);
      });
    }

    if (s) {
        filtered = filtered.filter(m => (m.arabic_name || '').toLowerCase().includes(s));
    }

    return filtered.filter(m => m.latitude && m.longitude).map((m) => ({
      key: m.isSuggestion ? `s_${m.id}` : `m_${m.id}`,
      id: m.id,
      mosque: m, 
      isSuggestion: !!m.isSuggestion,
      title: m.arabic_name || m.type || 'Mosque',
      isPending: !m.approved,
      coordinate: { latitude: parseFloat(m.latitude), longitude: parseFloat(m.longitude) },
    }));
  }, [mosques, gov, del, city, search]);

  const governorates = ['All', ...GOVS];

  return (
    <View style={styles.container}>
      <View style={styles.headerOverlay}>
         <View style={styles.searchBar}>
             <MaterialCommunityIcons name="magnify" size={24} color="#666" />
             <TextInput 
                style={styles.searchInput} 
                placeholder="Search map... / بحث..." 
                value={search}
                onChangeText={setSearch}
             />
             {search.length > 0 && (
                 <TouchableOpacity onPress={()=>setSearch('')}>
                     <MaterialCommunityIcons name="close" size={20} color="#666" />
                 </TouchableOpacity>
             )}
         </View>
         <View style={styles.filtersRow}>
             <FilterChip label={gov || "Gov"} onPress={()=>setGovPickerOpen(true)} active={!!gov} />
             <FilterChip label={del || "Del"} onPress={()=>{if(gov) setDelPickerOpen(true)}} active={!!del} disabled={!gov} />
             <FilterChip label={city || "City"} onPress={()=>{if(del) setCityPickerOpen(true)}} active={!!city} disabled={!del} />
             {(gov || del || city) && (
                 <TouchableOpacity onPress={() => {setGov(''); setDel(''); setCity('');}}>
                     <MaterialCommunityIcons name="filter-off" size={24} color={theme.colors.error} />
                 </TouchableOpacity>
             )}
         </View>
      </View>

      {region ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
        >
            {markers.map(marker => (
                <Marker
                    key={marker.key}
                    coordinate={marker.coordinate}
                    title={marker.title}
                    description={marker.isSuggestion ? "Suggestion (Tap for info)" : "Verified Mosque"}
                    image={!marker.isSuggestion ? require('../../assets/mosque.png') : undefined}
                    pinColor={marker.isSuggestion ? 'orange' : theme.colors.primary}
                    onCalloutPress={() => navigation.navigate('MosqueDetail', { mosque: marker.mosque, isSuggestion: marker.isSuggestion })}
                >
                     <Callout onPress={() => navigation.navigate('MosqueDetail', { mosque: marker.mosque, isSuggestion: marker.isSuggestion })}>
                          <View style={{padding: 5, alignItems: 'center', minWidth: 100}}>
                              <Text style={{fontWeight: 'bold', fontSize: 14}}>{marker.title}</Text>
                              <Text style={{fontSize: 12, color: marker.isSuggestion ? 'orange' : '#666', marginBottom: 2}}>
                                  {marker.isSuggestion ? 'Pending Confirmation' : 'Verified'}
                              </Text>
                              <Text style={{fontSize: 10, color: theme.colors.primary}}>Tap for details</Text>
                          </View>
                     </Callout>
                </Marker>
            ))}
        </MapView>
      ) : null}

      <SimplePicker visible={govPickerOpen} data={governorates} onClose={()=>setGovPickerOpen(false)} onSelect={(v)=>{setGov(v==='All'?'':v); setGovPickerOpen(false);}} />
      <SimplePicker visible={delPickerOpen} data={delegations} onClose={()=>setDelPickerOpen(false)} onSelect={(v)=>{setDel(v); setDelPickerOpen(false);}} />
      <SimplePicker visible={cityPickerOpen} data={cities} onClose={()=>setCityPickerOpen(false)} onSelect={(v)=>{setCity(v); setCityPickerOpen(false);}} />
    
    </View>
  );
}

const FilterChip = ({ label, onPress, active, disabled }) => (
    <TouchableOpacity 
        style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]} 
        onPress={onPress} 
        disabled={disabled}
    >
        <Text style={[styles.chipText, active && styles.chipTextActive, disabled && {color:'#aaa'}]}>
            {label.length > 10 ? label.substring(0,8)+'..' : label}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={14} color={active ? '#fff' : '#666'} />
    </TouchableOpacity>
);

const SimplePicker = ({ visible, data, onClose, onSelect }) => (
    <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={{flexDirection:'row', justifyContent:'space-between', padding:10, borderBottomWidth:1, borderBottomColor:'#eee'}}>
                    <Text style={{fontSize: 18, fontWeight: 'bold'}}>Select</Text>
                    <TouchableOpacity onPress={onClose}><Text style={{fontSize: 18, color:'blue'}}>Close</Text></TouchableOpacity>
                </View>
                {data.length === 0 ? <ActivityIndicator style={{marginTop: 20}} /> : (
                <FlatList data={data} keyExtractor={i=>i} renderItem={({item}) => (
                    <TouchableOpacity onPress={()=>onSelect(item)} style={{padding: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9'}}>
                        <Text style={{textAlign: 'center', fontSize: 16}}>{item}</Text>
                    </TouchableOpacity>
                )} />
                )}
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  headerOverlay: {
      position: 'absolute', top: 50, left: 10, right: 10, zIndex: 10,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 12, padding: 10,
      elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2
  },
  searchBar: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, height: 40, marginBottom: 10
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, fontFamily: 'Cairo-Regular', textAlign: 'right' },
  filtersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipDisabled: { backgroundColor: '#f5f5f5', borderColor: '#eee' },
  chipText: { fontSize: 12, marginRight: 4, color: '#333' },
  chipTextActive: { color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%' }
});
