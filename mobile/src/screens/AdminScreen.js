import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Modal, ScrollView, Platform } from 'react-native';
import { theme } from '../theme';
import { api } from '../services/api'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const FACILITY_OPTS = {
    women_section: { label: "Women's Section / مصلى نساء", icon: "human-female" },
    wudu: { label: "Wudu Area / ميضأة", icon: "water" },
    men_bathrooms: { label: "Men's Bathrooms / دورة مياه رجال", icon: "toilet" },
    women_bathrooms: { label: "Women's Bathrooms / دورة مياه نساء", icon: "toilet" },
    parking: { label: "Parking / موقف سيارات", icon: "car" },
    accessibility: { label: "Accessible / ولوج ذوي الاحتياجات", icon: "wheelchair-accessibility" },
    ac: { label: "A/C / مكيف", icon: "air-conditioner" },
    library: { label: "Library / مكتبة", icon: "book-open-variant" },
    quran_school: { label: "Quran School / كتاب", icon: "school" },
    daily_prayers: { label: "Daily Prayers / الصلوات الخمس", icon: "mosque" },
    jumua_prayer: { label: "Jumuah Prayer / صلاة الجمعة", icon: "account-group" },
    morgue: { label: "Funeral Prayer / صلاة الجنازة", icon: "hand-heart" },
};

