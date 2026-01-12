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
import PrayerTimesScreen from '../screens/PrayerTimesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontFamily: 'Cairo-Regular' },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="home" color={color} size={size} />) }} />
      <Tab.Screen name="MapTab" component={MapScreen} options={{ title: 'Map', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="map" color={color} size={size} />) }} />
      <Tab.Screen name="ListTab" component={ListScreen} options={{ title: 'List', tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="format-list-bulleted" color={color} size={size} />) }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTitleStyle: { fontFamily: 'Cairo-Bold' },
          headerBackTitleStyle: { fontFamily: 'Cairo-Regular' },
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
        <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} options={{ title: 'Prayer Times' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
