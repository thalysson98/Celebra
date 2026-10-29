import { StyleSheet, Platform } from 'react-native';
import { CORES, FONTES } from '../tema/cores';

export const CORES_AUTENTICACAO = {
  fundoEscuro: CORES.bgHeaderDark || '#102B46',
  backgroundDark: CORES.bgHeaderDark || '#102B46',
  cardBranco: '#FFFFFF',
  cardWhite: '#FFFFFF',
  textoEscuro: '#243947',
  textDark: '#243947',
  subtituloClaro: '#8FA8BE',
  subtitleLight: '#8FA8BE',
  fundoInput: '#F3F5F7',
  inputBackground: '#F3F5F7',
  bordaInput: '#E2E8EC',
  inputBorder: '#E2E8EC',
  placeholder: '#8A99A8',
  botaoDourado: CORES.buttonGold || '#F4BA42',
  buttonYellow: CORES.buttonGold || '#F4BA42',
  estrelaDourada: CORES.buttonGold || '#F4BA42',
  starGold: CORES.buttonGold || '#F4BA42',
};

export const AUTH_COLORS = CORES_AUTENTICACAO;

export const estilosAutenticacao = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CORES_AUTENTICACAO.backgroundDark,
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
    fontFamily: FONTES.heading,
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  brandStar: {
    color: CORES_AUTENTICACAO.starGold,
    fontSize: 24,
    marginLeft: 6,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontFamily: FONTES.body,
    fontSize: 14,
    color: CORES_AUTENTICACAO.subtitleLight,
    marginTop: 6,
    textAlign: 'center',
  },

  // Card principal
  card: {
    backgroundColor: CORES_AUTENTICACAO.cardWhite,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 26,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontFamily: FONTES.heading,
    fontSize: 22,
    fontWeight: '700',
    color: CORES_AUTENTICACAO.textDark,
    textAlign: 'center',
    marginBottom: 22,
  },

  // Inputs
  fieldGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONTES.body,
    fontSize: 13,
    fontWeight: '600',
    color: CORES_AUTENTICACAO.textDark,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES_AUTENTICACAO.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CORES_AUTENTICACAO.inputBorder,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTES.body,
    fontSize: 14,
    color: CORES_AUTENTICACAO.textDark,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 6,
  },

  // Linha de ações auxiliares (Lembrar senha / Esqueci a senha)
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: CORES_AUTENTICACAO.placeholder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: CORES_AUTENTICACAO.buttonYellow,
    borderColor: CORES_AUTENTICACAO.buttonYellow,
  },
  checkboxLabel: {
    fontFamily: FONTES.body,
    fontSize: 12,
    color: CORES_AUTENTICACAO.placeholder,
  },
  forgotPasswordText: {
    fontFamily: FONTES.body,
    fontSize: 12,
    color: CORES_AUTENTICACAO.placeholder,
  },

  // Botão Amarelo Principal ("Acessar minha conta", "Cadastrar")
  submitButton: {
    backgroundColor: CORES_AUTENTICACAO.buttonYellow,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    shadowColor: CORES_AUTENTICACAO.buttonYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontFamily: FONTES.body,
    fontSize: 15,
    fontWeight: '700',
    color: CORES_AUTENTICACAO.textDark,
  },

  // Rodapé do Card (Link de troca Login <-> Registro)
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: {
    fontFamily: FONTES.body,
    fontSize: 13,
    color: CORES_AUTENTICACAO.placeholder,
  },
  footerLink: {
    fontFamily: FONTES.body,
    fontSize: 13,
    fontWeight: '700',
    color: CORES_AUTENTICACAO.textDark,
    textDecorationLine: 'underline',
  },
});

export const styles = estilosAutenticacao;
