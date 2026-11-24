// ============================================================================
// src/estilos/estilosDetalhesEventoTecnico.js
// Folha de estilos da tela de Detalhes do Evento e Resposta de Convocação
// do Técnico, com suporte a rolagem Web e modais de feedback.
// ============================================================================

import { Platform, StyleSheet } from 'react-native';
import { CORES, FONTES } from '../tema/cores';

export const estilosDetalhesEventoTecnico = StyleSheet.create({
  // Container raiz da tela (trava em 100vh na Web para habilitar rolagem interna)
  screen: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#F3F5F8',
    ...(Platform.OS === 'web'
      ? { height: '100vh', maxHeight: '100vh', overflow: 'hidden' }
      : {}),
  },

  // Cabeçalho superior escuro com botão voltar e botão de notificações
  header: { flexShrink: 0, backgroundColor: '#102B46', paddingHorizontal: 20, paddingTop: 45, paddingBottom: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerTitle: { color: CORES.textWhite, fontFamily: FONTES.bold, fontSize: 22 },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Área de rolagem principal do conteúdo do evento
  body: {
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Subtítulo informativo sobre o status da convocação
  subtitleText: { color: '#334155', fontFamily: FONTES.body, fontSize: 14, marginBottom: 15 },
  boldText: { fontFamily: FONTES.bold },

  // Card principal de resumo do evento (tipo, título, função, data, horário e convidados)
  mainEventCard: { padding: 0, marginBottom: 20 },
  mainEventCardContent: { padding: 20 },
  tipoBadgeDetalhe: { fontFamily: FONTES.bold, fontSize: 13, fontWeight: '700', color: '#2F80A8', marginBottom: 4 },
  tituloEventoDetalhe: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 24, marginBottom: 4 },
  funcaoDetalhe: { fontFamily: FONTES.semibold, color: '#64748B', fontSize: 14, marginBottom: 16 },

  // Quadro interno de informações rápidas (Data, Horário e Quantidade de Convidados)
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowWithBottomMargin: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoRowWithTopMargin: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EAF3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontFamily: FONTES.body,
    color: CORES.textMuted,
    fontSize: 12,
  },
  infoValue: {
    fontFamily: FONTES.bold,
    color: CORES.textNavy,
    fontSize: 15,
  },

  // Títulos de seção e cartões genéricos
  sectionTitle: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 18, marginBottom: 12, marginTop: 8 },
  card: {
    backgroundColor: CORES.cardWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    elevation: 0,
    marginBottom: 16,
  },

  // Estilos de informações de local
  placeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  placeType: { fontFamily: FONTES.bold, color: CORES.textMuted, fontSize: 16 },
  placeName: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 18, marginTop: 4 },
  placeAddress: { fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginTop: 14 },
  placeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4ECF2',
  },
  placeTime: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 16 },

  noteText: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, lineHeight: 20 },

  // Lista de integrantes confirmados na equipe do evento
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CORES.cardDivider,
  },
  personRowSelf: {
    backgroundColor: '#F0F7FF',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  personIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: CORES.sheetBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personIconSelf: { backgroundColor: '#DBEAFE' },
  personInfo: { flex: 1 },
  personName: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15, fontWeight: '700' },
  personMeta: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, marginTop: 2 },

  // Cartão destacado de Notas da Produção
  productionNotesCard: {
    backgroundColor: '#102B46',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#244C70',
    elevation: 2,
    marginBottom: 16,
  },
  productionNotesContent: { padding: 18 },
  productionNotesHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productionNotesIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F80A8',
  },
  productionNotesHeadingText: { flex: 1 },
  productionNotesTitle: { fontFamily: FONTES.bold, color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  productionNotesSubtitle: { fontFamily: FONTES.body, color: '#C5D2DF', fontSize: 12, marginTop: 3 },
  productionNotesDivider: {
    height: 3,
    width: 46,
    borderRadius: 2,
    backgroundColor: CORES.buttonGold,
    marginTop: 16,
    marginBottom: 14,
  },
  productionNotesText: { fontFamily: FONTES.semibold, color: '#FFFFFF', fontSize: 14, lineHeight: 22 },

  sectionHint: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, marginBottom: 12 },

  // Barra inferior em fluxo flex para responder convocação pendente sem sobrepor o conteúdo
  bottomActionArea: {
    flexShrink: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  respondingLoader: { marginBottom: 20 },
  btnAccept: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnAcceptText: { fontFamily: FONTES.bold, fontSize: 15, color: '#FFF' },
  btnReject: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnRejectText: { fontFamily: FONTES.bold, fontSize: 15, color: '#EF4444' },
  disclaimer: { fontFamily: FONTES.body, fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16 },

  // Container centralizado de carregamento inicial
  center: { flex: 1, backgroundColor: '#F3F5F8', alignItems: 'center', justifyContent: 'center', padding: 24 },

  // Modais padronizados de feedback (Sucesso e Erro)
  feedbackModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackModalCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  feedbackSuccessIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedbackErrorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedbackModalTitle: {
    fontFamily: FONTES.bold,
    fontSize: 18,
    color: CORES.textNavy,
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackModalDescription: {
    fontFamily: FONTES.body,
    fontSize: 14,
    color: CORES.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  feedbackModalButton: {
    width: '100%',
    borderRadius: 10,
  },
});

export default estilosDetalhesEventoTecnico;
