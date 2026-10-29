import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TelaPainelTecnico from '../telas/tecnico/TelaPainelTecnico';
import TelaDetalhesEventoTecnico from '../telas/tecnico/TelaDetalhesEventoTecnico';
import { CORES } from '../tema/cores';

const Pilha = createStackNavigator();

export default function NavegadorTecnico({ user, onLogout }) {
  return (
    <Pilha.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: CORES.bgHeaderDark },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Pilha.Screen name="TechnicianDashboard" options={{ headerShown: false }}>
        {(props) => <TelaPainelTecnico {...props} user={user} onLogout={onLogout} />}
      </Pilha.Screen>
      <Pilha.Screen
        name="TechnicianEventDetails"
        component={TelaDetalhesEventoTecnico}
        options={{ headerShown: false }}
      />
    </Pilha.Navigator>
  );
}

export const TechnicianNavigator = NavegadorTecnico;
