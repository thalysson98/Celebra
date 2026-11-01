// src/estilos/estilosDetalheEventoOrganizador.js

import { StyleSheet } from 'react-native';
import { CORES, FONTES } from '../tema/cores';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.bgHeaderDark },
  tabs: { flexGrow: 0, maxHeight: 54, backgroundColor: CORES.bgHeaderDark },
  tabsContent: { paddingHorizontal: 22, gap: 26, alignItems: 'stretch' },
  tab: { minHeight: 52, justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: CORES.buttonGold },
  tabText: { fontFamily: FONTES.medium, color: '#D5E0EA', fontSize: 14, fontWeight: '500' },
  tabTextActive: { fontFamily: FONTES.bold, color: CORES.buttonGold, fontWeight: '700' },
  
  eventCoverFallback: { backgroundColor: '#173653', paddingHorizontal: 24, paddingVertical: 35 },
  coverTitle: { fontFamily: FONTES.bold, color: CORES.textWhite, fontSize: 32, fontWeight: '700' },
  coverSummary: { fontFamily: FONTES.body, color: CORES.textWhite, fontSize: 14, marginTop: 8 },
  
  sheet: { flex: 1, backgroundColor: '#F3F5F8' },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: FONTES.medium, color: CORES.textNavy, fontSize: 18, fontWeight: '500', marginTop: 8, marginBottom: 12 },
  sectionHint: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  card: { backgroundColor: CORES.cardWhite, borderRadius: 16, borderWidth: 1, borderColor: '#E1E7EF', elevation: 0, marginBottom: 16 },
  
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 11 },
  detailIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: CORES.cardLightBlue, justifyContent: 'center', alignItems: 'center' },
  detailText: { flex: 1 },
  detailLabel: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 11 },
  detailValue: { fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 14, fontWeight: '600', marginTop: 3 },
  
  placeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  placeName: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 20, fontWeight: '700' }, // Fonte maior
  placeAddress: { fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, fontWeight: '600', marginTop: 14 },
  placeMeta: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  placeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: CORES.cardDivider, marginTop: 14, paddingTop: 12 },
  placeTime: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 12, fontWeight: '700' },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  mapLinkText: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 12, fontWeight: '700' },
  
  editField: { marginBottom: 13 },
  editLabel: { fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  editInput: { fontFamily: FONTES.body, width: '100%', minHeight: 46, borderWidth: 1, borderColor: '#D8E2EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF', color: CORES.textNavy, fontSize: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editInputText: { fontFamily: FONTES.body, color: CORES.textNavy, fontSize: 14 },
  editInputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  editRow: { flexDirection: 'row', gap: 12 },
  editColumn: { flex: 1, marginBottom: 13 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  editError: { fontFamily: FONTES.body, color: '#B42318', backgroundColor: '#FEF3F2', borderRadius: 9, padding: 10, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  
  editPrimaryButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: CORES.buttonGold, borderRadius: 11, marginBottom: 18 },
  editPrimaryText: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 14, fontWeight: '700' },
  
  btnConcluir: { backgroundColor: '#10B981', marginTop: 10, minHeight: 46, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  
  teamCount: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 12, fontWeight: '700' },
  addTeamButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: CORES.buttonGold, borderRadius: 10, marginBottom: 14 },
  addTeamButtonText: { color: CORES.textNavy, fontFamily: FONTES.semibold, fontSize: 12, fontWeight: '600' },
  
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: CORES.cardDivider },
  personIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: CORES.sheetBgSubtle, alignItems: 'center', justifyContent: 'center' },
  personInfo: { flex: 1 },
  personName: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 14, fontWeight: '700' },
  personMeta: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 12, marginTop: 5 },
  
  pendingText: { color: '#B7791F', fontWeight: 'bold' },
  confirmedText: { color: '#198A64', fontWeight: 'bold' },
  rejectedText: { color: '#EF4444', fontWeight: 'bold' },
  
  actionIconsRow: { flexDirection: 'row', gap: 12 },
  iconBtn: { backgroundColor: '#F0F6FA', padding: 8, borderRadius: 8 },
  iconBtnRed: { backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8 },
  
  financeCard: { backgroundColor: '#173653', borderRadius: 16, padding: 20, marginBottom: 14 },
  financeLabel: { fontFamily: FONTES.body, color: '#C5D2DF', fontSize: 11 },
  financeTotal: { fontFamily: FONTES.body, color: CORES.textWhite, fontSize: 27, marginTop: 7 },
  financeDivider: { height: 4, borderRadius: 2, backgroundColor: CORES.buttonGold, width: '34%', marginTop: 17, marginBottom: 16 },
  financeSummaryRow: { flexDirection: 'row', gap: 18 },
  financeSummaryItem: { flex: 1 },
  financeAmount: { fontFamily: FONTES.bold, color: CORES.textWhite, fontSize: 15, fontWeight: '700', marginTop: 5 },
  
  emptyCard: { backgroundColor: CORES.cardWhite, borderRadius: 16, borderWidth: 1, borderColor: '#E1E7EF', elevation: 0 },
  emptyContent: { alignItems: 'flex-start' },
  emptyText: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, lineHeight: 19, marginTop: 9 },
  center: { flex: 1, backgroundColor: '#F3F5F8', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  loadingText: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 14 },
  notFound: { fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 15, fontWeight: '600', textAlign: 'center' },
});