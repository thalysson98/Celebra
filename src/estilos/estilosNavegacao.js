// src/estilos/estilosNavegacao.js
import { Platform, StyleSheet } from 'react-native';
import { CORES, FONTES } from '../tema/cores';

// Função universal para garantir o mesmo tamanho e espaçamento na Hotbar de todos os perfis
export const obterEstiloHotbar = (insetsBottom) => {
  // Garante um espaço mínimo de 16px, somado à área ocupada pelos botões do Android/iOS
  const espacoInferior = Math.max(insetsBottom, Platform.OS === 'ios' ? 24 : 16);
  
  return {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopColor: CORES.cardDivider,
    borderTopWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: espacoInferior,
    height: 60 + espacoInferior, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  };
};

export const estilosNavegacao = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 55
  },
  pilulaIconeAtivo: {
    backgroundColor: '#FCE082', // Dourado
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  pilulaIconeInativo: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  tabLabel: {
    fontFamily: FONTES.semibold,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center'
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold'
  }
});