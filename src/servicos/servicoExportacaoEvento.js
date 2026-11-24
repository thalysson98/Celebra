import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

const textoSeguro = (valor) =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const textoOuFallback = (valor) => {
  const texto = String(valor ?? '').trim();
  return texto || 'Não informado';
};

const montarHtmlEvento = (evento) => {
  const convidados =
    evento.quantidade_convidados ??
    evento.quantidadeConvidados ??
    evento.num_convidados ??
    evento.numConvidados ??
    evento.guestCount ??
    evento.convidados;
  const locais = (evento.locais || []).map((local) => `
    <article class="item">
      <h3>${textoSeguro(local.nomeDoLocal || local.nomeEstabelecimento || local.nome || local.tipoLocal || 'Local')}</h3>
      <p><strong>Tipo:</strong> ${textoSeguro(textoOuFallback(local.tipoLocal))}</p>
      <p><strong>Endereço:</strong> ${textoSeguro(textoOuFallback(local.enderecoLocal || local.endereco || local.endereco_completo))}</p>
      <p><strong>Horário:</strong> ${textoSeguro(textoOuFallback(local.horaLocal || local.hora_local || local.horarioLocal || local.horario_local || local.horario || local.hora))}</p>
      ${local.observacoesLocal ? `<p><strong>Observações:</strong> ${textoSeguro(local.observacoesLocal)}</p>` : ''}
    </article>
  `).join('');

  const equipe = (evento.equipe || []).map((pessoa) => `
    <li>
      <strong>${textoSeguro(textoOuFallback(pessoa.nomeProfissional || pessoa.nome))}</strong>
      ${pessoa.funcao ? ` — ${textoSeguro(pessoa.funcao)}` : ''}
      ${pessoa.statusConfirmacao ? ` <span>(${textoSeguro(pessoa.statusConfirmacao)})</span>` : ''}
    </li>
  `).join('');

  return `<!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page { margin: 32px; }
          body { font-family: Arial, sans-serif; color: #173653; font-size: 12px; line-height: 1.5; }
          header { border-bottom: 3px solid #D9A441; margin-bottom: 24px; padding-bottom: 16px; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          h2 { margin: 22px 0 8px; font-size: 16px; }
          h3 { margin: 0 0 6px; font-size: 14px; }
          p { margin: 4px 0; white-space: pre-wrap; }
          .tipo { color: #2F80A8; font-weight: bold; text-transform: uppercase; }
          .item { border: 1px solid #E1E7EF; border-radius: 8px; margin: 8px 0; padding: 12px; page-break-inside: avoid; }
          ul { margin: 0; padding-left: 20px; }
          li { margin: 6px 0; }
          .notas { background: #F3F5F8; border-radius: 8px; padding: 12px; }
        </style>
      </head>
      <body>
        <header>
          <div class="tipo">${textoSeguro(textoOuFallback(evento.tipo))}</div>
          <h1>${textoSeguro(textoOuFallback(evento.titulo))}</h1>
          <p><strong>Data:</strong> ${textoSeguro(textoOuFallback(evento.data))} &nbsp; <strong>Horário:</strong> ${textoSeguro(textoOuFallback(evento.horario))}</p>
        </header>
        <h2>Informações do evento</h2>
        <p><strong>Cliente:</strong> ${textoSeguro(textoOuFallback(evento.cliente))}</p>
        <p><strong>Convidados:</strong> ${textoSeguro(textoOuFallback(convidados))}</p>
        ${evento.funcao ? `<p><strong>Sua função:</strong> ${textoSeguro(evento.funcao)}</p>` : ''}
        ${evento.organizador ? `<p><strong>Organizador:</strong> ${textoSeguro(evento.organizador)}</p>` : ''}
        <h2>Locais</h2>
        ${locais || '<p>Nenhum local cadastrado.</p>'}
        <h2>Equipe</h2>
        ${equipe ? `<ul>${equipe}</ul>` : '<p>Nenhum profissional cadastrado.</p>'}
        <h2>Notas da produção</h2>
        <p class="notas">${textoSeguro(textoOuFallback(evento.notas))}</p>
      </body>
    </html>`;
};

const MENSAGEM_ERRO_EXPORTACAO_PADRAO =
  'Não foi possível exportar o PDF do evento. Tente novamente.';

