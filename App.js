import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './src/config/firebaseConfig';
import { AUTH_COLORS } from './src/styles/authStyles';
import { logoutUser } from './src/services/authService';
import { getUserProfile } from './src/services/userService';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EmptyScreen from './src/screens/EmptyScreen';
import PendingAccessScreen from './src/screens/PendingAccessScreen';
import TechnicianDashboardScreen from './src/screens/TechnicianDashboardScreen';

const Stack = createStackNavigator();

const demoTechnicianAssignments = [
  {
    id: 'demo-pending-1',
    eventTitle: 'Ana & Pedro',
    clientName: 'Ana Costa & Pedro Almeida',
    eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    eventAddress: 'Jundiaí, SP · 2 locais',
    professionalTypeName: 'Videomaker',
    roleName: 'Filmagem da cerimônia',
    status: 'pending',
  },
  {
    id: 'demo-pending-2',
    eventTitle: '15 Anos da Mariana',
    clientName: 'Mariana Oliveira',
    eventDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    eventAddress: 'Campinas, SP',
    professionalTypeName: 'Câmera',
    roleName: 'Captação do evento',
    status: 'pending',
  },
  {
    id: 'demo-accepted-1',
    eventTitle: 'Ensaio de Família',
    clientName: 'Família Souza',
    eventDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    eventAddress: 'Jundiaí, SP',
    professionalTypeName: 'Fotógrafo',
    roleName: 'Ensaio externo',
    status: 'accepted',
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);
  const isTechnicianPreview = __DEV__
    && Platform.OS === 'web'
    && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'technician';
  const isTechnicianArea = isTechnicianPreview || currentUser?.role === 'technician';

  useEffect(() => {
    let mounted = true;
    let authRevision = 0;

    // Escuta a sessão e carrega o perfil/papel persistido no Firestore.
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      const revision = ++authRevision;
      if (!authUser) {
        if (mounted) {
          setCurrentUser(null);
          setReady(true);
        }
        return;
      }

      try {
        const profile = await getUserProfile(authUser);
        if (mounted && revision === authRevision) setCurrentUser(profile);
      } catch (error) {
        if (mounted && revision === authRevision) {
          setCurrentUser({
            uid: authUser.uid,
            email: authUser.email,
            name: authUser.displayName || authUser.email,
            role: 'pending',
            companyId: null,
            active: false,
            profileStatus: 'error',
          });
        }
      } finally {
        if (mounted && revision === authRevision) setReady(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  if (!ready && !isTechnicianPreview) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AUTH_COLORS.buttonYellow} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.safeArea, isTechnicianArea && styles.technicianSafeArea]}
        edges={isTechnicianArea ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" backgroundColor={AUTH_COLORS.backgroundDark} />

        {isTechnicianPreview ? (
          <TechnicianDashboardScreen
            user={{ uid: 'local-preview-technician', name: 'Marina Costa' }}
            previewAssignments={demoTechnicianAssignments}
            onLogout={() => {}}
          />
        ) : currentUser ? (
          currentUser.active === false || !['organizer', 'technician'].includes(currentUser.role) ? (
            <PendingAccessScreen user={currentUser} onLogout={handleLogout} />
          ) : currentUser.role === 'technician' ? (
            <TechnicianDashboardScreen user={currentUser} onLogout={handleLogout} />
          ) : (
            <EmptyScreen user={currentUser} onLogout={handleLogout} />
          )
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
  technicianSafeArea: {
    backgroundColor: '#F8FAFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: AUTH_COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
