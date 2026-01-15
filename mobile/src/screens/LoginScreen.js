import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
// navigation is handled by conditional rendering in AppNavigator

export default function LoginScreen() {
  const { loading, login } = useAuth();

  const doLogin = async (payload) => {
    try {
      await login(payload);
      // AppNavigator will render Tabs automatically when jwt is set
    } catch (e) {
      alert('Login failed: ' + (e?.message || e));
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/zitouna2.png')} style={styles.logo} />
      <Text style={styles.title}>أهلًا بك</Text>
      <Text style={styles.subtitle}>دخول تجريبي لاستلام رمز JWT</Text>

      <View style={[styles.card, styles.block]}>
        <Text style={styles.label}>تسجيل سريع</Text>
        <TouchableOpacity disabled={loading} onPress={() => doLogin({ role: 'user' })} style={[styles.btn, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login as User</Text>}
        </TouchableOpacity>
        <TouchableOpacity disabled={loading} onPress={() => doLogin({ role: 'moderator' })} style={[styles.btn, loading && { opacity: 0.7, marginTop: theme.spacing.sm }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login as Moderator</Text>}
        </TouchableOpacity>
        <TouchableOpacity disabled={loading} onPress={() => doLogin({ role: 'admin' })} style={[styles.btn, loading && { opacity: 0.7, marginTop: theme.spacing.sm }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login as Admin</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background },
  logo: { width: 120, height: 120, alignSelf: 'center', resizeMode: 'contain', marginBottom: theme.spacing.md },
  title: { fontSize: 22, color: theme.colors.primary, marginBottom: theme.spacing.sm, textAlign: 'center', fontFamily: 'Cairo-Bold' },
  subtitle: { fontFamily: 'Cairo-Bold', fontSize: 14, color: theme.colors.muted, marginBottom: theme.spacing.lg, textAlign: 'center' },
  block: { marginBottom: theme.spacing.lg },
  card: { backgroundColor: '#fff', padding: theme.spacing.md, borderRadius: theme.radius.lg, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 3 },
  label: { fontFamily: 'Cairo-Regular', color: theme.colors.text, marginBottom: theme.spacing.sm },
  btn: { marginTop: theme.spacing.lg, backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.radius.md },
  btnText: { fontFamily: 'Cairo-Bold', color: '#fff', textAlign: 'center' }
  ,
  muted: { color: theme.colors.muted, marginBottom: theme.spacing.sm, textAlign: 'center' },
  warning: { color: '#B45309', backgroundColor: '#FEF3C7', padding: theme.spacing.sm, borderRadius: theme.radius.md, marginBottom: theme.spacing.md, textAlign: 'center' }
});