const criarErroExportacaoPdf = (mensagem) => {
  const erro = new Error(mensagem || MENSAGEM_ERRO_EXPORTACAO_PADRAO);
  erro.exportacaoPdfTratada = true;
  return erro;
};

export const exportarEventoParaPdf = async (evento) => {
  if (!evento || typeof evento !== 'object') {
    throw criarErroExportacaoPdf(
      'Não foi possível exportar o PDF porque os dados do evento não estão disponíveis.'
    );
  }

  let html;
  try {
    html = montarHtmlEvento(evento);
  } catch (erro) {
    console.error('Erro ao montar HTML do PDF do evento:', erro);
    throw criarErroExportacaoPdf(
      'Não foi possível preparar os dados do evento para exportação em PDF.'
    );
  }

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof window.print !== 'function') {
      throw criarErroExportacaoPdf('A exportação para PDF não está disponível neste navegador.');
    }

    try {
      await Print.printToFileAsync({ html });
      return;
    } catch (erro) {
      console.error('Erro ao exportar PDF na web:', erro);
      throw criarErroExportacaoPdf(MENSAGEM_ERRO_EXPORTACAO_PADRAO);
    }
  }

  let compartilhamentoDisponivel = false;
  try {
    compartilhamentoDisponivel = await Sharing.isAvailableAsync();
  } catch (erro) {
    console.error('Erro ao verificar disponibilidade de compartilhamento:', erro);
    throw criarErroExportacaoPdf(
      'Não foi possível verificar o compartilhamento de arquivos neste dispositivo.'
    );
  }

  if (!compartilhamentoDisponivel) {
    throw criarErroExportacaoPdf(
      'O compartilhamento de arquivos não está disponível neste dispositivo.'
    );
  }

  let arquivo;
  try {
    arquivo = await Print.printToFileAsync({
      html,
      base64: Platform.OS === 'android',
    });
  } catch (erro) {
    console.error('Erro ao gerar arquivo PDF do evento:', erro);
    throw criarErroExportacaoPdf('Não foi possível gerar o PDF do evento. Tente novamente.');
  }

  if (!arquivo || typeof arquivo.uri !== 'string' || !arquivo.uri.trim()) {
    throw criarErroExportacaoPdf(
      'A exportação para PDF não funcionou. O arquivo não pôde ser gerado.'
    );
  }

  if (typeof arquivo.numberOfPages === 'number' && arquivo.numberOfPages <= 0) {
    throw criarErroExportacaoPdf(
      'A exportação para PDF não funcionou. O documento gerado está vazio.'
    );
  }

  let uriParaCompartilhar = arquivo.uri;
  if (Platform.OS === 'android') {
    if (!arquivo.base64) {
      throw criarErroExportacaoPdf('Não foi possível preparar o PDF para compartilhamento.');
    }

    try {
      const pdfCompartilhavel = new File(Paths.document, `evento-${Date.now()}.pdf`);
      pdfCompartilhavel.create({ overwrite: true });
      await pdfCompartilhavel.write(arquivo.base64, { encoding: 'base64' });

      if (
        !pdfCompartilhavel.exists ||
        (typeof pdfCompartilhavel.size === 'number' && pdfCompartilhavel.size <= 0)
      ) {
        throw criarErroExportacaoPdf(
          'Não foi possível salvar o arquivo PDF para compartilhamento.'
        );
      }

      uriParaCompartilhar = pdfCompartilhavel.uri;
    } catch (erro) {
      if (erro?.exportacaoPdfTratada) throw erro;
      console.error('Erro ao salvar PDF compartilhável no Android:', erro);
      throw criarErroExportacaoPdf(
        'Não foi possível salvar o arquivo PDF para compartilhamento.'
      );
    }
  }

  if (typeof uriParaCompartilhar !== 'string' || !uriParaCompartilhar.trim()) {
    throw criarErroExportacaoPdf('Não foi possível localizar o arquivo PDF gerado.');
  }

  try {
    await Sharing.shareAsync(uriParaCompartilhar, {
      dialogTitle: `Compartilhar evento: ${textoOuFallback(evento.titulo)}`,
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
  } catch (erro) {
    console.error('Erro ao compartilhar PDF do evento:', erro);
    throw criarErroExportacaoPdf(
      'Não foi possível compartilhar o PDF do evento. Tente novamente.'
    );
  }
};
