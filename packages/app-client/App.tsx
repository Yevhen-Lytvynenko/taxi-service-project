import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// Workaround: forces PlatformConstants to initialize before TurboModules (fixes Bridgeless crash)
void Platform.OS;
import { Provider as PaperProvider, MD3LightTheme, ActivityIndicator } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setOnUnauthorized } from './src/api/axios';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CreateOrderScreen } from './src/screens/CreateOrderScreen';

const strumTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#ffd451',
    onPrimary: '#000000',
    background: '#f5f5f5',
    surface: '#ffffff',
    onSurface: '#1a1a1a',
    placeholder: '#888888',
  },
  roundness: 2,
};

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

type ScreenProps = { navigation: unknown; route: unknown };

export default function App() {
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

  if (isLoading) {
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
            <MainStack.Navigator screenOptions={{ headerShown: false }}>
              <MainStack.Screen name="CreateOrder">
                {(props: ScreenProps) => (
                  <CreateOrderScreen navigation={props.navigation as { navigate: (name: string) => void }} />
                )}
              </MainStack.Screen>
              <MainStack.Screen name="Profile">
                {(props: ScreenProps) => (
                  <ProfileScreen navigation={props.navigation as { navigate: (name: string) => void }} onLogout={handleLogout} />
                )}
              </MainStack.Screen>
            </MainStack.Navigator>
          ) : (
            <AuthStack.Navigator screenOptions={{ headerShown: false }}>
              <AuthStack.Screen name="Login">
                {(props: ScreenProps) => (
                  <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
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
    backgroundColor: '#f5f5f5',
  },
});
