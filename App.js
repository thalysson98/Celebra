import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './src/config/firebaseConfig';
import { COLORS } from './src/theme/colors';
import { logoutUser } from './src/services/authService';
import { getUserProfile } from './src/services/userService';
import RootNavigator from './src/navigation/RootNavigator';

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.buttonGold,
    background: COLORS.sheetBg,
    surface: COLORS.cardWhite,
  },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authRevision = 0;

    // Escuta a sessão ativa do usuário no Firebase
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
            name: authUser.displayName || authUser.email?.split('@')[0] || 'Organizador',
            role: 'organizer',
            profileStatus: 'ready',
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

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.buttonGold} />
      </View>
    );
  }

  const isTechnician = currentUser?.role === 'technician';

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <SafeAreaView
          style={[styles.safeArea, isTechnician && styles.technicianSafeArea]}
          edges={isTechnician ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
        >
          <StatusBar style="light" backgroundColor={COLORS.bgHeaderDark} />

          <NavigationContainer>
            <RootNavigator
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              onLogout={handleLogout}
            />
          </NavigationContainer>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgHeaderDark,
  },
  technicianSafeArea: {
    backgroundColor: '#F8FAFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bgHeaderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
