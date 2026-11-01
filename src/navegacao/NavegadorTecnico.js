// src/navegacao/NavegadorTecnico.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TelaPainelTecnico from '../telas/tecnico/TelaPainelTecnico';
import TelaDetalhesEventoTecnico from '../telas/tecnico/TelaDetalhesEventoTecnico';
import TelaNotificacoes from '../telas/TelaNotificacoes'; // Importação da tela de Notificações
import { CORES, FONTES } from '../tema/cores';

const Pilha = createStackNavigator();

export default function NavegadorTecnico({ user, onLogout }) {
  return (
    <Pilha.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: CORES.bgHeaderDark },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontFamily: FONTES.heading, fontWeight: '700' },
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

      {/* Rota de Notificações adicionada para o Técnico */}
      <Pilha.Screen
        name="Notificacoes"
        component={TelaNotificacoes}
        options={{ headerShown: false }}
      />
    </Pilha.Navigator>
  );
}

export const TechnicianNavigator = NavegadorTecnico;