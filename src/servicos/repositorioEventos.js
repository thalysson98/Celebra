// src/servicos/repositorioEventos.js
import { arrayUnion, collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, where, addDoc } from 'firebase/firestore';
import { autenticacao, bancoDados } from '../configuracao/configuracaoFirebase';
import { enviarConvitesEvento } from './servicoEscala';
import { verificarLembretesProximidadeEvento } from './servicoNotificacoes';

const COLECOES_ADMINISTRACAO = {
  tiposEvento: 'tipos_evento',
  tiposProfissional: 'tipos_profissional',
  tiposLocal: 'tipos_local',
  tiposDespesa: 'tipos_despesa',
  locaisSalvos: 'locais',
  clientes: 'clientes',
};

const CAMPOS_ID_ADMINISTRACAO = {
  tiposEvento: 'id_tipo_evento',
  tiposProfissional: 'id_tipo_profissional',
  tiposLocal: 'id_tipo_local',
  tiposDespesa: 'id_tipo_despesa',
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
    return dados.ativo !== false && mesmoNome;
  });

  if (existente) return existente.id;
  const cadastroInativo = existentes.docs.find((item) => {
    const dados = item.data();
    return dados.ativo === false && normalizarTexto(dados.nome) === normalizarTexto(nomeLimpo);
  });
  if (cadastroInativo) {
    throw new Error(`O cadastro "${nomeLimpo}" está inativo. Reative-o antes de usá-lo em um novo evento.`);
  }

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

async function buscarCadastroVinculadoOuCriar(colecao, campoId, empresaId, nome, idVinculado) {
  if (idVinculado) {
    const snapshot = await getDoc(doc(bancoDados, colecao, idVinculado));
    if (snapshot.exists()) {
      const cadastro = snapshot.data();
      if (
        cadastro.id_empresa === empresaId &&
        normalizarTexto(cadastro.nome) === normalizarTexto(nome)
      ) {
        return snapshot.id;
      }
    }
  }
  return buscarOuCriarCadastro(colecao, campoId, empresaId, nome);
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
  const tipoEvento = relacionados.tipoEvento || null;
  const convites = relacionados.convites || [];
  const membros = evento.membros_escalados || [];
  const despesasEquipe = evento.despesas_equipe || [];
  const pendentes = convites.filter((convite) => convite.situacao === 'pendente').length;
  const nomeEquipa = membros.length ? 'Equipe confirmada' : 'Equipe pendente';
  let dataFormatada = '';

  if (dataInicio) {
    const dia = String(dataInicio.getDate()).padStart(2, '0');
    const mes = String(dataInicio.getMonth() + 1).padStart(2, '0');
    const ano = dataInicio.getFullYear();
    dataFormatada = `${dia}/${mes}/${ano}`;
  }

  const locaisSalvos = (evento.locais_detalhados || relacionados.locaisAntigos || []).map(l => ({
    ...l,
    enderecoLocal: l.enderecoLocal || l.endereco_completo || l.endereco || '',
    tipoLocal: l.tipoLocal || l.nome_tipo_local || l.tipo || ''
  }));

  return {
    id: snapshot.id,
    ...evento,
    idEvento: snapshot.id,
    titulo: evento.titulo || '',
    tipoEvento: tipoEvento?.nome || evento.nome_tipo_evento || '', 
    dataInicio: dataFormatada,
    horaInicio: dataInicio ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(dataInicio) : '',
    statusTempo: evento.situacao === 'concluido' || evento.situacao === 'cancelado' ? 'concluidos' : 'futuros',
    statusEquipa: pendentes ? 'Equipe Pendente' : nomeEquipa,
    notasProducao: evento.observacoes || '',
    numConvidados: Number(evento.quantidade_convidados) || 0,
    cliente: cliente ? { id: evento.id_cliente, nome: cliente.nome, documento: cliente.documento || '', email: cliente.email || '', telefone: cliente.telefone || '' } : null,
    locais: locaisSalvos,
    equipe: [
      ...convites.map((convite) => ({
        id: convite.id,
        idConvite: convite.id,
        idUsuario: convite.id_usuario,
        idTipoProfissional: convite.id_tipo_profissional,
        nomeProfissional: convite.nome_profissional || 'Profissional',
        funcao: convite.nome_tipo_profissional || convite.tipoProfissional?.nome || '',
        statusConfirmacao: convite.situacao === 'aceito' ? 'Confirmado' : convite.situacao === 'recusado' ? 'Recusado' : convite.situacao === 'cancelado' ? 'Cancelado' : 'Pendente',
        enviarConvite: true,
        despesas: despesasEquipe.find((item) => item.id_profissional === convite.id || item.id_profissional === convite.id_usuario)?.despesas || [],
      })),
      ...(evento.equipe_informativa || []).map((profissional, index) => ({
        id: profissional.id_usuario || `${snapshot.id}_informativo_${index}`,
        idUsuario: profissional.id_usuario,
        idTipoProfissional: profissional.id_tipo_profissional,
        nomeProfissional: profissional.nome_profissional || 'Profissional',
        funcao: profissional.nome_tipo_profissional || '',
        statusConfirmacao: 'Informativo',
        enviarConvite: false,
        despesas: despesasEquipe.find((item) => item.id_profissional === (profissional.id_usuario || `${snapshot.id}_informativo_${index}`))?.despesas || [],
      })),
    ],
    financeiro: evento.financeiro || {},
  };
}

