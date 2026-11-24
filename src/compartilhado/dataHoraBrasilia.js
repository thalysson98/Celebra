export const FUSO_HORARIO_BRASILIA = 'America/Sao_Paulo';

const formatadorPartesBrasilia = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO_HORARIO_BRASILIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function paraData(valor) {
  if (!valor) return null;
  const data = typeof valor.toDate === 'function' ? valor.toDate() : new Date(valor);
  return data instanceof Date && !Number.isNaN(data.getTime()) ? data : null;
}

function partesEmBrasilia(data) {
  return Object.fromEntries(
    formatadorPartesBrasilia
      .formatToParts(data)
      .filter((parte) => parte.type !== 'literal')
      .map((parte) => [parte.type, Number(parte.value)])
  );
}

function dataCalendarioValida(ano, mes, dia) {
  const validacao = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    validacao.getUTCFullYear() === ano &&
    validacao.getUTCMonth() === mes - 1 &&
    validacao.getUTCDate() === dia
  );
}

export function formatarDataIsoBrasilia(valor) {
  if (typeof valor === 'string') {
    const texto = valor.trim();
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dataIso) {
      const [, ano, mes, dia] = dataIso;
      return dataCalendarioValida(Number(ano), Number(mes), Number(dia))
        ? `${ano}-${mes}-${dia}`
        : '';
    }

    const dataBrasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dataBrasileira) {
      const [, dia, mes, ano] = dataBrasileira;
      return dataCalendarioValida(Number(ano), Number(mes), Number(dia))
        ? `${ano}-${mes}-${dia}`
        : '';
    }
  }

  const data = paraData(valor);
  if (!data) return '';
  const partes = partesEmBrasilia(data);
  return `${partes.year}-${String(partes.month).padStart(2, '0')}-${String(partes.day).padStart(2, '0')}`;
}

export function formatarDataBrasilia(valor) {
  const chaveData = formatarDataIsoBrasilia(valor);
  if (!chaveData) return '';
  const [ano, mes, dia] = chaveData.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarHoraBrasilia(valor) {
  if (typeof valor === 'string') {
    const texto = valor.trim();
    const horaTexto = texto.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*h?$/i);
    const horaInteira = texto.match(/^(\d{1,2})h$/i);
    const correspondencia = horaTexto || horaInteira;
    if (correspondencia) {
      const horas = Number(correspondencia[1]);
      const minutos = Number(horaTexto ? correspondencia[2] : 0);
      if (horas <= 23 && minutos <= 59) {
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
      }
    }
  }

  const data = paraData(valor);
  if (!data) return typeof valor === 'string' ? valor.trim() : '';
  const partes = partesEmBrasilia(data);
  return `${String(partes.hour).padStart(2, '0')}:${String(partes.minute).padStart(2, '0')}`;
}

export function criarDataBrasilia(data, hora) {
  const textoData = String(data || '').trim();
  const dataIso = textoData.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dataBrasileira = textoData.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const ano = Number(dataIso ? dataIso[1] : dataBrasileira?.[3]);
  const mes = Number(dataIso ? dataIso[2] : dataBrasileira?.[2]);
  const dia = Number(dataIso ? dataIso[3] : dataBrasileira?.[1]);
  const partesHora = String(hora || '').trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!dataIso && !dataBrasileira) {
    throw new Error('Informe uma data válida para o evento (DD/MM/AAAA).');
  }
  if (!partesHora) throw new Error('Informe o horário no formato HH:MM.');

  const horas = Number(partesHora[1]);
  const minutos = Number(partesHora[2]);
  if (
    !dataCalendarioValida(ano, mes, dia) ||
    horas > 23 ||
    minutos > 59
  ) {
    throw new Error('Informe uma data e horário válidos para o evento.');
  }

  const horarioDesejadoUtc = Date.UTC(ano, mes - 1, dia, horas, minutos);
  let timestamp = horarioDesejadoUtc;
  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    const partes = partesEmBrasilia(new Date(timestamp));
    const horarioObservadoUtc = Date.UTC(
      partes.year,
      partes.month - 1,
      partes.day,
      partes.hour,
      partes.minute
    );
    const diferenca = horarioDesejadoUtc - horarioObservadoUtc;
    if (diferenca === 0) break;
    timestamp += diferenca;
  }

  const resultado = new Date(timestamp);
  const partesFinais = partesEmBrasilia(resultado);
  if (
    partesFinais.year !== ano ||
    partesFinais.month !== mes ||
    partesFinais.day !== dia ||
    partesFinais.hour !== horas ||
    partesFinais.minute !== minutos
  ) {
    throw new Error('Não foi possível converter o horário para Brasília.');
  }
  return resultado;
}
