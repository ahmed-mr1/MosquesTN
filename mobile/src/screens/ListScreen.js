import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, RefreshControl } from 'react-native';
import { theme } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useMosques } from '../context/MosquesContext';

export default function ListScreen() {
    const { role } = useAuth();
    const navigation = useNavigation();
    const { mosques, loading, refresh } = useMosques();
    const [search, setSearch] = useState('');

    const filteredItems = mosques.filter(m => {
        if (!search) return true;
        const term = search.toLowerCase();
        const name = (m.arabic_name || '').toLowerCase();
        const city = (m.city || '').toLowerCase();
        return name.includes(term) || city.includes(term);
    });

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, item.isSuggestion && styles.suggestionCard]}
            onPress={() => navigation.navigate('MosqueDetail', { mosque: item, isSuggestion: item.isSuggestion })}
        >
            <Image
                source={item.image_url ? { uri: item.image_url } : require('../../assets/mosquetn.jpg')}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={styles.name}>{item.arabic_name}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 5, alignItems: 'center' }}>
                    <Text style={styles.address}>{item.city}, {item.governorate}</Text>
                    <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
                </View>
                {item.isSuggestion && (
                    <View style={styles.pendingBadge}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.pendingText}>Pending Confirmation ({item.confirmations_count || 0}/3)</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchBox}>
                    <MaterialCommunityIcons name="magnify" size={24} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Search / ابحث عن مسجد..."
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><MaterialCommunityIcons name="close" size={20} color="#666" /></TouchableOpacity>}
                </View>
                {role !== 'guest' && (
                    <TouchableOpacity onPress={() => navigation.navigate('AddMosque')} style={{ marginLeft: 10 }}>
                        <MaterialCommunityIcons name="plus-circle" size={40} color={theme.colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {loading && mosques.length === 0 ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} /> : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={i => (i.isSuggestion ? 's_' : 'm_') + i.id}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No mosques found.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: { flexDirection: 'row', padding: 12, alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, height: 44 },
    input: { flex: 1, marginLeft: 8, textAlign: 'right', fontFamily: 'Cairo-Regular' },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 10, elevation: 2, alignItems: 'center' },
    suggestionCard: { borderLeftWidth: 4, borderLeftColor: '#f57c00', backgroundColor: '#fffbf0' },
    image: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#eee' },
    info: { marginLeft: 12, flex: 1, justifyContent: 'center' },
    name: { fontSize: 16, fontFamily: 'Amiri-Bold', marginBottom: 4, textAlign: 'right', color: '#333' },
    address: { fontSize: 13, color: '#666', textAlign: 'right', fontFamily: 'Cairo-Regular' },
    pendingBadge: { alignSelf: 'flex-end', backgroundColor: '#f57c00', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    pendingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});
