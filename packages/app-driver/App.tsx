import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// Workaround: forces PlatformConstants to initialize before TurboModules (fixes Bridgeless crash)
void Platform.OS;
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider as PaperProvider, MD3LightTheme, ActivityIndicator } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setOnUnauthorized } from './src/api/axios';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterDriverScreen } from './src/screens/RegisterDriverScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { OrdersQueueScreen } from './src/screens/OrdersQueueScreen';
import { ActiveOrderScreen } from './src/screens/ActiveOrderScreen';

const strumTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#ffd451',
    onPrimary: '#1a1a1a',
    background: '#f5f5f5',
    surface: '#ffffff',
    onSurface: '#1a1a1a',
    placeholder: '#888888',
  },
  roundness: 12,
};

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function OrderStack() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="OrdersQueue" component={OrdersQueueScreen} />
      <MainStack.Screen name="ActiveOrder" component={ActiveOrderScreen} />
    </MainStack.Navigator>
  );
}

type ScreenProps = { navigation: unknown; route: unknown };

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        await api.get('/auth/me');
        setIsAuthenticated(true);
      } catch {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleLogout);
    return () => setOnUnauthorized(null);
  }, [handleLogout]);

  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={strumTheme}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffd451" />
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={strumTheme}>
        <NavigationContainer>
          {isAuthenticated ? (
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ffd451',
                tabBarInactiveTintColor: '#888',
                tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e0e0e0' },
                tabBarLabelStyle: { fontSize: 12, fontFamily: 'Montserrat_500Medium' },
              }}
            >
              <Tab.Screen
                name="Order"
                component={OrderStack}
                options={{
                  title: 'Замовлення',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="clipboard-list-outline" size={size} color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Profile"
                options={{
                  title: 'Профіль',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="account" size={size} color={color} />
                  ),
                }}
              >
                {(props: ScreenProps) => (
                  <ProfileScreen
                    navigation={props.navigation as { navigate: (name: string) => void }}
                    onLogout={handleLogout}
                  />
                )}
              </Tab.Screen>
            </Tab.Navigator>
          ) : (
            <AuthStack.Navigator screenOptions={{ headerShown: false }}>
              <AuthStack.Screen name="Login">
                {(props: ScreenProps) => (
                  <LoginScreen navigation={props.navigation as { navigate: (name: string) => void }} onLoginSuccess={handleLoginSuccess} />
                )}
              </AuthStack.Screen>
              <AuthStack.Screen name="Register" component={RegisterDriverScreen} />
            </AuthStack.Navigator>
          )}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
