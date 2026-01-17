import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

export default function TasbihScreen({ navigation }) {
  const [count, setCount] = useState(0);

  const increment = () => {
      setCount(c => c + 1);
      try { Vibration.vibrate(50); } catch(e){}
  };
  
  const reset = () => {
      setCount(0);
      try { Vibration.vibrate(200); } catch(e){}
  };

  return (
      <SafeAreaView style={styles.container}>
          <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                  <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Digital Tasbih</Text>
              <TouchableOpacity onPress={reset}>
                  <MaterialCommunityIcons name="refresh" size={28} color="#fff" />
              </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
               <TouchableOpacity style={styles.counterBtn} onPress={increment} activeOpacity={0.7}>
                   <View style={styles.ring} />
                   <Text style={styles.countText}>{count}</Text>
                   <MaterialCommunityIcons name="hand-pointing-up" size={40} color="rgba(255,255,255,0.5)" style={{marginTop: 20}} />
                   <Text style={styles.tapText}>Tap</Text>
               </TouchableOpacity>
          </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#2c3e50' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff', fontFamily: 'Cairo-Bold' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    counterBtn: { 
        width: 280, height: 280, borderRadius: 140, 
        backgroundColor: theme.colors.primary, 
        justifyContent: 'center', alignItems: 'center',
        elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {height: 5}
    },
    ring: {
        position: 'absolute', width: 300, height: 300, borderRadius: 150, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)'
    },
    countText: { fontSize: 80, color: '#fff', fontWeight: 'bold' },
    tapText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 2 }
});
