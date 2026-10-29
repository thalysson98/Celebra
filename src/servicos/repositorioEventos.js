import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { autenticacao, bancoDados } from '../configuracao/configuracaoFirebase';
import { enviarConvitesEvento } from './servicoEscala';

const COLECOES_ADMINISTRACAO = {
  tiposEvento: 'tipos_evento',
  tiposProfissional: 'tipos_profissional',
  tiposLocal: 'tipos_local',
  locaisSalvos: 'locais',
  clientes: 'clientes',
};
const CAMPOS_ID_ADMINISTRACAO = {
  tiposEvento: 'id_tipo_evento',
  tiposProfissional: 'id_tipo_profissional',
  tiposLocal: 'id_tipo_local',
  locaisSalvos: 'id_local',
  clientes: 'id_cliente',
};

function normalizarCadastro(tipoEntidade, cadastro) {
  if (tipoEntidade === 'locaisSalvos' && cadastro.nomeDoLocal && !cadastro.nome) {
    const { nomeDoLocal, ...dados } = cadastro;
    return { ...dados, nome: nomeDoLocal };
  }
  return cadastro;
}

async function obterIdEmpresaAtual() {
  const uid = autenticacao.currentUser?.uid;
  if (!uid) return null;
  const perfil = await getDoc(doc(bancoDados, 'usuarios', uid));
  return perfil.exists() ? perfil.data().id_empresa || null : null;
}

