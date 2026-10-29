import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TechnicianDashboardScreen from '../screens/technician/TechnicianDashboardScreen';
import TechnicianEventDetailsScreen from '../screens/technician/TechnicianEventDetailsScreen';
import { COLORS } from '../theme/colors';

const Stack = createStackNavigator();

export default function TechnicianNavigator({ user, onLogout }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bgHeaderDark },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="TechnicianDashboard" options={{ headerShown: false }}>
        {(props) => <TechnicianDashboardScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="TechnicianEventDetails"
        component={TechnicianEventDetailsScreen}
        options={{ title: 'Detalhes do Evento' }}
      />
    </Stack.Navigator>
  );
}
