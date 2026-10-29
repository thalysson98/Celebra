import { StyleSheet } from 'react-native';
import { CORES } from '../tema/cores';

export const estilosVinculoEmpresa = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.bgHeaderDark },
  conteudo: { flexGrow: 1, padding: 22, paddingTop: 44, paddingBottom: 36 },
  cabecalho: { marginBottom: 24 },
  marca: { color: CORES.buttonGold, fontSize: 18, fontWeight: '800', marginBottom: 14 },
  titulo: { color: CORES.textWhite, fontSize: 26, fontWeight: '800' },
  subtitulo: { color: CORES.headerSubtitle, fontSize: 14, lineHeight: 21, marginTop: 8 },
  cartao: { backgroundColor: CORES.cardWhite, borderRadius: 20, padding: 20 },
  tituloCartao: { color: CORES.textNavy, fontSize: 20, fontWeight: '800' },
  ajuda: { color: CORES.textMuted, fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 14 },
  erro: { color: '#B42318', backgroundColor: '#FEF3F2', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 13, lineHeight: 19 },
  grupoCampo: { marginTop: 10 },
  rotulo: { color: CORES.textNavy, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  campoCodigo: { minHeight: 54, borderWidth: 1, borderColor: CORES.cardDivider, borderRadius: 11, paddingHorizontal: 14, color: CORES.textNavy, backgroundColor: '#FAFCFD', fontSize: 20, fontWeight: '800', letterSpacing: 1.5 },
  botao: { minHeight: 50, borderRadius: 12, backgroundColor: CORES.buttonGold, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  botaoDesativado: { opacity: 0.65 },
  textoBotao: { color: CORES.textNavy, fontSize: 15, fontWeight: '800' },
  botaoSair: { alignItems: 'center', paddingVertical: 14 },
  textoSair: { color: CORES.textMuted, fontSize: 14, fontWeight: '600' },
});
