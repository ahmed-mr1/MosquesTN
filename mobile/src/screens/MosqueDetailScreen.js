import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { theme } from '../theme';
import { getMosque, api } from '../services/api'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function MosqueDetailScreen({ route, navigation }) {
  const { id, mosque: initialMosque, isSuggestion } = route.params || {};
  const { role, jwt, signOut } = useAuth(); 
  const [mosque, setMosque] = useState(initialMosque || null);
  const [loading, setLoading] = useState(!initialMosque);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!mosque && id) {
        if (isSuggestion) {
             // Fetch logic for single suggestion could be added here, but for now we rely on list passing it
             Alert.alert("Error", "Detail view for suggestions requires passing the object.");
             navigation.goBack();
             return;
        }

        (async () => {
        try {
            const data = await getMosque(id);
            setMosque(data);
        } catch (e) {
            Alert.alert('Error', 'Could not load mosque details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
        })();
    } else {
        setLoading(false);
    }
  }, [id, mosque, isSuggestion]);

  const openMap = () => {
    if(!mosque) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${mosque.latitude},${mosque.longitude}`;
    Linking.openURL(url);
  };

  const handleConfirm = async () => {
      if(role === 'guest') {
           Alert.alert("Login Required", "Please login to confirm this mosque.", [
               { text: "Cancel" },
               { text: "Login", onPress: () => signOut() } 
           ]);
           return;
      }
      setConfirming(true);
      try {
          await api.post(`/suggestions/${mosque.id}/confirmations`);
          Alert.alert("Success", "You have confirmed this mosque location/details.");
          navigation.goBack();
      } catch (e) {
          Alert.alert("Error", e.response?.data?.message || "Confirmation failed (maybe you already confirmed?)");
      } finally {
          setConfirming(false);
      }
  };

    const handleRestrictedAction = (action, targetScreen, params={}) => {
      if (role === 'guest') {
          Alert.alert(
              "Login Required / تنبيه",
              "Please login to perform this action.\nالرجاء تسجيل الدخول.",
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Login", onPress: () => signOut() }
              ]
          );
      } else {
          navigation.navigate(targetScreen, params); 
      }
  };


  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  if (!mosque) return null;

  const cleanFacilities = mosque.facilities || mosque.facilities_json || {};

  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
        {isSuggestion && (
            <View style={styles.warningBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#fff" />
                <Text style={styles.warningText}>This is a user suggestion. Verify before visiting.</Text>
            </View>
        )}
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      {mosque.image_url ? (
          <Image source={{ uri: mosque.image_url }} style={styles.banner} />
      ) : (
          <View style={[styles.banner, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons name="mosque" size={60} color="#aaa" />
          </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name}>{mosque.arabic_name}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{mosque.type}</Text></View>
        
        <TouchableOpacity style={styles.locationRow} onPress={openMap}>
             <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.secondary} />
             <Text style={styles.location}>{mosque.city}, {mosque.governorate}</Text>
        </TouchableOpacity>
        <Text style={styles.addressText}>{mosque.address}</Text>

        <View style={styles.divider} />

        {isSuggestion ? (
             <View style={styles.confirmBox}>
                 <Text style={styles.confirmTitle}>Has this mosque been verified?</Text>
                 <Text style={styles.confirmSubtitle}>Current confirmations: {mosque.confirmations_count || 0} / 3</Text>
                 <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={confirming}>
                     {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm Existence</Text>}
                 </TouchableOpacity>
             </View>
        ) : (
            <>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Facilities / المرافق</Text>
                </View>
                
                <View style={styles.facilities}>
                    <FacilityIcon icon="human-female" label="Nissa" active={cleanFacilities.women_section || cleanFacilities.women} />
                    <FacilityIcon icon="water" label="Wudu" active={cleanFacilities.wudu} />
                    <FacilityIcon icon="air-conditioner" label="AC" active={cleanFacilities.ac} />
                    <FacilityIcon icon="wheelchair-accessibility" label="Wheelchair" active={cleanFacilities.accessibility} />
                    <FacilityIcon icon="parking" label="Parking" active={cleanFacilities.parking} />
                    {(cleanFacilities.library) && <FacilityIcon icon="book-open-variant" label="Library" active={true} />}
                    {(cleanFacilities.quran_school) && <FacilityIcon icon="school" label="Kuttab" active={true} />}
                    {(cleanFacilities.morgue) && <FacilityIcon icon="coffin" label="Mortuary" active={true} />}
                </View>

                <View style={styles.divider} />
            
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Prayer Times / أوقات الصلاة</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('PrayerTimes', { mosque })}>
                        <Text style={styles.link}>Show Times</Text>
                    </TouchableOpacity>
                </View>
            </>
        )}

        <View style={styles.divider} />
        
        {!isSuggestion && (
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleRestrictedAction('rate', 'Review', { mosqueId: mosque.id })}>
                    <MaterialCommunityIcons name="star-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.actionLabel}>Rate</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleRestrictedAction('edit', 'EditMosque', { mosque })}>
                    <MaterialCommunityIcons name="pencil-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.actionLabel}>Suggest Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <MaterialCommunityIcons name="share-variant-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.actionLabel}>Share</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const FacilityIcon = ({ icon, label, active }) => (
    <View style={[styles.facility, !active && styles.facilityInactive]}>
        <MaterialCommunityIcons name={icon} size={24} color={active ? theme.colors.primary : '#ccc'} />
        <Text style={[styles.facilityLabel, !active && { color: '#ccc' }]}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { width: '100%', height: 200 },
  content: { padding: 20 },
  name: { fontSize: 24, fontWeight: 'bold', fontFamily: 'Cairo-Bold', textAlign: 'center', marginBottom: 8 },
  badge: { alignSelf: 'center', backgroundColor: '#e0f2f1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  badgeText: { color: theme.colors.primary, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  location: { fontSize: 16, color: '#666', marginLeft: 8 },
  addressText: { textAlign: 'center', color: '#888', marginBottom: 20, fontSize: 12 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Cairo-Bold' },
  link: { color: theme.colors.primary, fontWeight: 'bold' },
  facilities: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  facility: { alignItems: 'center', width: 60 },
  facilityInactive: { opacity: 0.5 },
  facilityLabel: { fontSize: 10, marginTop: 4, color: '#333' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  actionBtn: { alignItems: 'center', padding: 10 },
  actionLabel: { fontSize: 12, color: theme.colors.primary, marginTop: 4, fontWeight: 'bold' },
  warningBanner: { backgroundColor: '#f57c00', padding: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  warningText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  confirmBox: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  confirmTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  confirmSubtitle: { color: '#666', marginBottom: 16 },
  confirmBtn: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' }
});
