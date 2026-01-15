import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { getMosque, getMosqueReviews, postMosqueReview, confirmMosque, getMosqueSuggestion, confirmSuggestion } from '../services/api';

export default function MosqueDetailScreen({ route, navigation }) {
  const { id, isSuggestion } = route.params || {};
  const [mosque, setMosque] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      if (isSuggestion) {
        const m = await getMosqueSuggestion(id);
        setMosque(m);
        setReviews([]);
      } else {
        const [m, r] = await Promise.all([
          getMosque(id),
          getMosqueReviews(id),
        ]);
        setMosque(m);
        setReviews(Array.isArray(r) ? r : []);
      }
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [id, isSuggestion]);

  useEffect(() => { load(); }, [load]);

  const confirm = async () => {
    try {
      if (isSuggestion) {
        await confirmSuggestion(id);
      } else {
        await confirmMosque(id);
      }
      Alert.alert('Thank you', 'Your confirmation was recorded');
      await load();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to confirm');
    }
  };

  if (loading && !mosque) {
    return (
      <View style={styles.center}><ActivityIndicator /></View>
    );
  }

  if (error && !mosque) {
    return (
      <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
    );
  }

  if (!mosque) {
    return (
      <View style={styles.center}><Text style={styles.muted}>No mosque found.</Text></View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{mosque.arabic_name || mosque.type || 'Mosque'}</Text>
      {!!mosque.address && <Text style={styles.subtitle}>{mosque.address}</Text>}

      {!!mosque.image_url && (
        <Image
          source={{ uri: mosque.image_url }}
          style={styles.mosqueImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text>Latitude: {mosque.latitude}</Text>
        <Text>Longitude: {mosque.longitude}</Text>
        {!!mosque.city && <Text>City: {mosque.city}</Text>}
        {!!mosque.governorate && <Text>Governorate: {mosque.governorate}</Text>}
      </View>

      {/* Staff Section */}
      {(mosque.muazzin_name || mosque.imam_5_prayers_name || mosque.imam_jumua_name || mosque.jumuah_time) && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff & Times / القائمون والمسجد</Text>
        {!!mosque.jumuah_time && <Text style={styles.txt}>Jumuah Time: {mosque.jumuah_time}</Text>}
        {!!mosque.muazzin_name && <Text style={styles.txt}>Muazzin: {mosque.muazzin_name}</Text>}
        {!!mosque.imam_5_prayers_name && <Text style={styles.txt}>Imam (5 Prayers): {mosque.imam_5_prayers_name}</Text>}
        {!!mosque.imam_jumua_name && <Text style={styles.txt}>Imam Jumuah: {mosque.imam_jumua_name}</Text>}
      </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facilities</Text>
        <View style={styles.facilitiesRow}>
          {mosque.women_section ? (
            <View style={styles.facItem}><MaterialCommunityIcons name="human-female" size={18} /><Text style={styles.facText}>Women</Text></View>
          ) : null}
          {mosque.parking ? (
            <View style={styles.facItem}><MaterialCommunityIcons name="parking" size={18} /><Text style={styles.facText}>Parking</Text></View>
          ) : null}
          {mosque.wudu ? (
            <View style={styles.facItem}><MaterialCommunityIcons name="water-pump" size={18} /><Text style={styles.facText}>Wudu</Text></View>
          ) : null}
          {mosque.accessibility ? (
            <View style={styles.facItem}><MaterialCommunityIcons name="wheelchair-accessibility" size={18} /><Text style={styles.facText}>Accessible</Text></View>
          ) : null}
          {mosque.ac ? (
            <View style={styles.facItem}><MaterialCommunityIcons name="air-conditioner" size={18} /><Text style={styles.facText}>AC</Text></View>
          ) : null}
          {!mosque.women_section && !mosque.parking && !mosque.wudu && !mosque.accessibility && !mosque.ac ? (
            <Text style={styles.muted}>No facilities listed.</Text>
          ) : null}
        </View>
      </View>

      {!isSuggestion && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews / التقييمات</Text>
        {reviews.length === 0 ? (
          <Text style={styles.muted}>No reviews yet.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <Text style={styles.reviewRating}>Rating: {r.rating}/5</Text>
                <Text style={styles.reviewDate}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</Text>
              </View>
              {Object.keys(r.criteria || {}).length > 0 && (
                <View style={styles.criteriaRow}>
                  {Object.entries(r.criteria).map(([k, v]) => (
                    <Text key={k} style={styles.criteriaTag}>{k}: {v}</Text>
                  ))}
                </View>
              )}
              {!!r.content && <Text style={styles.reviewContent}>{r.content}</Text>}
            </View>
          ))
        )}
      </View>
      )}

      
      <View style={{ gap: 10, marginTop: 10 }}>
       {(!isSuggestion && mosque.approved !== false) ? (
        <>
        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={() => navigation.navigate('Review', { mosqueId: id, mosqueName: mosque.arabic_name })}>
          <Text style={styles.btnText}>Write a Review / أكتب تقييم</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.accent }]} onPress={() => navigation.navigate('EditMosque', { mosque })}>
          <Text style={styles.btnText}>Suggest Edit / اقتراح تعديل</Text>
        </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={confirm}>
          <Text style={styles.btnText}>Confirm this mosque exists / تأكيد وجود المسجد</Text>
        </TouchableOpacity>
      )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontFamily: 'Cairo-Bold', color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.muted, marginTop: 6 },
  section: { marginTop: theme.spacing.lg },
  sectionTitle: { fontFamily: 'Cairo-Bold', marginBottom: theme.spacing.sm, color: theme.colors.text },
  muted: { color: theme.colors.muted },
  facilitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  facItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 8 },
  facText: { marginLeft: 6 },
  review: { paddingVertical: theme.spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  reviewRating: { fontFamily: 'Cairo-Medium', color: theme.colors.primary },
  reviewDate: { fontSize: 12, color: theme.colors.muted },
  criteriaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  criteriaTag: { fontSize: 10, backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: theme.colors.text },
  reviewContent: { marginTop: 4, fontFamily: 'Cairo-Regular', color: theme.colors.text },
  reviewStatus: { marginTop: 4, fontSize: 12, color: theme.colors.muted },
  btn: { marginTop: theme.spacing.lg, paddingVertical: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center' },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.secondary, marginTop: theme.spacing.md },
  btnText: { color: '#fff', fontFamily: 'Cairo-Medium' },
  mosqueImage: { width: '100%', height: 200, borderRadius: theme.radius.md, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm, backgroundColor: theme.colors.surface },
});
