// src/estilos/estilosDetalhesEventoTecnico.js
import { StyleSheet } from 'react-native';
import { CORES, FONTES } from '../tema/cores';

export const estilosDetalhesEventoTecnico = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F5F8' },
  header: { backgroundColor: '#102B46', paddingHorizontal: 20, paddingTop: 45, paddingBottom: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerTitle: { color: CORES.textWhite, fontFamily: FONTES.bold, fontSize: 22 },
  notificationBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 150 },
  
  subtitleText: { color: '#334155', fontFamily: FONTES.body, fontSize: 14, marginBottom: 15 },
  boldText: { fontFamily: FONTES.bold },
  
  tipoBadgeDetalhe: { fontFamily: FONTES.bold, fontSize: 13, fontWeight: '700', color: '#2F80A8', marginBottom: 4 },
  tituloEventoDetalhe: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 24, marginBottom: 4 },
  funcaoDetalhe: { fontFamily: FONTES.semibold, color: '#64748B', fontSize: 14, marginBottom: 16 },

  sectionTitle: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 18, marginBottom: 12, marginTop: 8 },
  card: { backgroundColor: CORES.cardWhite, borderRadius: 16, borderWidth: 1, borderColor: '#E1E7EF', elevation: 0, marginBottom: 16 },
  
  placeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  placeType: { fontFamily: FONTES.bold, color: CORES.textMuted, fontSize: 16 },
  placeName: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 18, marginTop: 4 },
  placeAddress: { fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, marginTop: 14 },
  placeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E4ECF2' },
  placeTime: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 16 },
  
  noteText: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, lineHeight: 20 },
  
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: CORES.cardDivider },
  personIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: CORES.sheetBgSubtle, alignItems: 'center', justifyContent: 'center' },
  personInfo: { flex: 1 },
  personName: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15, fontWeight: '700' },
  personMeta: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, marginTop: 2 },
  
  sectionHint: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, marginBottom: 12 },
  
  bottomActionArea: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  btnAccept: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  btnAcceptText: { fontFamily: FONTES.bold, fontSize: 15, color: '#FFF' },
  btnReject: { backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  btnRejectText: { fontFamily: FONTES.bold, fontSize: 15, color: '#EF4444' },
  disclaimer: { fontFamily: FONTES.body, fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16 },
  
  center: { flex: 1, backgroundColor: '#F3F5F8', alignItems: 'center', justifyContent: 'center', padding: 24 }
});