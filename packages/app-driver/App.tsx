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
import { TripHistoryScreen } from './src/screens/TripHistoryScreen';
import { ReviewsAboutMeScreen } from './src/screens/ReviewsAboutMeScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { DriverEarningsScreen } from './src/screens/DriverEarningsScreen';
import { SavedRoutesScreen } from './src/screens/SavedRoutesScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { OrdersQueueScreen } from './src/screens/OrdersQueueScreen';
import { ActiveOrderScreen } from './src/screens/ActiveOrderScreen';

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
        name="DriverEarnings"
        component={DriverEarningsScreen}
        options={{ title: 'Дохід' }}
      />
      <ProfileStack.Screen
        name="SavedRoutes"
        component={SavedRoutesScreen}
        options={{ title: 'Збережені маршрути' }}
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
      <MainStack.Screen name="OrdersQueue" component={OrdersQueueScreen} />
      <MainStack.Screen name="ActiveOrder" component={ActiveOrderScreen} />
    </MainStack.Navigator>
  );
}

type ScreenProps = { navigation: unknown; route: unknown };

export default function App() {
  /** Google Fonts тягнуться з мережі; без CDN завантаження може «висіти» — тоді застрягав весь додаток. */
  const [fontsTimedOut, setFontsTimedOut] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFontsTimedOut(true), 5000);
    return () => clearTimeout(id);
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const fontsReady = fontsLoaded || fontError != null || fontsTimedOut;
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
        }
        /* Таймаут / немає мережі: не відкриваємо головний екран з невалідною сесією. */
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
                  title: 'Замовлення',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="format-list-bulleted" size={size + 2} color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Profile"
                options={{
                  title: 'Меню',
                  headerShown: false,
                  tabBarIcon: ({ color, size }) => (
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
    backgroundColor: '#FFFFFF',
  },
});
