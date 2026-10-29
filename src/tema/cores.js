import { Platform } from 'react-native';

export const CORES = {
  // Fundo Superior & Header (Dark Blue / Deep Navy do Figma)
  fundoCabecalhoEscuro: '#07182C',
  bgHeaderDark: '#07182C',
  bgDark: '#07182C',
  subtituloCabecalho: '#7E9BB8',
  headerSubtitle: '#7E9BB8',

  // Fundo Principal do Conteúdo (Curved Sheet Icy Blue do Figma)
  fundoFolha: '#EAF3F7',
  sheetBg: '#EAF3F7',
  sheetBgSubtle: '#F0F6FA',

  // Cards & Contêineres do Figma
  cardAzulClaro: '#DDF0F8',
  cardLightBlue: '#DDF0F8',
  cardLightBlueBorder: '#CDE5F2',
  cardBranco: '#FFFFFF',
  cardWhite: '#FFFFFF',
  cardSubBox: '#F0F7FB',
  divisorCard: '#E4ECF2',
  cardDivider: '#E4ECF2',

  // Cores de Ação do Figma (Gold / Dourado & Navy)
  botaoDourado: '#F4BA42',
  buttonGold: '#F4BA42',
  buttonGoldHover: '#E8AE36',
  buttonGoldShadow: 'rgba(244, 186, 66, 0.35)',
  abaAtivaDourada: '#FCE082',
  tabActiveGold: '#FCE082',

  botaoMarinho: '#07182C',
  buttonNavy: '#07182C',
  textoBotaoMarinho: '#FFFFFF',
  buttonNavyText: '#FFFFFF',

  // Tipografia do Figma
  textoMarinho: '#0A192F',
  textNavy: '#0A192F',
  textNavyDark: '#061325',
  textoSuave: '#627D98',
  textMuted: '#627D98',
  textSubtle: '#8EA3B7',
  textoBranco: '#FFFFFF',
  textWhite: '#FFFFFF',

  // Inputs da tela de Login (Figma)
  inputLightBlue: '#E5F2F8',
  inputPlaceholder: '#78909C',

  // Avatares Pastel do Figma
  avatarBlue: '#A0D2EB',
  avatarGold: '#FCE184',
  avatarPurple: '#D0BFE8',
  avatarDark: '#07182C',

  // Status & Badges
  statusConfirmado: '#10B981',
  statusConfirmed: '#10B981',
  statusConfirmedBg: '#E6F8F0',
};

export const COLORS = CORES;

const FONTE_PADRAO = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'sans-serif',
});

// Compatibilidade com estilos existentes, todos usando a mesma família sans-serif.
export const FONTES = {
  titulo: FONTE_PADRAO,
  corpo: FONTE_PADRAO,
  heading: FONTE_PADRAO,
  body: FONTE_PADRAO,
};

export const FONTS = FONTES;
