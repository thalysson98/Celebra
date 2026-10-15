import { Platform } from 'react-native';

export const COLORS = {
  // Fundo Superior & Header (Dark Blue / Deep Navy do Figma)
  bgHeaderDark: '#07182C',
  bgDark: '#07182C',
  headerSubtitle: '#7E9BB8',

  // Fundo Principal do Conteúdo (Curved Sheet Icy Blue do Figma)
  sheetBg: '#EAF3F7',
  sheetBgSubtle: '#F0F6FA',

  // Cards & Contêineres do Figma
  cardLightBlue: '#DDF0F8',
  cardLightBlueBorder: '#CDE5F2',
  cardWhite: '#FFFFFF',
  cardSubBox: '#F0F7FB',
  cardDivider: '#E4ECF2',

  // Cores de Ação do Figma (Gold / Yellow & Navy)
  buttonGold: '#F4BA42',
  buttonGoldHover: '#E8AE36',
  buttonGoldShadow: 'rgba(244, 186, 66, 0.35)',
  tabActiveGold: '#FCE082',

  buttonNavy: '#07182C',
  buttonNavyText: '#FFFFFF',

  // Tipografia do Figma
  textNavy: '#0A192F',
  textNavyDark: '#061325',
  textMuted: '#627D98',
  textSubtle: '#8EA3B7',
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
  statusConfirmed: '#10B981',
  statusConfirmedBg: '#E6F8F0',
};

export const FONTS = {
  heading: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia, serif',
    default: 'serif',
  }),
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'sans-serif',
  }),
};
