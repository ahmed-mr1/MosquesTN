import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { theme } from '../theme';
import { postMosqueReview } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CRITERIA = [
  { id: 'cleanliness', label: 'Cleanliness / النظافة', icon: 'broom' },
  { id: 'wudu_area', label: 'Wudu Area / الميضة', icon: 'water' },
  { id: 'women_section', label: 'Women Section / مصلى النساء', icon: 'human-female' },
  { id: 'comfort', label: 'Tranquility / الطمأنينة', icon: 'weather-sunny' },
];

export default function ReviewScreen({ route, navigation }) {
  const { mosqueId, mosqueName } = route.params || {};
  const [generalRating, setGeneralRating] = useState(5);
  const [criteriaRatings, setCriteriaRatings] = useState({});
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setCriterionRating = (id, val) => {
    setCriteriaRatings(prev => ({ ...prev, [id]: val }));
  };

  const onSubmit = async () => {
    if (!mosqueId) return Alert.alert('Error', 'Mosque ID missing');
    if (content.length < 3) return Alert.alert('Error', 'Please write a review content.');
    
    setSubmitting(true);
    try {
      // Calculate overall or send structured
      const payload = {
        rating: generalRating,
        comment: content,
        criteria: criteriaRatings
      };
      
      await postMosqueReview(mosqueId, payload);
      Alert.alert('Success', 'Review submitted successfully pending moderation.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRow = ({ label, value, onChange, size = 24, showLabel = true }) => (
    <View style={styles.starRow}>
      {showLabel && <Text style={styles.starLabel}>{label}</Text>}
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(v => (
          <TouchableOpacity key={v} onPress={() => onChange(v)}>
            <MaterialCommunityIcons 
              name={v <= value ? "star" : "star-outline"} 
              size={size} 
              color={theme.colors.secondary} 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review {mosqueName}</Text>
      <Text style={styles.subtitle}>تقييم المسجد</Text>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>General Rating / التقييم العام</Text>
        <StarRow 
          label="Overall" 
          value={generalRating} 
          onChange={setGeneralRating} 
          size={32}
          showLabel={false}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionHeader}>Details / التفاصيل</Text>
        {CRITERIA.map(c => (
          <StarRow
            key={c.id}
            label={c.label}
            value={criteriaRatings[c.id] || 0}
            onChange={(v) => setCriterionRating(c.id, v)}
          />
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Review / تعليقك</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={6}
          placeholder="Share your experience... / شاركنا تجربتك..."
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity 
        style={[styles.btn, submitting && styles.disabled]} 
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Review / إرسال</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  title: { fontSize: 20, fontFamily: 'Cairo-Bold', color: theme.colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: theme.colors.muted, textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1, marginBottom: 20 },
  sectionHeader: { fontFamily: 'Cairo-Bold', marginBottom: 10, color: theme.colors.text },
  starRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  starLabel: { fontFamily: 'Cairo-Medium', fontSize: 14, color: theme.colors.text },
  stars: { flexDirection: 'row', gap: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  inputContainer: { marginBottom: 20 },
  label: { fontFamily: 'Cairo-Bold', marginBottom: 8, color: theme.colors.text },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#eee', fontFamily: 'Cairo-Regular' },
  btn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontFamily: 'Cairo-Bold', fontSize: 16 },
  disabled: { opacity: 0.7 },
});
