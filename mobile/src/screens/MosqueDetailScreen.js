import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { getMosque, getMosqueReviews, postMosqueReview, confirmMosque } from '../services/api';

export default function MosqueDetailScreen({ route }) {
  const { id } = route.params || {};
  const [mosque, setMosque] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [m, r] = await Promise.all([
        getMosque(id),
        getMosqueReviews(id),
      ]);
      setMosque(m);
      setReviews(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submitQuickReview = async () => {
    try {
      await postMosqueReview(id, { rating: 5, content: 'جميل ونظيف' });
      Alert.alert('Review sent', 'Pending moderation');
      await load();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to submit review');
    }
  };

  const confirm = async () => {
    try {
      await confirmMosque(id);
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text>Latitude: {mosque.latitude}</Text>
        <Text>Longitude: {mosque.longitude}</Text>
        {!!mosque.city && <Text>City: {mosque.city}</Text>}
        {!!mosque.governorate && <Text>Governorate: {mosque.governorate}</Text>}
        {!!mosque.neighborhood && <Text>Neighborhood: {mosque.neighborhood}</Text>}
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.muted}>No reviews yet.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <Text style={styles.reviewRating}>Rating: {r.rating}/5</Text>
              {!!r.content && <Text style={styles.reviewContent}>{r.content}</Text>}
              {r.status && <Text style={styles.reviewStatus}>Status: {r.status}</Text>}
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={[styles.btn, styles.primary]} onPress={submitQuickReview}>
        <Text style={styles.btnText}>Leave quick 5★ review</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={confirm}>
        <Text style={styles.btnText}>Confirm this mosque exists</Text>
      </TouchableOpacity>
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
  reviewRating: { fontFamily: 'Cairo-Medium' },
  reviewContent: { marginTop: 4 },
  reviewStatus: { marginTop: 4, fontSize: 12, color: theme.colors.muted },
  btn: { marginTop: theme.spacing.lg, paddingVertical: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center' },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.secondary, marginTop: theme.spacing.md },
  btnText: { color: '#fff', fontFamily: 'Cairo-Medium' },
});
