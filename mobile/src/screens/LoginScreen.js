import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { loading, login } = useAuth();
  const [mode, setMode] = useState('guest'); // guest | user | admin
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'guest') {
          // Guest Login (Anonymous)
          // Uses legacy param { role: 'user' } which backend maps to 'guest'
          await login({ role: 'user' });
      } else {
          // User or Admin Login (Credentials)
          if(!username || !password) {
              alert('Please enter credentials');
              setBusy(false);
              return;
          }
          await login({ username, password });
      }
    } catch (e) {
      alert('Login failed: ' + (e?.message || JSON.stringify(e)));
    } finally {
        setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../assets/zitouna2.png')} style={styles.logo} />
      <Text style={styles.title}> مساجد تونس</Text>
      
      <View style={styles.toggleContainer}>
           <TouchableOpacity 
             style={[styles.toggleBtn, mode === 'guest' && styles.toggleBtnActive]} 
             onPress={()=>setMode('guest')}>
               <Text style={[styles.toggleText, mode === 'guest' && styles.toggleTextActive]}>Guest</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.toggleBtn, mode === 'user' && styles.toggleBtnActive]} 
             onPress={()=>setMode('user')}>
               <Text style={[styles.toggleText, mode === 'user' && styles.toggleTextActive]}>User</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.toggleBtn, mode === 'admin' && styles.toggleBtnActive]} 
             onPress={()=>setMode('admin')}>
               <Text style={[styles.toggleText, mode === 'admin' && styles.toggleTextActive]}>Admin</Text>
           </TouchableOpacity>
      </View>

      <View style={[styles.card, styles.block]}>
        {mode === 'guest' ? (
            <View>
                <Text style={styles.label}>Continue as Guest / دخول كزائر</Text>
                <Text style={styles.subtitle}> 
                لتصفح المساجد فقط، لا يمكنك إضافة أو تعديل البيانات.
                </Text>
            </View>
        ) : (
            <View>
                <Text style={styles.label}>{mode === 'admin' ? 'Administrator Login' : 'User Login'}</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Username" 
                    value={username} 
                    onChangeText={setUsername} 
                    autoCapitalize="none"
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Password" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry 
                />
            </View>
        )}

        <TouchableOpacity disabled={busy} onPress={doLogin} style={[styles.btn, busy && { opacity: 0.7 }]}>
          {busy ? <ActivityIndicator color="#fff" /> : (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                  <Text style={styles.btnText}>
                      {mode === 'guest' ? 'Enter App' : 'Login'}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" color="#fff" size={20} style={{marginLeft: 8}}/>
              </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background },
  logo: { width: 120, height: 120, alignSelf: 'center', resizeMode: 'contain', marginBottom: theme.spacing.md },
  title: { fontSize: 22, color: theme.colors.primary, marginBottom: theme.spacing.lg, textAlign: 'center', fontFamily: 'Cairo-Bold' },
  subtitle: { fontFamily: 'Cairo-Regular', fontSize: 14, color: theme.colors.muted, marginBottom: theme.spacing.sm, textAlign: 'center' },
  block: { marginBottom: theme.spacing.lg },
  card: { backgroundColor: '#fff', padding: theme.spacing.md, borderRadius: theme.radius.lg, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 3 },
  label: { fontFamily: 'Cairo-Bold', color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.sm, fontSize: 16 },
  btn: { marginTop: theme.spacing.lg, backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.radius.md },
  btnText: { fontFamily: 'Cairo-Bold', color: '#fff', textAlign: 'center', fontSize: 16 },
  input: {
      backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, fontFamily: 'Cairo-Regular'
  },
  toggleContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#e0e0e0', borderRadius: 8, padding: 4 },
  toggleBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#fff', elevation: 1 },
  toggleText: { fontWeight: 'bold', color: '#666', textAlign: 'center', fontSize: 12 },
  toggleTextActive: { color: theme.colors.primary }
});
