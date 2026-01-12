import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { createReview } from '../api';

export default function ReviewScreen({ route }) {
  const mosqueIdFromRoute = route?.params?.mosqueId;
  const [mosqueId, setMosqueId] = useState(mosqueIdFromRoute ? String(mosqueIdFromRoute) : '');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  const onSubmit = async () => {
    if (!mosqueId) return alert('Mosque ID required');
    try {
      const payload = { mosque_id: Number(mosqueId), rating: Number(rating), comment };
      await createReview(payload);
      alert('Review submitted');
    } catch (e) {
      alert('Submit failed: ' + (e?.response?.data?.message || e?.message || e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Review</Text>
      <TextInput style={styles.input} placeholder="Mosque ID" value={mosqueId} onChangeText={setMosqueId} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Rating (1-5)" value={rating} onChangeText={setRating} keyboardType="numeric" />
      <TextInput style={[styles.input, { height: 120 }]} placeholder="Comment" value={comment} onChangeText={setComment} multiline />
      <TouchableOpacity style={styles.btn} onPress={onSubmit}>
        <Text style={styles.btnText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  title: { fontSize: theme.typography.h1, color: theme.colors.primary, marginBottom: theme.spacing.md, fontFamily: 'Cairo-Bold' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  btn: { marginTop: theme.spacing.lg, backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.radius.md },
  btnText: { color: '#fff', textAlign: 'center', fontFamily: 'Cairo-Medium' },
});
