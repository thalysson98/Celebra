// ============================================================================
// src/componentes/BarraInferiorTecnico.js
// Barra de navegação inferior fixa (Início, Eventos, Perfil) que aparece
// em todas as telas do fluxo do Técnico e funciona na Web e no Mobile.
// ============================================================================

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, CORES } from '../tema/cores';
import { estilosNavegacao, obterEstiloHotbar } from '../estilos/estilosNavegacao';

/**
 * Componente da Barra Inferior do Técnico.
 * @param {string} abaAtiva - Aba selecionada no momento ('home', 'events', 'profile' ou '').
 * @param {Function} aoSelecionarAba - Função chamada quando o usuário clica em uma aba.
 * @param {number} totalPendentes - Quantidade de eventos pendentes para exibir na bolinha (badge).
 */
export default function BarraInferiorTecnico({
  abaAtiva = '',
  aoSelecionarAba,
  totalPendentes = 0,
}) {
  const insets = useSafeAreaInsets();

  // Lista das 3 abas principais da barra inferior
  const abas = [
    { chave: 'home', rotulo: 'Início', icone: 'home' },
    { chave: 'events', rotulo: 'Eventos', icone: 'tag' },
    { chave: 'profile', rotulo: 'Perfil', icone: 'user' },
  ];

  return (
    <View style={obterEstiloHotbar(insets.bottom)}>
      {abas.map((aba) => {
        const selecionada = abaAtiva === aba.chave;

        return (
          <TouchableOpacity
            key={aba.chave}
            activeOpacity={0.8}
            onPress={() => {
              if (aoSelecionarAba) aoSelecionarAba(aba.chave);
            }}
          >
            <View style={estilosNavegacao.tabContainer}>
              {/* Pílula do ícone (destacada em amarelo quando ativa) */}
              <View
                style={
                  selecionada
                    ? estilosNavegacao.pilulaIconeAtivo
                    : estilosNavegacao.pilulaIconeInativo
                }
              >
                <Feather
                  name={aba.icone}
                  size={24}
                  color={selecionada ? CORES.textNavy : COLORS.textSubtle}
                />

                {/* Bolinha vermelha de eventos pendentes no botão Início */}
                {aba.chave === 'home' && totalPendentes > 0 && (
                  <View style={estilosNavegacao.badge}>
                    <Text style={estilosNavegacao.badgeText}>{totalPendentes}</Text>
                  </View>
                )}
              </View>

              {/* Nome da aba abaixo do ícone */}
              <Text
                style={[
                  estilosNavegacao.tabLabel,
                  { color: selecionada ? CORES.textNavy : COLORS.textSubtle },
                ]}
              >
                {aba.rotulo}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}