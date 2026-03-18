// packages/app-client/types.d.ts

declare module '@react-navigation/native' {
  export const NavigationContainer: any;
  export const useNavigation: any;
  export const DefaultTheme: any;
  export const DarkTheme: any;
}

declare module '@react-navigation/native-stack' {
  export const createNativeStackNavigator: any;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: any;
  export default AsyncStorage;
}