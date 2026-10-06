import { Platform, useWindowDimensions } from 'react-native';

// Largura a partir da qual a web usa layout de computador (menu lateral + área de trabalho).
// Abaixo disso, e sempre no app nativo, vale o layout de celular.
export const LARGURA_DESKTOP = 900;

// Largura máxima da área de conteúdo no desktop, pra formulários e listas não ficarem esticados.
export const LARGURA_MAX_CONTEUDO = 1120;

export function useLayoutDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= LARGURA_DESKTOP;
}
