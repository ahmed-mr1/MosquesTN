import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { mySuggestions, confirmSuggestion } from '../api';

export default function MySuggestionsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await mySuggestions();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      alert('Load failed: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onConfirm = async (id) => {
    try {
      await confirmSuggestion(id);
      alert('Confirmed');
      load();
    } catch (e) {
      alert('Confirm failed: ' + (e?.response?.data?.message || e?.message || e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Suggestions</Text>
      {loading ? <Text>Loading...</Text> : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.arabic_name || 'Mosque'}</Text>
              <Text style={styles.muted}>Status: {item.status}</Text>
              <TouchableOpacity style={styles.btn} onPress={() => onConfirm(item.id)}>
                <Text style={styles.btnText}>Confirm Existence</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg },
  title: { fontSize: theme.typography.h1, color: theme.colors.primary, marginBottom: theme.spacing.md, fontFamily: 'Cairo-Bold' },
  card: { padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, marginBottom: theme.spacing.md },
  name: { fontSize: theme.typography.h2, color: theme.colors.text, fontFamily: 'Cairo-Bold' },
  muted: { color: theme.colors.muted, marginTop: 4 },
  btn: { marginTop: theme.spacing.sm, backgroundColor: theme.colors.secondary, padding: theme.spacing.sm, borderRadius: theme.radius.sm },
  btnText: { color: '#fff', textAlign: 'center', fontFamily: 'Cairo-Medium' },
});
