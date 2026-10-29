import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AUTH_COLORS } from '../styles/authStyles';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createStackNavigator();

export default function AuthNavigator({ onLoginSuccess, onRegisterSuccess }) {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: AUTH_COLORS.backgroundDark || '#1e1e1e' },
      }}
    >
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => <RegisterScreen {...props} onRegisterSuccess={onRegisterSuccess} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
