import { StyleSheet, Platform } from 'react-native';

export const AUTH_COLORS = {
  backgroundDark: '#102B46',   // Azul marinho do fundo das telas no Figma
  cardWhite: '#FFFFFF',        // Fundo branco do card
  textDark: '#243947',         // Azul escuro dos títulos, labels e texto do botão
  subtitleLight: '#8FA8BE',    // Azul claro do subtítulo "Planeje seu evento..."
  inputBackground: '#F3F5F7',  // Cinza-azulado claro do fundo dos inputs
  inputBorder: '#E2E8EC',      // Borda sutil dos inputs
  placeholder: '#8A99A8',      // Cor dos ícones e placeholders dos inputs
  buttonYellow: '#FFD45B',     // Amarelo/dourado dos botões "Acessar minha conta" e "Cadastrar"
  starGold: '#F4BA42',         // Estrela dourada da logo Celebra
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.backgroundDark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },

  // Cabeçalho da marca ("Celebra ✦")
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  brandStar: {
    fontSize: 28,
    color: AUTH_COLORS.starGold,
    marginLeft: 6,
  },
  brandSubtitle: {
    fontSize: 13,
    color: AUTH_COLORS.subtitleLight,
    marginTop: 6,
    textAlign: 'center',
  },

  // Card Branco Principal
  card: {
    width: '100%',
    backgroundColor: AUTH_COLORS.cardWhite,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 25,
    fontWeight: '400',
    color: AUTH_COLORS.textDark,
    marginBottom: 22,
  },

  // Campos de Formulário (Labels e Inputs)
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTH_COLORS.textDark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.inputBackground,
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: AUTH_COLORS.textDark,
    height: '100%',
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },

  // Link "Criar conta ->" alinhado à esquerda (Tela de Login)
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 20,
    paddingVertical: 4,
  },
  createAccountText: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTH_COLORS.textDark,
    marginRight: 8,
  },

  // Botão Principal Amarelo ("Acessar minha conta" e "Cadastrar")
  primaryButton: {
    backgroundColor: AUTH_COLORS.buttonYellow,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: AUTH_COLORS.textDark,
  },

  // Link discreto para voltar ao Login na tela de Criar Conta
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  backToLoginText: {
    fontSize: 13,
    color: AUTH_COLORS.subtitleLight,
    marginLeft: 6,
  },
});