export default function AdminScreen() {
  const { signOut } = useAuth();
  const [filter, setFilter] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('mosques'); // mosques, reviews, edits
  const [selectedItem, setSelectedItem] = useState(null); // For Detail Modal

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if(tab === 'mosques') endpoint = '/moderation/suggestions';
      else if(tab === 'reviews') endpoint = '/moderation/reviews';
      else if(tab === 'edits') endpoint = '/moderation/edits';
      
      let statusParam = filter;
      if (filter === 'all') statusParam = 'all';
      else if (filter === 'pending') {
          if (tab === 'mosques') statusParam = 'pending_approval';
          else statusParam = 'pending';
      }

      const { data } = await api.get(endpoint, { params: { status: statusParam } });
      setItems(data);
    } catch (error) {
       console.error("Admin fetch error:", error);
       Alert.alert("Fetch Error", error?.response?.data?.message || "Check network or backend deployment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter, tab]);

  const handleAction = async (id, action) => {
      // action: approve, reject, delete
      try {
        let typeUrl = '';
        if(tab === 'mosques') typeUrl = 'suggestions';
        else if(tab === 'reviews') typeUrl = 'reviews';
        else if(tab === 'edits') typeUrl = 'edits';

        if (action === 'delete') {
            await api.delete(`/moderation/${typeUrl}/${id}`);
        } else {
            await api.post(`/moderation/${typeUrl}/${id}/${action}`);
        }
        Alert.alert("Success", `Item ${action}d`);
        setSelectedItem(null); 
        loadData();
      } catch (e) {
        // Detailed error logging
        const errMsg = e?.response?.data?.message || e.message || "Operation failed";
        console.error("Action Error:", e?.response?.status, e?.response?.data);
        Alert.alert("Action Failed", errMsg);
      }
  };

  const getStatusColor = (s) => {
      if(s === 'approved') return 'green';
      if(s === 'rejected') return 'red';
      return '#f57c00'; // orange
  }

  // --- Renderers ---

  const renderItem = ({ item }) => {
     let title = "Item";
     let subtitle = "";
     if(tab === 'mosques') {
         title = item.arabic_name;
         subtitle = `${item.type}  ${item.city}`;
     } else if(tab === 'reviews') {
         title = `Rating: ${item.rating}/5`;
         subtitle = item.comment ? (item.comment.substring(0, 40) + '...') : "No comment";
     } else if(tab === 'edits') {
         title = `Edit for Mosque #${item.mosque_id}`;
         subtitle = `${Object.keys(item.patch || {}).length} field(s) changed`;
     }

     return (
        <TouchableOpacity style={styles.card} onPress={() => setSelectedItem(item)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.miniActions}>
                 <Text style={{fontSize: 12, color: theme.colors.primary, fontWeight: 'bold'}}>Tap for details</Text>
                 <MaterialCommunityIcons name="chevron-right" size={16} color={theme.colors.primary} />
            </View>
        </TouchableOpacity>
     );
  };

  // --- Detail Modal ---
  const renderDetailModal = () => {
    if(!selectedItem) return null;
    const item = selectedItem;

    // Helper to render facilities
    const renderFacilities = (facilities) => {
        if (!facilities) return <Text style={styles.value}>-</Text>;
        const items = Object.entries(facilities).filter(([_, v]) => v === true);
        if (items.length === 0) return <Text style={styles.value}>None listed</Text>;

        return (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5}}>
                {items.map(([key, _]) => {
                    const conf = FACILITY_OPTS[key] || { label: key.replace(/_/g, ' '), icon: 'check-circle-outline' };
                    return (
                        <View key={key} style={styles.facilityChip}>
                            <MaterialCommunityIcons name={conf.icon} size={16} color={theme.colors.primary} />
                            <Text style={styles.facilityText}>{conf.label}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <Modal animationType="slide" transparent={false} visible={!!selectedItem} onRequestClose={()=>setSelectedItem(null)}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={()=>setSelectedItem(null)}>
                        <MaterialCommunityIcons name="close" size={30} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Details</Text>
                    <View style={{width: 30}} />
                </View>
                
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                     <View style={[styles.detailBlock, { borderLeftColor: getStatusColor(item.status) }]}>
                         <Text style={styles.label}>Status</Text>
                         <Text style={[styles.value, { color: getStatusColor(item.status), fontWeight: 'bold' }]}>{item.status ? item.status.toUpperCase() : '-'}</Text>
                         <Text style={styles.label}>Suggestion ID: <Text style={styles.value}>{item.id}</Text></Text>
                     </View>

                     {tab === 'mosques' && (
                         <>
                            <Text style={styles.sectionHeader}>Mosque Information</Text>
                            <DetailRow label="Name" value={item.arabic_name} />
                            <DetailRow label="Type" value={item.type} />
                            <DetailRow label="Location" value={`${item.city}, ${item.delegation || ''}, ${item.governorate}`} />
                            <DetailRow label="Address" value={item.address} />
                            
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.label}>Facilities:</Text>
                                {renderFacilities(item.facilities || {})}
                            </View>
                            
                             {item.image_url && (
                                <View style={{ marginTop: 10 }}>
                                    <Text style={styles.label}>Image:</Text>
                                    <Image source={{ uri: item.image_url }} style={styles.detailImage} resizeMode="cover" />
                                </View>
                            )}
                         </>
                     )}

                     {tab === 'reviews' && (
                         <>
                            <Text style={styles.sectionHeader}>Review Content</Text>
                            <DetailRow label="Rating" value={`${item.rating} / 5`} />
                            <View style={{ marginTop: 15, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                                <Text style={{ fontSize: 16, fontStyle: 'italic', lineHeight: 24 }}>
                                    "{item.comment}"
                                </Text>
                            </View>
                         </>
                     )}

                     {tab === 'edits' && (
                         <>
                            <Text style={styles.sectionHeader}>Proposed Changes (Diff)</Text>
                            <DetailRow label="Target Mosque ID" value={item.mosque_id} />
                            
                            <View style={{ marginTop: 10 }}>
                                {item.patch && Object.entries(item.patch).map(([key, val]) => {
                                    if (key === 'facilities' && typeof val === 'object') {
                                        return (
                                            <View key={key} style={{ marginBottom: 12 }}>
                                                <Text style={styles.diffKey}>Facilities (Update)</Text>
                                                {renderFacilities(val)}
                                            </View>
                                        );
                                    }
                                    return (
                                        <View key={key} style={styles.diffRow}>
                                             <Text style={styles.diffKey}>{key.replace(/_/g, ' ')}</Text>
                                             <MaterialCommunityIcons name="arrow-right" size={16} color="#666" />
                                             <Text style={styles.diffVal}>
                                                 {typeof val === 'object' ? JSON.stringify(val).replace(/[{}"]/g, '') : String(val)}
                                             </Text>
                                        </View>
                                    );
                                })}
                            </View>
                         </>
                     )}

                     <View style={{ height: 40 }} />
                </ScrollView>

                <View style={styles.footer}>
                     <View style={styles.buttonRow}>
                         {item.status !== 'approved' && (
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4caf50' }]} onPress={() => handleAction(item.id, 'approve')}>
                                <MaterialCommunityIcons name="check" color="#fff" size={20} />
                                <Text style={styles.actionBtnText}>Approve</Text>
                            </TouchableOpacity>
                         )}
                         {item.status !== 'rejected' && (
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f44336' }]} onPress={() => handleAction(item.id, 'reject')}>
                                <MaterialCommunityIcons name="close" color="#fff" size={20} />
                                <Text style={styles.actionBtnText}>Reject</Text>
                            </TouchableOpacity>
                         )}
                         <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#555' }]} onPress={() => handleAction(item.id, 'delete')}>
                             <MaterialCommunityIcons name="delete" color="#fff" size={20} />
                             <Text style={styles.actionBtnText}>Delete</Text>
                         </TouchableOpacity>
                     </View>
                </View>

            </SafeAreaView>
        </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text> 
        <View style={{flexDirection: 'row', gap: 16}}>
            <TouchableOpacity onPress={loadData}><MaterialCommunityIcons name="refresh" size={24} color={theme.colors.primary}/></TouchableOpacity>
            <TouchableOpacity onPress={signOut}><MaterialCommunityIcons name="logout" size={24} color={theme.colors.error}/></TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
         <TabButton title="Mosques" icon="mosque" active={tab==='mosques'} onPress={()=>setTab('mosques')} />
         <TabButton title="Reviews" icon="star" active={tab==='reviews'} onPress={()=>setTab('reviews')} />
         <TabButton title="Edits" icon="pencil" active={tab==='edits'} onPress={()=>setTab('edits')} />
      </View>

      <View style={styles.filters}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.activeChip]}>
                  <Text style={[styles.chipText, filter === f && styles.activeChipText]}>{f.toUpperCase()}</Text>
              </TouchableOpacity>
          ))}
      </View>

      {loading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{marginTop: 40}} /> : (
          <FlatList 
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>No items found.</Text>}
          />
      )}

      {renderDetailModal()}

    </SafeAreaView>
  );
}

// Helpers
const TabButton = ({ title, icon, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.activeTab]}>
        <MaterialCommunityIcons name={icon} size={20} color={active ? theme.colors.primary : '#888'} />
        <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
);

const DetailRow = ({ label, value }) => (
    <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || '-'}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  tabs: { flexDirection: 'row', backgroundColor: '#fff' },
  tab: { flex: 1, padding: 12, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', flexDirection: 'row', gap: 6 },
  activeTab: { borderBottomColor: theme.colors.primary },
  tabText: { fontWeight: 'bold', color: '#888', fontSize: 12 },
  activeTabText: { color: theme.colors.primary },
  filters: { flexDirection: 'row', padding: 10, justifyContent: 'space-around', backgroundColor: '#fafafa' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#e0e0e0' },
  activeChip: { backgroundColor: theme.colors.primary },
  chipText: { fontSize: 11, color: '#333', fontWeight: 'bold' },
  activeChipText: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  miniActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  detailBlock: { padding: 12, backgroundColor: '#f5f5f5', borderLeftWidth: 4, borderRadius: 4, marginBottom: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary, marginTop: 10, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  label: { fontSize: 12, color: '#888', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, color: '#333', fontFamily: 'Cairo-Regular' },
  detailImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 4 },
  jsonBox: { backgroundColor: '#fafafa', padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#eee' },
  jsonText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, lineHeight: 18 },
  diffRow: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#e3f2fd', marginTop: 4, borderRadius: 4 },
  diffKey: { fontWeight: 'bold', marginRight: 8, width: 100, fontSize: 12, textTransform: 'capitalize' },
  diffVal: { flex: 1, color: '#333', fontSize: 13 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  facilityChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: '#bbdefb' },
  facilityText: { marginLeft: 6, fontSize: 12, color: theme.colors.primary, fontWeight: '500' }
});
