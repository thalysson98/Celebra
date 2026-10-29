import { StyleSheet } from 'react-native';
import {CORES, FONTES} from '../tema/cores';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.bgHeaderDark },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FONTES.bold, fontSize: 24, fontWeight: '700', color: CORES.textWhite },
  subtitle: { fontFamily: FONTES.body, fontSize: 12, color: CORES.headerSubtitle, marginTop: 4 },
  addButton: { borderRadius: 12, marginTop: 16, alignSelf: 'stretch' },
  addButtonContent: { minHeight: 46 },
  sheet: { flex: 1, backgroundColor: CORES.sheetBg, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
  controls: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8 },
  searchBox: { minHeight: 48, borderRadius: 13, backgroundColor: CORES.cardWhite, borderWidth: 1, borderColor: '#D6E2EB', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13 },
  searchInput: { fontFamily: FONTES.body, flex: 1, color: CORES.textNavy, fontSize: 13, paddingVertical: 10 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 },
  filter: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#FFFFFF' },
  filterActive: { backgroundColor: CORES.bgHeaderDark },
  filterText: { fontFamily: FONTES.semibold, color: CORES.textMuted, fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: '#FFFFFF' },
  count: { fontFamily: FONTES.body, marginLeft: 'auto', color: CORES.textMuted, fontSize: 12 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
  emptyState: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#DDF0F8', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontFamily: FONTES.body, color: CORES.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, marginBottom: 8 },
});
