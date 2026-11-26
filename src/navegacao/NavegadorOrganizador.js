// src/navegacao/NavegadorOrganizador.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
import {
  assinarMonitoramentoRecusasOrganizador,
  assinarNotificacoesUsuario,
  inicializarNotificacoesDispositivo,
  processarBannersNotificacoesUsuario,
} from '../servicos/servicoNotificacoes';

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

function AbasOrganizador({ onLogout, usuario, setCurrentUser, totalNaoLidas = 0 }) {
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
        {(props) => <TelaInicioOrganizador {...props} usuario={usuario} totalNaoLidas={totalNaoLidas} />}
      </Aba.Screen>
      <Aba.Screen name="Eventos">
        {() => <NavegadorEventos onLogout={onLogout} usuario={usuario} />}
      </Aba.Screen>
      <Aba.Screen name="Administrando">
        {(props) => <TelaAdministrandoOrganizador {...props} usuario={usuario} totalNaoLidas={totalNaoLidas} />}
      </Aba.Screen>
      <Aba.Screen name="Perfil">
        {() => <NavegadorPerfil onLogout={onLogout} usuario={usuario} setCurrentUser={setCurrentUser} />}
      </Aba.Screen>
    </Aba.Navigator>
  );
}

export default function NavegadorOrganizador({ onLogout, usuario, setCurrentUser }) {
  const [notificacoesSistema, setNotificacoesSistema] = useState([]);
  const notificacoesAnterioresRef = useRef(null);
  const idUsuario = usuario?.uid;
  const idEmpresa = usuario?.idEmpresa || usuario?.companyId;

  const totalNaoLidas = useMemo(
    () => notificacoesSistema.filter((item) => !item.lida).length,
    [notificacoesSistema]
  );

  // Inicializa canal e permissões de notificações do dispositivo do organizador
  useEffect(() => {
    if (idUsuario) {
      inicializarNotificacoesDispositivo(idUsuario);
    }
  }, [idUsuario]);

  // Monitora em tempo real os convites da empresa para garantir que qualquer recusa de técnico
  // gere imediatamente a notificação para o organizador (no app e na barra do celular)
  useEffect(() => {
    if (!idUsuario || !idEmpresa) return undefined;

    const cancelarMonitoramento = assinarMonitoramentoRecusasOrganizador({
      idEmpresa,
      idUsuarioOrganizador: idUsuario,
    });

    return () => {
      if (typeof cancelarMonitoramento === 'function') cancelarMonitoramento();
    };
  }, [idUsuario, idEmpresa]);

  // Escuta em tempo real a coleção 'notificacoes' do organizador e dispara banner na barra do celular
  useEffect(() => {
    if (!idUsuario) return undefined;

    const cancelarAssinatura = assinarNotificacoesUsuario(
      idUsuario,
      (lista) => {
        setNotificacoesSistema(lista);
        processarBannersNotificacoesUsuario(
          idUsuario,
          lista,
          notificacoesAnterioresRef,
          usuario?.notificacoesEventos !== false
        );
      },
      (erro) => console.log('Erro ao carregar notificações do organizador:', erro)
    );

    return () => {
      if (typeof cancelarAssinatura === 'function') cancelarAssinatura();
    };
  }, [idUsuario, usuario?.notificacoesEventos]);

  return (
    <Pilha.Navigator screenOptions={{ headerStyle: { backgroundColor: CORES.bgHeaderDark }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontFamily: FONTES.heading, fontWeight: '700' } }}>
      <Pilha.Screen name="AbasPrincipais" options={{ headerShown: false }}>
        {(props) => (
          <AbasOrganizador
            {...props}
            onLogout={onLogout}
            usuario={usuario}
            setCurrentUser={setCurrentUser}
            totalNaoLidas={totalNaoLidas}
          />
        )}
      </Pilha.Screen>
      <Pilha.Screen name="Notificacoes" component={TelaNotificacoes} options={{ headerShown: false }} />
    </Pilha.Navigator>
  );
}

export const OrganizerNavigator = NavegadorOrganizador;