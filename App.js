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

function demoEventDate(daysFromNow, hour) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const demoTechnicianAssignments = [
  {
    id: 'demo-accepted-1',
    eventTitle: 'Pedro & Albino',
    clientName: 'Pedro e Albino',
    eventDate: demoEventDate(5, 16),
    eventAddress: 'Sítio Romagna',
    eventTypeName: 'Casamento',
    professionalTypeName: 'Fotógrafo',
    roleName: 'Fotografia do casamento',
    status: 'accepted',
  },
  {
    id: 'demo-accepted-2',
    eventTitle: '15 anos da Luiza',
    clientName: 'Luiza Martins',
    eventDate: demoEventDate(6, 19),
    eventAddress: 'Villa Toscana',
    eventTypeName: 'Aniversário',
    professionalTypeName: 'Fotógrafo',
    roleName: 'Cobertura do evento',
    status: 'accepted',
  },
  {
    id: 'demo-accepted-3',
    eventTitle: 'Formatura Medicina',
    clientName: 'Turma de Medicina',
    eventDate: demoEventDate(7, 20),
    eventAddress: 'Espaço Aurora',
    eventTypeName: 'Formatura',
    professionalTypeName: 'Videomaker',
    roleName: 'Captação do evento',
    status: 'accepted',
  },
  {
    id: 'demo-pending-1',
    eventTitle: 'Ana & Pedro',
    clientName: 'Ana Costa & Pedro Almeida',
    eventDate: demoEventDate(3, 18),
    eventAddress: 'Jundiaí, SP · 2 locais',
    eventTypeName: 'Casamento',
    professionalTypeName: 'Videomaker',
    roleName: 'Filmagem da cerimônia',
    status: 'pending',
  },
  {
    id: 'demo-pending-2',
    eventTitle: '15 Anos da Mariana',
    clientName: 'Mariana Oliveira',
    eventDate: demoEventDate(8, 19),
    eventAddress: 'Campinas, SP',
    eventTypeName: 'Aniversário',
    professionalTypeName: 'Câmera',
    roleName: 'Captação do evento',
    status: 'pending',
  },
  {
    id: 'demo-pending-3',
    eventTitle: 'Casamento Vitória & Lucas',
    clientName: 'Vitória Almeida e Lucas Reis',
    eventDate: demoEventDate(10, 17),
    eventAddress: 'Espaço Jardim',
    eventTypeName: 'Casamento',
    professionalTypeName: 'Fotógrafo',
    roleName: 'Fotografia da cerimônia',
    status: 'pending',
  },
  {
    id: 'demo-pending-4',
    eventTitle: 'Ensaio da Família Souza',
    clientName: 'Família Souza',
    eventDate: demoEventDate(12, 9),
    eventAddress: 'Parque da Cidade',
    eventTypeName: 'Ensaio',
    professionalTypeName: 'Fotógrafo',
    roleName: 'Ensaio externo',
    status: 'pending',
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