function normalizarTexto(valor) {
  return String(valor || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function converterDataEvento(data, hora) {
  const texto = String(data || '').trim();
  const dataBrasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const textoData = dataBrasileira ? `${dataBrasileira[3]}-${dataBrasileira[2]}-${dataBrasileira[1]}` : texto;
  const horario = String(hora || '00:00').trim();
  if (!/^\d{1,2}:\d{2}$/.test(horario)) throw new Error('Informe o horário no formato HH:MM.');
  const [horas = '00', minutos = '00'] = horario.split(':');
  const resultado = new Date(`${textoData}T${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}:00`);
  if (!texto || Number.isNaN(resultado.getTime())) {
    throw new Error('Informe uma data válida para o evento (DD/MM/AAAA).');
  }
  return Timestamp.fromDate(resultado);
}

async function buscarOuCriarCadastro(colecao, campoId, empresaId, nome, camposAdicionais = {}) {
  const nomeLimpo = String(nome || '').trim();
  if (!nomeLimpo) throw new Error('Preencha os dados obrigatórios do evento.');
  const consulta = query(collection(bancoDados, colecao), where('id_empresa', '==', empresaId));
  const existentes = await getDocs(consulta);
  const existente = existentes.docs.find((item) => {
    const dados = item.data();
    const mesmoNome = normalizarTexto(dados.nome) === normalizarTexto(nomeLimpo);
    const mesmoLocal = colecao !== 'locais'
      || (normalizarTexto(dados.endereco_completo) === normalizarTexto(camposAdicionais.endereco_completo)
        && dados.id_tipo_local === camposAdicionais.id_tipo_local);
    return dados.ativo !== false && mesmoNome && mesmoLocal;
  });
  if (existente) return existente.id;

  const referencia = doc(collection(bancoDados, colecao));
  await setDoc(referencia, {
    [campoId]: referencia.id,
    id_empresa: empresaId,
    nome: nomeLimpo,
    ...camposAdicionais,
    ativo: true,
    criado_em: serverTimestamp(),
  });
  return referencia.id;
}

function paraDataJavaScript(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') return valor.toDate();
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function mapearEvento(snapshot, relacionados = {}) {
  const evento = snapshot.data();
  const dataInicio = paraDataJavaScript(evento.data_inicio);
  const cliente = relacionados.cliente || null;
  const local = relacionados.local || null;
  const tipoEvento = relacionados.tipoEvento || null;
  const convites = relacionados.convites || [];
  const membros = evento.membros_escalados || [];
  const pendentes = convites.filter((convite) => convite.situacao === 'pendente').length;
  const nomeEquipa = membros.length ? 'Equipe confirmada' : 'Equipe pendente';

  return {
    id: snapshot.id,
    ...evento,
    idEvento: snapshot.id,
    titulo: evento.titulo || '',
    tipoEvento: tipoEvento?.nome || '',
    dataInicio: dataInicio ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(dataInicio) : '',
    horaInicio: dataInicio ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(dataInicio) : '',
    statusTempo: evento.situacao === 'concluido' || evento.situacao === 'cancelado'
      || (dataInicio && dataInicio.getTime() < Date.now()) ? 'concluidos' : 'futuros',
    statusEquipa: pendentes ? 'Equipe Pendente' : nomeEquipa,
    notasProducao: evento.observacoes || '',
    numConvidados: Number(evento.quantidade_convidados) || 0,
    cliente: cliente ? { id: evento.id_cliente, nome: cliente.nome, documento: cliente.documento || '', email: cliente.email || '', telefone: cliente.telefone || '' } : null,
    locais: local ? [{ id: evento.id_local, nomeDoLocal: local.nome || '', endereco: local.endereco_completo || '', tipoLocal: relacionados.tipoLocal?.nome || '' }] : [],
    equipa: [
      ...convites.map((convite) => ({
        id: convite.id,
        idUsuario: convite.id_usuario,
        idTipoProfissional: convite.id_tipo_profissional,
        nomeProfissional: convite.nome_profissional || 'Profissional',
        funcao: convite.nome_tipo_profissional || convite.tipoProfissional?.nome || '',
        statusConfirmacao: convite.situacao === 'aceito' ? 'Confirmado' : convite.situacao === 'recusado' ? 'Recusado' : 'Pendente',
        enviarConvite: true,
      })),
      ...(evento.equipe_informativa || []).map((profissional, index) => ({
        id: profissional.id_usuario || `${snapshot.id}_informativo_${index}`,
        idUsuario: profissional.id_usuario,
        idTipoProfissional: profissional.id_tipo_profissional,
        nomeProfissional: profissional.nome_profissional || 'Profissional',
        funcao: profissional.nome_tipo_profissional || '',
        statusConfirmacao: 'Informativo',
        enviarConvite: false,
      })),
    ],
    financeiro: {},
  };
}

async function buscarRelacionadosEvento(snapshot) {
  const evento = snapshot.data();
  const [clienteSnap, localSnap, tipoEventoSnap, convitesSnap] = await Promise.all([
    evento.id_cliente ? getDoc(doc(bancoDados, 'clientes', evento.id_cliente)) : null,
    evento.id_local ? getDoc(doc(bancoDados, 'locais', evento.id_local)) : null,
    evento.id_tipo_evento ? getDoc(doc(bancoDados, 'tipos_evento', evento.id_tipo_evento)) : null,
    getDocs(query(
      collection(bancoDados, 'convites'),
      where('id_empresa', '==', evento.id_empresa),
      where('id_evento', '==', snapshot.id),
    )),
  ]);
  const convites = await Promise.all((convitesSnap?.docs || []).map(async (item) => ({
    id: item.id,
    ...item.data(),
    tipoProfissional: item.data().id_tipo_profissional
      ? (await getDoc(doc(bancoDados, 'tipos_profissional', item.data().id_tipo_profissional))).data()
      : null,
  })));
  const local = localSnap?.exists() ? localSnap.data() : null;
  const tipoLocalSnap = local?.id_tipo_local ? await getDoc(doc(bancoDados, 'tipos_local', local.id_tipo_local)) : null;
  return {
    cliente: clienteSnap?.exists() ? clienteSnap.data() : null,
    local,
    tipoLocal: tipoLocalSnap?.exists() ? tipoLocalSnap.data() : null,
    tipoEvento: tipoEventoSnap?.exists() ? tipoEventoSnap.data() : null,
    convites,
  };
}

async function mapearSnapshotsEventos(snapshots) {
  return Promise.all(snapshots.map(async (snapshot) => mapearEvento(snapshot, await buscarRelacionadosEvento(snapshot))));
}

export const repositorioEventos = {
  listarEventos: async () => {
    const empresaId = await obterIdEmpresaAtual();
    if (!empresaId) return [];
    const consulta = query(collection(bancoDados, 'eventos'), where('id_empresa', '==', empresaId));
    const resultado = await getDocs(consulta);
    const eventos = await mapearSnapshotsEventos(resultado.docs);
    return eventos.sort((a, b) => (paraDataJavaScript(a.data_inicio)?.getTime() || 0) - (paraDataJavaScript(b.data_inicio)?.getTime() || 0));
  },

  obterEvento: async (idEvento) => {
    const snapshot = await getDoc(doc(bancoDados, 'eventos', idEvento));
    if (!snapshot.exists()) return null;
    return mapearEvento(snapshot, await buscarRelacionadosEvento(snapshot));
  },

  obterOpcoesSelect: async (tipoEntidade, empresaId, incluirArquivados = false) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    if (!nomeColecao) return [];
    if (!empresaId) return [];

    const consulta = query(collection(bancoDados, nomeColecao), where('id_empresa', '==', empresaId));
    const resultado = await getDocs(consulta);
    return resultado.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => incluirArquivados || item.ativo !== false);
  },

  adicionarNovoItemSelect: async (tipoEntidade, dadosNovoItem, empresaId) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    if (!nomeColecao) throw new Error('Tipo de entidade desconhecido para cadastro.');
    if (!empresaId) throw new Error('Vincule sua conta a uma empresa antes de cadastrar itens.');
    const referencia = doc(collection(bancoDados, nomeColecao));
    const cadastro = {
      ...normalizarCadastro(tipoEntidade, dadosNovoItem),
      [CAMPOS_ID_ADMINISTRACAO[tipoEntidade]]: referencia.id,
      id_empresa: empresaId,
      ativo: true,
      criado_em: serverTimestamp(),
    };
    await setDoc(referencia, cadastro);
    return { id: referencia.id, ...cadastro };
  },

  atualizarItemSelect: async (tipoEntidade, id, dadosAtualizados, empresaId) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    if (!nomeColecao) throw new Error('Tipo de entidade desconhecido para edição.');
    if (!empresaId) throw new Error('Vincule sua conta a uma empresa antes de editar itens.');
    const dados = { ...normalizarCadastro(tipoEntidade, dadosAtualizados), [CAMPOS_ID_ADMINISTRACAO[tipoEntidade]]: id, id_empresa: empresaId };
    await updateDoc(doc(bancoDados, nomeColecao, id), dados);
    return { id, ...dados };
  },

  arquivarItemSelect: async (tipoEntidade, id, empresaId) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    if (!nomeColecao) throw new Error('Tipo de entidade desconhecido para arquivamento.');
    if (!empresaId) throw new Error('Vincule sua conta a uma empresa antes de arquivar itens.');
    await updateDoc(doc(bancoDados, nomeColecao, id), { ativo: false });
    return { id, ativo: false };
  },

  reativarItemSelect: async (tipoEntidade, id, empresaId) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    if (!nomeColecao) throw new Error('Tipo de entidade desconhecido para reativação.');
    if (!empresaId) throw new Error('Vincule sua conta a uma empresa antes de reativar itens.');
    await updateDoc(doc(bancoDados, nomeColecao, id), { ativo: true });
    return { id, ativo: true };
  },

  adicionarEvento: async (dadosNovoEvento) => {
    const empresaId = await obterIdEmpresaAtual();
    if (!empresaId) throw new Error('Vincule sua conta a uma empresa antes de cadastrar eventos.');
    const titulo = String(dadosNovoEvento.titulo || '').trim();
    if (!titulo) throw new Error('Informe o título do evento.');
    if (!dadosNovoEvento.local?.nomeDoLocal || !dadosNovoEvento.local?.endereco || !dadosNovoEvento.local?.tipoLocal) {
      throw new Error('Informe o nome, o endereço e o tipo do local do evento.');
    }
    const dataInicio = converterDataEvento(dadosNovoEvento.dataInicio, dadosNovoEvento.horaInicio);

    const [idTipoEvento, idCliente, idTipoLocal] = await Promise.all([
      buscarOuCriarCadastro('tipos_evento', 'id_tipo_evento', empresaId, dadosNovoEvento.tipoEvento),
      buscarOuCriarCadastro('clientes', 'id_cliente', empresaId, dadosNovoEvento.cliente?.nome, {
        documento: dadosNovoEvento.cliente?.documento || '',
        email: dadosNovoEvento.cliente?.email || '',
        telefone: dadosNovoEvento.cliente?.telefone || '',
        observacoes: '',
      }),
      buscarOuCriarCadastro('tipos_local', 'id_tipo_local', empresaId, dadosNovoEvento.local.tipoLocal),
    ]);
    const idLocal = await buscarOuCriarCadastro('locais', 'id_local', empresaId, dadosNovoEvento.local.nomeDoLocal, {
      id_tipo_local: idTipoLocal,
      endereco_completo: dadosNovoEvento.local.endereco,
      observacoes: '',
    });

    const referencia = doc(collection(bancoDados, 'eventos'));
    const dadosEvento = {
      id_evento: referencia.id,
      id_empresa: empresaId,
      titulo,
      id_tipo_evento: idTipoEvento,
      id_cliente: idCliente,
      id_local: idLocal,
      data_inicio: dataInicio,
      quantidade_convidados: Number(dadosNovoEvento.numConvidados) || 0,
      membros_escalados: [],
      equipe_informativa: (dadosNovoEvento.equipe || [])
        .filter((profissional) => profissional.enviarConvite === false)
        .map((profissional) => ({
          id_usuario: profissional.idUsuario || profissional.id,
          id_tipo_profissional: profissional.idTipoProfissional,
          nome_profissional: profissional.nomeProfissional,
          nome_tipo_profissional: profissional.funcao,
        })),
      situacao: 'aberto',
      observacoes: String(dadosNovoEvento.notasProducao || '').trim(),
      criado_em: serverTimestamp(),
    };
    await setDoc(referencia, dadosEvento);
    let erroConvites = '';
    try {
      await enviarConvitesEvento({
        idEvento: referencia.id,
        idEmpresa: empresaId,
        profissionais: dadosNovoEvento.equipe || [],
      });
    } catch (error) {
      erroConvites = error?.message || 'O evento foi salvo, mas não foi possível enviar todos os convites.';
    }
    const eventoCriado = await repositorioEventos.obterEvento(referencia.id);
    return { ...eventoCriado, erroConvites };
  },

  adicionarProfissionaisEvento: async (idEvento, profissionais = []) => {
    const empresaId = await obterIdEmpresaAtual();
    if (!empresaId) throw new Error('Vincule sua conta a uma empresa antes de atualizar a equipe.');
    const referenciaEvento = doc(bancoDados, 'eventos', idEvento);
    const snapshotEvento = await getDoc(referenciaEvento);
    if (!snapshotEvento.exists() || snapshotEvento.data().id_empresa !== empresaId) {
      throw new Error('Este evento não existe ou não pertence à empresa vinculada.');
    }

    const convites = [];
    const equipeInformativa = [];
    for (const profissional of profissionais) {
      const idUsuario = profissional.idUsuario || profissional.id_usuario || profissional.id;
      const idTipoProfissional = profissional.idTipoProfissional || profissional.id_tipo_profissional;
      if (!idUsuario || !idTipoProfissional) throw new Error('Selecione um profissional e o tipo de serviço.');
      const [snapshotUsuario, snapshotTipo] = await Promise.all([
        getDoc(doc(bancoDados, 'usuarios', idUsuario)),
        getDoc(doc(bancoDados, 'tipos_profissional', idTipoProfissional)),
      ]);
      const usuario = snapshotUsuario.exists() ? snapshotUsuario.data() : null;
      const tipo = snapshotTipo.exists() ? snapshotTipo.data() : null;
      if (usuario?.id_empresa !== empresaId || usuario?.papel !== false || usuario?.ativo !== true) {
        throw new Error('O profissional selecionado não está mais ativo na equipe desta empresa.');
      }
      if (tipo?.id_empresa !== empresaId || tipo?.ativo === false) {
        throw new Error('O tipo de profissional selecionado não está disponível para esta empresa.');
      }
      const dadosProfissional = {
        ...profissional,
        idUsuario,
        idTipoProfissional,
        nomeProfissional: usuario.nome_completo || profissional.nomeProfissional || 'Colaborador',
        funcao: tipo.nome,
      };
      if (profissional.enviarConvite === false) {
        equipeInformativa.push({
          id_usuario: idUsuario,
          id_tipo_profissional: idTipoProfissional,
          nome_profissional: dadosProfissional.nomeProfissional,
          nome_tipo_profissional: tipo.nome,
        });
      } else {
        convites.push(dadosProfissional);
      }
    }

    if (convites.length) {
      await enviarConvitesEvento({ idEvento, idEmpresa: empresaId, profissionais: convites });
    }
    if (equipeInformativa.length) {
      await updateDoc(referenciaEvento, { equipe_informativa: arrayUnion(...equipeInformativa) });
    }
    return repositorioEventos.obterEvento(idEvento);
  },

  atualizarEvento: async (idEvento, dadosAtualizados) => {
    const empresaId = await obterIdEmpresaAtual();
    if (!empresaId) throw new Error('Vincule sua conta a uma empresa antes de editar eventos.');
    const referencia = doc(bancoDados, 'eventos', idEvento);
    const snapshot = await getDoc(referencia);
    if (!snapshot.exists()) throw new Error('Este evento não existe mais.');
    const eventoAtual = snapshot.data();
    if (eventoAtual.id_empresa !== empresaId) throw new Error('Você não tem permissão para editar este evento.');

    const titulo = String(dadosAtualizados.titulo || '').trim();
    if (!titulo) throw new Error('Informe o título do evento.');
    const local = dadosAtualizados.local || {};
    if (!local.nomeDoLocal || !local.endereco || !local.tipoLocal) {
      throw new Error('Informe o nome, o endereço e o tipo do local do evento.');
    }
    const dataInicio = converterDataEvento(dadosAtualizados.dataInicio, dadosAtualizados.horaInicio);
    const [idTipoEvento, idCliente, idTipoLocal] = await Promise.all([
      buscarOuCriarCadastro('tipos_evento', 'id_tipo_evento', empresaId, dadosAtualizados.tipoEvento),
      buscarOuCriarCadastro('clientes', 'id_cliente', empresaId, dadosAtualizados.cliente?.nome),
      buscarOuCriarCadastro('tipos_local', 'id_tipo_local', empresaId, local.tipoLocal),
    ]);
    const idLocal = await buscarOuCriarCadastro('locais', 'id_local', empresaId, local.nomeDoLocal, {
      id_tipo_local: idTipoLocal,
      endereco_completo: local.endereco,
      observacoes: '',
    });

    await updateDoc(referencia, {
      titulo,
      id_tipo_evento: idTipoEvento,
      id_cliente: idCliente,
      id_local: idLocal,
      data_inicio: dataInicio,
      quantidade_convidados: Number(dadosAtualizados.numConvidados) || 0,
      observacoes: String(dadosAtualizados.notasProducao || '').trim(),
    });
    return repositorioEventos.obterEvento(idEvento);
  },

  criarEvento: async (dadosNovoEvento) => repositorioEventos.adicionarEvento(dadosNovoEvento),
};
