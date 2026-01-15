import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from '../screens/MapScreen';
import MosqueDetailScreen from '../screens/MosqueDetailScreen';
import ListScreen from '../screens/ListScreen';
import LoginScreen from '../screens/LoginScreen';
import { View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import AddMosqueScreen from '../screens/AddMosqueScreen';
import EditMosqueScreen from '../screens/EditMosqueScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import ReviewScreen from '../screens/ReviewScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontFamily: 'Cairo-Regular', fontSize: 12 },
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="home-outline" color={color} size={28} />) }} />
      <Tab.Screen name="MapTab" component={MapScreen} options={{ title: 'Map', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="map-outline" color={color} size={28} />) }} />
      <Tab.Screen name="ListTab" component={ListScreen} options={{ title: 'List', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="format-list-bulleted" color={color} size={28} />) }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading, jwt } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {jwt ? (
        <Stack.Navigator
          screenOptions={{
            headerTitleStyle: { fontFamily: 'Cairo-Bold', fontSize: 18 },
            headerBackTitleStyle: { fontFamily: 'Cairo-Regular' },
            headerTintColor: theme.colors.primary,
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: theme.colors.background },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="MosqueDetail" component={MosqueDetailScreen} options={({ navigation }) => ({ 
            title: 'Mosque',
            headerRight: () => (
              <MaterialCommunityIcons name="home" size={22} style={{ marginRight: 12 }} onPress={() => navigation.navigate('HomeTab')} />
            )
          })} />
          <Stack.Screen name="AddMosque" component={AddMosqueScreen} options={({ navigation }) => ({ 
            title: 'Add Mosque',
            headerRight: () => (
              <MaterialCommunityIcons name="home" size={22} style={{ marginRight: 12 }} onPress={() => navigation.navigate('HomeTab')} />
            )
          })} />
          <Stack.Screen name="EditMosque" component={EditMosqueScreen} options={({ navigation }) => ({ 
            title: 'Suggest Edit',
            headerRight: () => (
              <MaterialCommunityIcons name="home" size={22} style={{ marginRight: 12 }} onPress={() => navigation.navigate('HomeTab')} />
            )
          })} />
          <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} options={{ title: 'Prayer Times' }} />
          <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Add Review' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
