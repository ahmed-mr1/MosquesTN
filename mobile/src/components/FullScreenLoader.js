import React from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function FullScreenLoader({ message = 'جارٍ التحميل…' }) {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/zitouna.png')} style={styles.logo} />
      <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.md }} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  logo: { width: 140, height: 140, resizeMode: 'contain' },
  text: { marginTop: theme.spacing.md, color: theme.colors.muted },
});