async function buscarRelacionadosEvento(snapshot) {
  const evento = snapshot.data();
  const clienteSnap = evento.id_cliente ? await getDoc(doc(bancoDados, 'clientes', evento.id_cliente)) : null;
  const tipoEventoSnap = evento.id_tipo_evento ? await getDoc(doc(bancoDados, 'tipos_evento', evento.id_tipo_evento)) : null;
  
  let locaisAntigos = [];
  if (!evento.locais_detalhados && evento.id_locais && evento.id_locais.length > 0) {
    const locaisPromessas = evento.id_locais.map(id => getDoc(doc(bancoDados, 'locais', id)));
    const locaisSnaps = await Promise.all(locaisPromessas);
    locaisAntigos = locaisSnaps.filter(s => s.exists()).map(s => {
        const data = s.data();
        return {
           id: s.id,
           nomeDoLocal: data.nome || '',
           enderecoLocal: data.endereco_completo || '',
           tipoLocal: data.nome_tipo_local || '' 
         };
    });
  }

  const convitesSnap = await getDocs(query(collection(bancoDados, 'convites'), where('id_empresa', '==', evento.id_empresa), where('id_evento', '==', snapshot.id)));
  const convites = await Promise.all((convitesSnap?.docs || []).map(async (item) => ({
    id: item.id,
    ...item.data(),
    tipoProfissional: item.data().id_tipo_profissional ? (await getDoc(doc(bancoDados, 'tipos_profissional', item.data().id_tipo_profissional))).data() : null,
  })));

  return {
    cliente: clienteSnap?.exists() ? clienteSnap.data() : null,
    locaisAntigos,
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
    return eventos.sort((a, b) => (paraDataJavaScript(b.data_inicio)?.getTime() || 0) - (paraDataJavaScript(a.data_inicio)?.getTime() || 0));
  },
  obterEvento: async (idEvento) => {
    const snapshot = await getDoc(doc(bancoDados, 'eventos', idEvento));
    if (!snapshot.exists()) return null;
    return mapearEvento(snapshot, await buscarRelacionadosEvento(snapshot));
  },
  atualizarDespesasEquipe: async (idEvento, idProfissional, despesas) => {
    const referencia = doc(bancoDados, 'eventos', idEvento);
    await runTransaction(bancoDados, async (transacao) => {
      const referenciaConvite = doc(bancoDados, 'convites', idProfissional);
      const [snapshot, conviteSnapshot] = await Promise.all([
        transacao.get(referencia),
        transacao.get(referenciaConvite),
      ]);
      if (!snapshot.exists()) throw new Error('Evento não encontrado.');
      const existentes = snapshot.data().despesas_equipe || [];
      const despesasProfissionalExistentes = existentes.find((item) => item.id_profissional === idProfissional)?.despesas || [];
      const conviteCancelado =
        conviteSnapshot.exists() &&
        conviteSnapshot.data().id_evento === idEvento &&
        conviteSnapshot.data().situacao === 'cancelado';
      const idsDespesasExistentes = new Set(despesasProfissionalExistentes.map((despesa) => despesa.id));
      const adicionaDespesa = despesas.some((despesa) => !despesa.id || !idsDespesasExistentes.has(despesa.id));
      if (conviteCancelado && adicionaDespesa) {
        throw new Error('Não é possível adicionar despesas para um profissional com convite cancelado.');
      }
      const atualizadas = existentes.filter((item) => item.id_profissional !== idProfissional);
      atualizadas.push({ id_profissional: idProfissional, despesas });
      transacao.update(referencia, { despesas_equipe: atualizadas });
    });
    return despesas;
  },
  atualizarParcelasEvento: async (idEvento, parcelasDetalhadas) => {
    const referencia = doc(bancoDados, 'eventos', idEvento);
    await updateDoc(referencia, { 'financeiro.parcelasDetalhadas': parcelasDetalhadas });
  },
  obterOpcoesSelect: async (tipoEntidade, empresaId, incluirArquivados = false) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    if (!nomeColecao || !empresaId) return [];
    const consulta = query(collection(bancoDados, nomeColecao), where('id_empresa', '==', empresaId));
    const resultado = await getDocs(consulta);
    return resultado.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => incluirArquivados || item.ativo !== false);
  },
  adicionarNovoItemSelect: async (tipoEntidade, dadosNovoItem, empresaId) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    const referencia = doc(collection(bancoDados, nomeColecao));
    const dadosCadastro = normalizarCadastro(tipoEntidade, dadosNovoItem);
    const consulta = query(collection(bancoDados, nomeColecao), where('id_empresa', '==', empresaId));
    const existentes = await getDocs(consulta);
    const cadastroInativo = existentes.docs.find((item) => {
      const dados = item.data();
      return dados.ativo === false && normalizarTexto(dados.nome) === normalizarTexto(dadosCadastro.nome);
    });
    if (cadastroInativo) {
      throw new Error(`O cadastro "${dadosCadastro.nome}" está inativo. Reative-o antes de usá-lo em um novo evento.`);
    }

    const cadastro = { ...dadosCadastro, [CAMPOS_ID_ADMINISTRACAO[tipoEntidade]]: referencia.id, id_empresa: empresaId, ativo: true, criado_em: serverTimestamp() };
    await setDoc(referencia, cadastro);
    return { id: referencia.id, ...cadastro };
  },
  atualizarItemSelect: async (tipoEntidade, id, dadosAtualizados, empresaId) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    const dados = { ...normalizarCadastro(tipoEntidade, dadosAtualizados), [CAMPOS_ID_ADMINISTRACAO[tipoEntidade]]: id, id_empresa: empresaId };
    await updateDoc(doc(bancoDados, nomeColecao, id), dados);
    return { id, ...dados };
  },
  arquivarItemSelect: async (tipoEntidade, id, empresaId) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    await updateDoc(doc(bancoDados, nomeColecao, id), { ativo: false });
    return { id, ativo: false };
  },
  reativarItemSelect: async (tipoEntidade, id, empresaId) => {
    const nomeColecao = COLECOES_ADMINISTRACAO[tipoEntidade];
    await updateDoc(doc(bancoDados, nomeColecao, id), { ativo: true });
    return { id, ativo: true };
  },
  verificarUsoEmEvento: async (tipoEntidade, id, empresaId) => {
    try {
      const eventosQuery = query(collection(bancoDados, 'eventos'), where('id_empresa', '==', empresaId));
      const eventosSnap = await getDocs(eventosQuery);
      let emUso = false;
      
      eventosSnap.forEach(snap => {
        const ev = snap.data();
        if (tipoEntidade === 'tiposEvento' && ev.id_tipo_evento === id) emUso = true;
        if (tipoEntidade === 'clientes' && ev.id_cliente === id) emUso = true;
        if (tipoEntidade === 'locaisSalvos') {
           const lDetalhados = ev.locais_detalhados || [];
           if (lDetalhados.some(l => l.id_local === id) || ev.id_locais?.includes(id)) emUso = true;
        }
        if (tipoEntidade === 'tiposProfissional') {
           const eq = ev.equipe_informativa || [];
           if (eq.some(p => p.id_tipo_profissional === id)) emUso = true;
        }
        if (tipoEntidade === 'tiposDespesa') {
          const despesasEquipe = ev.despesas_equipe || [];
          if (despesasEquipe.some((profissional) => (profissional.despesas || []).some((despesa) => despesa.id_tipo_despesa === id))) emUso = true;
        }
      });
      
      if (tipoEntidade === 'tiposProfissional' && !emUso) {
         const convitesQuery = query(collection(bancoDados, 'convites'), where('id_empresa', '==', empresaId), where('id_tipo_profissional', '==', id));
         const convitesSnap = await getDocs(convitesQuery);
         if (!convitesSnap.empty) emUso = true;
      }
      
      if (tipoEntidade === 'tiposLocal' && !emUso) {
         const locaisQuery = query(collection(bancoDados, 'locais'), where('id_empresa', '==', empresaId), where('id_tipo_local', '==', id));
         const locaisSnap = await getDocs(locaisQuery);
         if (!locaisSnap.empty) emUso = true;
      }

      return emUso;
    } catch (e) {
      return false; 
    }
  },
  concluirEvento: async (idEvento) => {
    const empresaId = await obterIdEmpresaAtual();
    if (!empresaId) throw new Error('Vincule sua conta.');
    await updateDoc(doc(bancoDados, 'eventos', idEvento), { situacao: 'concluido' });
  },
  reabrirEvento: async (idEvento) => {
    const empresaId = await obterIdEmpresaAtual();
    if (!empresaId) throw new Error('Vincule sua conta.');
    await updateDoc(doc(bancoDados, 'eventos', idEvento), { situacao: 'aberto' });
  },
  adicionarEvento: async (dadosNovoEvento) => {
    const empresaId = await obterIdEmpresaAtual();
    if (!empresaId) throw new Error('Vincule sua conta a uma empresa.');
    
    const titulo = String(dadosNovoEvento.titulo || '').trim();
    const dataInicio = converterDataEvento(dadosNovoEvento.dataInicio, dadosNovoEvento.horaInicio);
    
    const [idTipoEvento, idCliente] = await Promise.all([
      buscarOuCriarCadastro('tipos_evento', 'id_tipo_evento', empresaId, dadosNovoEvento.tipoEvento),
      buscarOuCriarCadastro('clientes', 'id_cliente', empresaId, dadosNovoEvento.cliente?.nome),
    ]);
    
    const locaisDetalhados = [];
    if (dadosNovoEvento.locaisArray) {
        for (const loc of dadosNovoEvento.locaisArray) {
            const idTipoLocal = await buscarOuCriarCadastro('tipos_local', 'id_tipo_local', empresaId, loc.tipoLocal);
            const idL = await buscarOuCriarCadastro('locais', 'id_local', empresaId, loc.nomeDoLocal);
            
            await updateDoc(doc(bancoDados, 'locais', idL), {
                id_tipo_local: idTipoLocal, 
                endereco_completo: loc.enderecoLocal || '', 
                nome_tipo_local: loc.tipoLocal || '' 
            });

            locaisDetalhados.push({
               idLocalTemp: loc.idLocalTemp || Date.now(),
               id_local: idL,
               nomeDoLocal: loc.nomeDoLocal,
               enderecoLocal: loc.enderecoLocal,
               tipoLocal: loc.tipoLocal,
               horaLocal: loc.horaLocal || '',
               observacoesLocal: loc.observacoesLocal || ''
            });
        }
    }

    const referencia = doc(collection(bancoDados, 'eventos'));
    const dadosEvento = {
      id_evento: referencia.id, id_empresa: empresaId, titulo, id_tipo_evento: idTipoEvento, id_cliente: idCliente,
      nome_tipo_evento: dadosNovoEvento.tipoEvento,
      locais_detalhados: locaisDetalhados,
      data_inicio: dataInicio, quantidade_convidados: Number(dadosNovoEvento.numConvidados) || 0,
      membros_escalados: [],
      equipe_informativa: (dadosNovoEvento.equipe || []).filter(p => p.enviarConvite === false).map(p => ({
        id_usuario: p.idUsuario || p.id, id_tipo_profissional: p.idTipoProfissional, nome_profissional: p.nomeProfissional, nome_tipo_profissional: p.funcao,
      })),
      despesas_equipe: (dadosNovoEvento.equipe || [])
        .filter((profissional) => profissional.despesas?.length)
        .map((profissional) => {
          const idUsuario = profissional.idUsuario || profissional.id;
          return {
            id_profissional: profissional.enviarConvite === false ? idUsuario : `${referencia.id}_${idUsuario}`,
            despesas: profissional.despesas,
          };
        }),
      financeiro: dadosNovoEvento.financeiro || {},
      situacao: 'aberto', observacoes: String(dadosNovoEvento.notasProducao || '').trim(), criado_em: serverTimestamp(),
    };

    await setDoc(referencia, dadosEvento);
    
    let erroConvites = '';
    try {
      await enviarConvitesEvento({ idEvento: referencia.id, idEmpresa: empresaId, profissionais: dadosNovoEvento.equipe || [] });
    } catch (error) { erroConvites = 'O evento foi salvo, mas não foi possível enviar todos os convites.'; }
    
    const eventoCriado = await repositorioEventos.obterEvento(referencia.id);
    return { ...eventoCriado, erroConvites };
  },
  adicionarProfissionaisEvento: async (idEvento, profissionais = []) => {
    let empresaId = await obterIdEmpresaAtual();
    const referenciaEvento = doc(bancoDados, 'eventos', idEvento);
    if (!empresaId) {
      const snapEvento = await getDoc(referenciaEvento);
      empresaId = snapEvento.data()?.id_empresa;
    }
    const convites = [];
    const equipeInformativa = [];
    
    for (const profissional of profissionais) {
      const idUsuario = profissional.idUsuario || profissional.id;
      const idTipoProfissional = profissional.idTipoProfissional;
      const [snapshotUsuario, snapshotTipo] = await Promise.all([getDoc(doc(bancoDados, 'usuarios', idUsuario)), getDoc(doc(bancoDados, 'tipos_profissional', idTipoProfissional))]);
      
      const usuario = snapshotUsuario.data();
      const tipo = snapshotTipo.data();
      const nomeProfissional = usuario?.nome_completo || profissional.nomeProfissional || 'Colaborador';
      const nomeFuncao = tipo?.nome || profissional.funcao || 'Profissional';
      const dadosProfissional = { ...profissional, idUsuario, idTipoProfissional, nomeProfissional, funcao: nomeFuncao };
      
      if (profissional.enviarConvite === false) {
        equipeInformativa.push({ id_usuario: idUsuario, id_tipo_profissional: idTipoProfissional, nome_profissional: dadosProfissional.nomeProfissional, nome_tipo_profissional: nomeFuncao });
      } else {
        convites.push(dadosProfissional);
      }
    }
    
    if (convites.length) await enviarConvitesEvento({ idEvento, idEmpresa: empresaId, profissionais: convites });
    if (equipeInformativa.length) await updateDoc(referenciaEvento, { equipe_informativa: arrayUnion(...equipeInformativa) });
    
    return repositorioEventos.obterEvento(idEvento);
  },
  atualizarEvento: async (idEvento, dadosAtualizados) => {
    const empresaId = await obterIdEmpresaAtual();
    const referencia = doc(bancoDados, 'eventos', idEvento);
    const eventoAtualSnap = await getDoc(referencia);
    if (!eventoAtualSnap.exists()) throw new Error('Evento não encontrado.');
    const eventoAtual = eventoAtualSnap.data();
    const titulo = String(dadosAtualizados.titulo || '').trim();
    const dataInicio = converterDataEvento(dadosAtualizados.dataInicio, dadosAtualizados.horaInicio);
    
    const [idTipoEvento, idCliente] = await Promise.all([
      buscarCadastroVinculadoOuCriar('tipos_evento', 'id_tipo_evento', empresaId, dadosAtualizados.tipoEvento, eventoAtual.id_tipo_evento),
      buscarCadastroVinculadoOuCriar('clientes', 'id_cliente', empresaId, dadosAtualizados.cliente?.nome, eventoAtual.id_cliente),
    ]);

    const locaisDetalhados = [];
    if (dadosAtualizados.locaisArray) {
        for (const loc of dadosAtualizados.locaisArray) {
            const idLocalAtual = loc.id_local || loc.id;
            const localVinculado = (eventoAtual.locais_detalhados || []).find((local) => local.id_local === idLocalAtual)
              || (eventoAtual.id_locais?.includes(idLocalAtual) ? { id_local: idLocalAtual } : null);
            const localAtualSnap = localVinculado?.id_local
              ? await getDoc(doc(bancoDados, 'locais', localVinculado.id_local))
              : null;
            const tipoLocalVinculado = localAtualSnap?.exists()
              ? localAtualSnap.data().id_tipo_local
              : null;
            const idTipoLocal = await buscarCadastroVinculadoOuCriar(
              'tipos_local',
              'id_tipo_local',
              empresaId,
              loc.tipoLocal,
              tipoLocalVinculado
            );
            const idL = await buscarCadastroVinculadoOuCriar(
              'locais',
              'id_local',
              empresaId,
              loc.nomeDoLocal,
              localVinculado?.id_local
            );
            
            await updateDoc(doc(bancoDados, 'locais', idL), {
                id_tipo_local: idTipoLocal, 
                endereco_completo: loc.enderecoLocal || '', 
                nome_tipo_local: loc.tipoLocal || '' 
            });

            locaisDetalhados.push({
               idLocalTemp: loc.idLocalTemp || Date.now(),
               id_local: idL,
               nomeDoLocal: loc.nomeDoLocal,
               enderecoLocal: loc.enderecoLocal,
               tipoLocal: loc.tipoLocal,
               horaLocal: loc.horaLocal || '',
               observacoesLocal: loc.observacoesLocal || ''
            });
        }
    }

    await updateDoc(referencia, {
      titulo, id_tipo_evento: idTipoEvento, nome_tipo_evento: dadosAtualizados.tipoEvento, id_cliente: idCliente,
       locais_detalhados: locaisDetalhados,
       data_inicio: dataInicio, quantidade_convidados: Number(dadosAtualizados.numConvidados) || 0,
      observacoes: String(dadosAtualizados.notasProducao || '').trim(),
      financeiro: dadosAtualizados.financeiro || {},
    });

    const eventoAtualizado = await repositorioEventos.obterEvento(idEvento);
    for (const membro of eventoAtualizado?.equipe || []) {
      if (membro.enviarConvite !== false && membro.idUsuario) {
        try {
          await verificarLembretesProximidadeEvento({
            idUsuario: membro.idUsuario,
            idEvento,
            nomeEvento: eventoAtualizado.titulo || titulo,
            dataEvento: eventoAtualizado.dataInicio,
            statusConfirmacao: membro.statusConfirmacao,
            enviarPushRemoto: true,
          });
        } catch (e) {
          console.log('Aviso ao verificar lembrete na atualização do evento:', e?.message);
        }
      }
    }

    return eventoAtualizado;
  },
  criarUsuarioTecnicoFantasma: async (nome, empresaId) => {
    const referencia = doc(collection(bancoDados, 'usuarios'));
    const novoUsuario = {
      id_usuario: referencia.id,
      id_empresa: empresaId,
      nome_completo: nome.trim(),
      papel: false,
      ativo: true,
      criado_em: serverTimestamp(),
    };
    await setDoc(referencia, novoUsuario);
    return { id: referencia.id, nome: novoUsuario.nome_completo };
  }
};