// src/navegacao/NavegadorOrganizador.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CORES, FONTES } from '../tema/cores';
import BarraInferior from '../componentes/BarraInferior';
import TelaInicioOrganizador from '../telas/organizador/TelaInicioOrganizador';
import TelaListaEventos from '../telas/organizador/TelaListaEventos';
import TelaAdministrandoOrganizador from '../telas/organizador/TelaAdministrandoOrganizador';
import TelaPerfilOrganizador from '../telas/organizador/TelaPerfilOrganizador';
import TelaCriarEvento from '../telas/organizador/TelaCriarEvento';
import TelaDetalheEvento from '../telas/organizador/TelaDetalheEvento';
import TelaEditarEmpresa from '../telas/organizador/TelaEditarEmpresa';
import TelaNotificacoes from '../telas/TelaNotificacoes';

const Aba = createBottomTabNavigator();
const Pilha = createStackNavigator();

const CONFIGURACAO_ABAS_ORGANIZADOR = {
  Inicio: { rotulo: 'Início', iconeAtivo: 'home', iconeInativo: 'home-outline' },
  Eventos: { rotulo: 'Eventos', iconeAtivo: 'calendar-month', iconeInativo: 'calendar-month-outline' },
  Administrando: { rotulo: 'Gestão', iconeAtivo: 'cog', iconeInativo: 'cog-outline' },
  Perfil: { rotulo: 'Perfil', icone: 'domain' },
};

function NavegadorEventos({ onLogout, usuario }) {
  return (
    <Pilha.Navigator screenOptions={{ headerStyle: { backgroundColor: CORES.bgHeaderDark }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontFamily: FONTES.heading, fontWeight: '700' } }}>
      <Pilha.Screen name="ListaEventos" options={{ headerShown: false }}>
        {(props) => <TelaListaEventos {...props} onLogout={onLogout} />}
      </Pilha.Screen>
      <Pilha.Screen name="CriarEvento" options={{ title: 'Adicionando evento' }}>
        {(props) => <TelaCriarEvento {...props} usuario={usuario} />}
      </Pilha.Screen>
      <Pilha.Screen name="DetalheEvento" options={{ title: 'Detalhes do evento', headerTitleStyle: { fontFamily: FONTES.body, fontSize: 20, fontWeight: '400' } }}>
        {(props) => <TelaDetalheEvento {...props} usuario={usuario} />}
      </Pilha.Screen>
    </Pilha.Navigator>
  );
}

function NavegadorPerfil({ onLogout, usuario, setCurrentUser }) {
  return (
    <Pilha.Navigator screenOptions={{ headerShown: false }}>
      <Pilha.Screen name="PerfilEmpresa">
        {(props) => <TelaPerfilOrganizador {...props} onLogout={onLogout} usuario={usuario} />}
      </Pilha.Screen>
      <Pilha.Screen name="EditarEmpresa">
        {(props) => <TelaEditarEmpresa {...props} usuario={usuario} setCurrentUser={setCurrentUser} />}
      </Pilha.Screen>
    </Pilha.Navigator>
  );
}

function AbasOrganizador({ onLogout, usuario, setCurrentUser }) {
  return (
    <Aba.Navigator
      initialRouteName="Inicio"
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BarraInferior
          abaAtiva={state.routes[state.index].key}
          abas={state.routes.map((route, index) => {
            const configuracao = CONFIGURACAO_ABAS_ORGANIZADOR[route.name];
            const selecionada = state.index === index;

            return {
              chave: route.key,
              rotulo: configuracao.rotulo,
              ComponenteIcone: MaterialCommunityIcons,
              icone: configuracao.icone,
              iconeAtivo: configuracao.iconeAtivo,
              iconeInativo: configuracao.iconeInativo,
              aoSelecionar: () => {
                const evento = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selecionada && !evento.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              },
              aoPressionarLongo: () => navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              }),
            };
          })}
        />
      )}
    >
      <Aba.Screen name="Inicio">
        {(props) => <TelaInicioOrganizador {...props} usuario={usuario} />}
      </Aba.Screen>
      <Aba.Screen name="Eventos">
        {() => <NavegadorEventos onLogout={onLogout} usuario={usuario} />}
      </Aba.Screen>
      <Aba.Screen name="Administrando">
        {(props) => <TelaAdministrandoOrganizador {...props} usuario={usuario} />}
      </Aba.Screen>
      <Aba.Screen name="Perfil">
        {() => <NavegadorPerfil onLogout={onLogout} usuario={usuario} setCurrentUser={setCurrentUser} />}
      </Aba.Screen>
    </Aba.Navigator>
  );
}

export default function NavegadorOrganizador({ onLogout, usuario, setCurrentUser }) {
  return (
    <Pilha.Navigator screenOptions={{ headerStyle: { backgroundColor: CORES.bgHeaderDark }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontFamily: FONTES.heading, fontWeight: '700' } }}>
      <Pilha.Screen name="AbasPrincipais" options={{ headerShown: false }}>
        {(props) => <AbasOrganizador {...props} onLogout={onLogout} usuario={usuario} setCurrentUser={setCurrentUser} />}
      </Pilha.Screen>
      <Pilha.Screen name="Notificacoes" component={TelaNotificacoes} options={{ headerShown: false }} />
    </Pilha.Navigator>
  );
}

export const OrganizerNavigator = NavegadorOrganizador;