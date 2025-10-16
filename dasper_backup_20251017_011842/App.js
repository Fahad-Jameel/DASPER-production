import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { LogBox, View, Text } from 'react-native';

// Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Screens
import SplashScreenComponent from './src/screens/SplashScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';

// Services
import AuthService from './src/services/AuthService';

// Config
import { initializeBackendUrl } from './config/env';

// Themes
import { lightTheme, darkTheme } from './src/theme/theme';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: componentWillReceiveProps',
  'Warning: componentWillMount',
  'Animated: `useNativeDriver`',
  'Remote debugger is in a background tab',
  'expo-notifications: Android Push notifications',
  'Seems like you are using a Babel plugin',
  '🚨 React Native\'s New Architecture is always enabled in Expo Go',
  'Setting a timer for a long period of time'
]);

const Stack = createStackNavigator();

// Inner App Component that can use AuthContext
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    console.log('🧭 AppNavigator: Authentication state changed:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user
    });
  }, [isAuthenticated, isLoading, user]);

  const theme = isDarkTheme ? darkTheme : lightTheme;

  return (
    <NavigationContainer theme={theme}>
      <StatusBar 
        style={isDarkTheme ? "light" : "dark"} 
        backgroundColor={theme.colors.primary}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen 
            name="Main" 
            component={MainNavigator}
            options={{ gestureEnabled: false }}
          />
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ gestureEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    loadApp();
  }, []);

  const loadApp = async () => {
    try {
      // Initialize backend URL
      await initializeBackendUrl();
      
      // Simulate splash screen for better UX
      setTimeout(() => {
        setShowSplash(false);
        setIsLoading(false);
        SplashScreen.hideAsync();
      }, 3000);

    } catch (error) {
      console.error('App loading error:', error);
      setIsLoading(false);
      SplashScreen.hideAsync();
    }
  };

  if (isLoading || showSplash) {
    return <SplashScreenComponent />;
  }

  const theme = isDarkTheme ? darkTheme : lightTheme;

  return (
    <ThemeProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}