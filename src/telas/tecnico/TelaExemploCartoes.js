// ============================================================================
// src/telas/tecnico/TelaExemploCartoes.js
// Tela de demonstração e teste de layout responsivo com CartaoPadrao:
// exibe os cartões de eventos em uma única coluna no celular e em duas
// colunas lado a lado na visualização Web/Desktop.
// ============================================================================

import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import CartaoPadrao from '../../componentes/CartaoPadrao';
import { useResponsivo } from '../../tema/responsivo';
import { estilosExemploCartoes as styles } from '../../estilos/estilosExemploCartoes';

// ============================================================================
// DADOS DE EXEMPLO PARA DEMONSTRAÇÃO DE LAYOUT
// ============================================================================

/**
 * Lista estática de eventos simulados para testar o componente CartaoPadrao
 * com e sem botão de ação. No fluxo principal do aplicativo, os eventos
 * reais são carregados dinamicamente do Firestore.
 */
const eventos = [
  { id: '1', titulo: 'Casamento Ana', descricao: 'Sábado, 14h', botao: 'Ver detalhes' },
  { id: '2', titulo: 'Formatura Lucas', descricao: 'Domingo, 19h', botao: 'Ver detalhes' },
  { id: '3', titulo: 'Aniversário 15 anos', descricao: 'Sexta, 21h', botao: 'Ver detalhes' },
  { id: '4', titulo: 'Evento corporativo', descricao: 'Segunda, 9h', botao: null }, // Exemplo de cartão sem botão de ação
];

// ============================================================================
// COMPONENTE PRINCIPAL DA TELA DE EXEMPLO DE CARTÕES
// ============================================================================

export default function TelaExemploCartoes() {
  // Hook que detecta o tamanho da tela para alternar entre layout Mobile (1 coluna) e Web (2 colunas)
  const { isMobile } = useResponsivo();

  // --------------------------------------------------------------------------
  // RENDERIZAÇÃO DA INTERFACE (JSX)
  // --------------------------------------------------------------------------
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* GRADE RESPONSIVA DE CARTÕES */}
      <View style={styles.grade}>
        {eventos.map((evento) => (
          /* Container de cada item: 100% de largura no celular, 48% na Web */
          <View
            key={evento.id}
            style={isMobile ? styles.itemColunaMobile : styles.itemColunaWeb}
          >
            <CartaoPadrao
              title={evento.titulo}
              buttonLabel={evento.botao}
              onPress={() => console.log('Clicou em', evento.titulo)}
            >
              <Text>{evento.descricao}</Text>
            </CartaoPadrao>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
