import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;