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
    maxWidth: 360,
    alignSelf: 'center',
  },

  // Cabeçalho da marca ("Celebra ✦")
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  brandStar: {
    fontSize: 23,
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
    paddingTop: 24,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 23,
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
    height: 48,
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

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: -2,
    marginBottom: 16,
    paddingVertical: 2,
  },
  rememberCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#A8B5C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  rememberCheckboxChecked: {
    borderColor: AUTH_COLORS.buttonYellow,
    backgroundColor: AUTH_COLORS.buttonYellow,
  },
  rememberText: {
    color: AUTH_COLORS.textDark,
    fontSize: 12,
    fontWeight: '600',
  },

  // Link "Criar conta ->" centralizado abaixo do botão principal.
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 3,
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
