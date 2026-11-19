// ============================================================================
// src/estilos/estilosExemploCartoes.js
// Folha de estilos da tela de exemplo de cartões responsivos do técnico
// (exibição em 1 coluna no celular e 2 colunas na Web).
// ============================================================================

import { StyleSheet } from 'react-native';

export const estilosExemploCartoes = StyleSheet.create({
  // Container principal do ScrollView com espaçamento interno padrão
  container: {
    padding: 16,
  },

  // Grade responsiva que organiza os cartões lado a lado com quebra de linha
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Em telas móveis (celular), cada cartão ocupa 100% da largura (1 coluna)
  itemColunaMobile: {
    width: '100%',
  },

  // Em telas maiores (Web/tablet), cada cartão ocupa 48% da largura (2 colunas)
  itemColunaWeb: {
    width: '48%',
  },
});

export default estilosExemploCartoes;
