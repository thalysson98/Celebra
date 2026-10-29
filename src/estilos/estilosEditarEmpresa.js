import { StyleSheet } from 'react-native';
import {CORES, FONTES} from '../tema/cores';

export const estilosEditarEmpresa = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.sheetBg },
  cabecalho: { minHeight: 104, backgroundColor: CORES.bgHeaderDark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  voltar: { width: 38, height: 42, justifyContent: 'center' },
  tituloCabecalho: { fontFamily: FONTES.bold, color: CORES.textWhite, fontSize: 20, fontWeight: '700' },
  subtituloCabecalho: { fontFamily: FONTES.body, color: CORES.headerSubtitle, fontSize: 13, marginTop: 4 },
  conteudo: { padding: 20, paddingBottom: 36 },
  cartao: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: CORES.cardDivider, padding: 18, marginBottom: 16 },
  tituloSecao: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grupo: { marginTop: 10 },
  rotulo: { fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  campo: { fontFamily: FONTES.body, minHeight: 46, borderWidth: 1, borderColor: CORES.cardDivider, borderRadius: 10, paddingHorizontal: 12, color: CORES.textNavy, backgroundColor: '#FFFFFF', fontSize: 14 },
  linha: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  erro: { fontFamily: FONTES.body, color: '#B42318', backgroundColor: '#FEF3F2', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13, lineHeight: 19 },
  acao: { minHeight: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: CORES.buttonGold, marginTop: 8 },
  acaoDesativada: { opacity: 0.65 },
  textoAcao: { fontFamily: FONTES.bold, color: CORES.textNavy, fontSize: 15, fontWeight: '700' },
  cancelar: { minHeight: 48, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CORES.cardDivider, marginTop: 10 },
  textoCancelar: { fontFamily: FONTES.semibold, color: CORES.textNavy, fontSize: 14, fontWeight: '600' },
  carregando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
