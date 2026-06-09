import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Workaround: forces PlatformConstants to initialize before TurboModules (fixes Bridgeless crash)
void Platform.OS;
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { Provider as PaperProvider, MD3LightTheme, ActivityIndicator } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setOnUnauthorized } from './src/api/axios';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TripHistoryScreen } from './src/screens/TripHistoryScreen';
import { ReviewsAboutMeScreen } from './src/screens/ReviewsAboutMeScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { SavedPlacesScreen } from './src/screens/SavedPlacesScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { CreateOrderScreen } from './src/screens/CreateOrderScreen';
import { OrderTrackingScreen } from './src/screens/OrderTrackingScreen';

const strumTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FFDD2D',
    onPrimary: '#1a1a1a',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    onSurface: '#1a1a1a',
    placeholder: '#8E8E93',
  },
  roundness: 14,
};

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ProfileFlow({ onLogout }: { onLogout: () => void }) {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerTintColor: '#1a1a1a',
        headerTitleStyle: { fontFamily: 'Montserrat_600SemiBold' },
      }}
    >
      <ProfileStack.Screen name="ProfileMain" options={{ headerShown: false }}>
        {() => <ProfileScreen onLogout={onLogout} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen
        name="SavedPlaces"
        component={SavedPlacesScreen}
        options={{ title: 'Збережені адреси' }}
      />
      <ProfileStack.Screen
        name="TripHistory"
        component={TripHistoryScreen}
        options={{ title: 'Історія поїздок' }}
      />
      <ProfileStack.Screen
        name="ReviewsAboutMe"
        component={ReviewsAboutMeScreen}
        options={{ title: 'Відгуки про мене' }}
      />
      <ProfileStack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: 'Обране та блоки' }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Редагування профілю' }}
      />
    </ProfileStack.Navigator>
  );
}

function OrderStack() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="CreateOrder" component={CreateOrderScreen} />
      <MainStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </MainStack.Navigator>
  );
}

type ScreenProps = { navigation: unknown; route: unknown };

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const fontsReady = fontsLoaded || fontError != null;
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
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        } else {
          setIsAuthenticated(true);
        }
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

  if (!fontsReady || isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={strumTheme}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFDD2D" />
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
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#1a1a1a',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: {
                  backgroundColor: '#FFFFFF',
                  borderTopColor: '#E5E5EA',
                  height: 54,
                  paddingTop: 6,
                },
              }}
            >
              <Tab.Screen
                name="Order"
                component={OrderStack}
                options={{
                  title: 'Поїздка',
                  tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                    <MaterialCommunityIcons name="map-marker-radius" size={size + 2} color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Profile"
                options={{
                  title: 'Меню',
                  headerShown: false,
                  tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                    <MaterialCommunityIcons name="menu" size={size + 2} color={color} />
                  ),
                }}
              >
                {() => <ProfileFlow onLogout={handleLogout} />}
              </Tab.Screen>
            </Tab.Navigator>
          ) : (
            <AuthStack.Navigator screenOptions={{ headerShown: false }}>
              <AuthStack.Screen name="Login">
                {(props: ScreenProps) => (
                  <LoginScreen
                    navigation={props.navigation as { navigate: (name: string) => void }}
                    onLoginSuccess={handleLoginSuccess}
                  />
                )}
              </AuthStack.Screen>
              <AuthStack.Screen name="Register" component={RegisterScreen} />
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
    backgroundColor: '#FFFFFF',
  },
});
