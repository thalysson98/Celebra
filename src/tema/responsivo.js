// Hook que informa a largura atual da janela.
// useWindowDimensions atualiza sozinho ao redimensionar o navegador ou girar o celular.
import { useWindowDimensions } from 'react-native';

export function useResponsivo() {
  const { width } = useWindowDimensions();

  return {
    largura: width,
    isMobile: width < 768, // abaixo de 768px tratamos como celular
  };
}