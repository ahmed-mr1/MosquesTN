import React, { useMemo, useState, useCallback, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useMosques } from '../context/MosquesContext';
import { theme } from '../theme';
import FullScreenLoader from '../components/FullScreenLoader';

export default function ListScreen({ navigation }) {
  const { mosques, loading, error, lastUpdated, refresh } = useMosques();
  const [gov, setGov] = useState('');
  const [city, setCity] = useState('');

  const data = useMemo(() => {
    const arr = Array.isArray(mosques) ? mosques : [];
    const g = gov.trim().toLowerCase();
    const c = city.trim().toLowerCase();
    if (!g && !c) return arr;
    return arr.filter(m => {
      const mg = (m.governorate || '').toLowerCase();
      const mc = (m.city || '').toLowerCase();
      return (!g || mg.includes(g)) && (!c || mc.includes(c));
    });
  }, [mosques, gov, city]);

  if (loading && data.length === 0) {
    return <FullScreenLoader message="جارٍ تحميل المساجد…" />;
  }
  if (error && data.length === 0) {
    return (
      <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
    );
  }

  const Row = memo(function Row({ item, onPress }) {
    return (
      <TouchableOpacity style={styles.row} onPress={() => onPress(item.id)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.arabic_name || item.type || 'Mosque'}</Text>
          <Text style={styles.subtitle}>{[item.type, item.city].filter(Boolean).join(' • ')}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  });

  const onPressItem = useCallback((id) => {
    navigation.navigate('MosqueDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <Row item={item} onPress={onPressItem} />
  ), [onPressItem]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Governorate"
          value={gov}
          onChangeText={setGov}
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}</Text>
          <TouchableOpacity onPress={() => refresh()}><Text style={styles.refresh}>Refresh</Text></TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.lg }}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#c00' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.md },
  title: { fontFamily: 'Cairo-Medium', fontSize: 16, color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 4 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee' },
  chevron: { fontSize: 24, color: theme.colors.muted, paddingLeft: theme.spacing.md },
  filters: { padding: theme.spacing.md, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: theme.radius.md, padding: theme.spacing.sm, marginBottom: theme.spacing.sm },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { color: theme.colors.muted },
  refresh: { color: theme.colors.primary, fontFamily: 'Cairo-Medium' },
});
