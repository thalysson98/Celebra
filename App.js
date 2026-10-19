import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './src/config/firebaseConfig';
import { AUTH_COLORS } from './src/styles/authStyles';
import { logoutUser } from './src/services/authService';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EmptyScreen from './src/screens/EmptyScreen';

const Stack = createStackNavigator();

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Escuta automaticamente se o usuário logou ou deslogou no Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email,
        });
      } else {
        setCurrentUser(null);
      }
      setReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AUTH_COLORS.buttonYellow} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" backgroundColor={AUTH_COLORS.backgroundDark} />

        {currentUser ? (
          <EmptyScreen user={currentUser} onLogout={handleLogout} />
        ) : (
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: AUTH_COLORS.backgroundDark },
              }}
            >
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    onLoginSuccess={(user) => setCurrentUser(user)}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="Register">
                {(props) => (
                  <RegisterScreen
                    {...props}
                    onRegisterSuccess={(user) => setCurrentUser(user)}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: AUTH_COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});