import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { api } from '../services/api'; 
// Slider removed due to compatibility issues

export default function NearbyMosquesScreen({ navigation }) {
    const [location, setLocation] = useState(null);
    const [mosques, setMosques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [radius, setRadius] = useState(5); // Default 5km
    const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                setLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
            fetchNearbyMosques(loc.coords.latitude, loc.coords.longitude, radius);
        })();
    }, []);

    const fetchNearbyMosques = async (lat, lng, rad) => {
        try {
            setLoading(true);
            // This assumes your backend route matches this signature
            const response = await api.get('/mosques/nearby', {
                params: { lat: lat, lng: lng, radius: rad }
            });
            setMosques(response.data);
        } catch (error) {
            console.error("Failed to fetch nearby mosques", error);
            // Fallback for demo purposes if backend call fails or no data
            // setMosques([]); 
        } finally {
            setLoading(false);
        }
    };

    const handleRadiusChange = (val) => {
        setRadius(val);
        if(location) {
            fetchNearbyMosques(location.latitude, location.longitude, val);
        }
    }

    const renderMosqueItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MosqueDetail', { mosque: item })}>
            <View style={styles.cardIcon}>
                <MaterialCommunityIcons name="mosque" size={24} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.arabic_name}</Text>
                <Text style={styles.cardSubtitle}>{item.type}</Text>
                <Text style={styles.cardDistance}>{item.distance ? `${item.distance.toFixed(1)} km away` : 'Nearby'}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nearby Mosques</Text>
                <TouchableOpacity onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name={viewMode === 'map' ? 'format-list-bulleted' : 'map'} size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.controls}>
                <Text style={styles.label}>Search Radius: {radius} km</Text>
                <View style={styles.radiusContainer}>
                    {[5, 10, 20, 30, 50].map(val => (
                        <TouchableOpacity 
                            key={val} 
                            style={[styles.radiusBtn, radius === val && styles.radiusBtnActive]}
                            onPress={() => handleRadiusChange(val)}
                        >
                            <Text style={[styles.radiusBtnText, radius === val && styles.radiusBtnTextActive]}>{val}km</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {viewMode === 'map' ? (
                location ? (
                    <MapView 
                        style={styles.map} 
                        initialRegion={location}
                        showsUserLocation={true}
                    >
                        {mosques.map((m, index) => (
                            <Marker 
                                key={index}
                                coordinate={{ latitude: parseFloat(m.latitude), longitude: parseFloat(m.longitude) }}
                                title={m.arabic_name}
                                description={m.type}
                                onPress={() => navigation.navigate('MosqueDetail', { mosque: m })}
                            >
                                <View style={styles.markerContainer}>
                                    <View style={styles.markerBubble}>
                                        <MaterialCommunityIcons name="mosque" size={16} color="#fff" />
                                    </View>
                                    <View style={styles.markerArrow} />
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                ) : (
                    <View style={styles.center}>
                        <Text>Getting Location...</Text>
                    </View>
                )
            ) : (
                <FlatList 
                    data={mosques}
                    renderItem={renderMosqueItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 16 }}
                    refreshing={loading}
                    onRefresh={() => fetchNearbyMosques(location.latitude, location.longitude, radius)}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50 }}>No mosques found nearby.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
    controls: { padding: 16, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: '#eee' },
    label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: 'bold' },
    map: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee', elevation: 2 },
    cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e3f2fd', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
    cardSubtitle: { fontSize: 12, color: '#666' },
    cardDistance: { fontSize: 12, color: theme.colors.primary, fontWeight: 'bold', marginTop: 4 },
    markerContainer: { alignItems: 'center' },
    markerBubble: { backgroundColor: theme.colors.primary, padding: 6, borderRadius: 20, elevation: 4 },
    markerArrow: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 0, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.colors.primary },
    radiusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    radiusBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd' },
    radiusBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    radiusBtnText: { color: '#666', fontSize: 12, fontWeight: 'bold' },
    radiusBtnTextActive: { color: '#fff' },
});
