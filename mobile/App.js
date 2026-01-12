import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from './src/theme';
import { ThemedView } from './src/components/ThemedView';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { MosquesProvider } from './src/context/MosquesContext';
import { useFonts } from 'expo-font';
import FullScreenLoader from './src/components/FullScreenLoader';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function RootNavigator() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="dark" />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Cairo-Regular': require('./assets/fonts/Cairo-Regular.ttf'),
    'Cairo-Bold': require('./assets/fonts/Cairo-Bold.ttf'),
    'Cairo-Medium': require('./assets/fonts/Cairo-Medium.ttf'),
    'Amiri-Regular': require('./assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold': require('./assets/fonts/Amiri-Bold.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1 }}>
        <FullScreenLoader message="جاري تحميل الواجهات…" />
      </View>
    );
  }

  // Set a global default font for Text
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = [Text.defaultProps.style, { fontFamily: 'Cairo-Regular' }];
  // And for TextInput
  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.style = [TextInput.defaultProps.style, { fontFamily: 'Cairo-Regular' }];

  return (
    <AuthProvider>
      <MosquesProvider>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1 }} edges={['top','bottom']}>
            <ThemedView style={{ flex: 1 }}>
              <RootNavigator />
            </ThemedView>
          </SafeAreaView>
        </SafeAreaProvider>
      </MosquesProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  signout: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  signoutText: {
    color: '#fff',
    fontSize: theme.typography.body,
  }
});
