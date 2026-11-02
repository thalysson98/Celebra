// src/servicos/repositorioEventos.js
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where, addDoc } from 'firebase/firestore';
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
    return dados.ativo !== false && mesmoNome;
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
  const tipoEvento = relacionados.tipoEvento || null;
  const convites = relacionados.convites || [];
  const membros = evento.membros_escalados || [];
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
    const cadastro = { ...normalizarCadastro(tipoEntidade, dadosNovoItem), [CAMPOS_ID_ADMINISTRACAO[tipoEntidade]]: referencia.id, id_empresa: empresaId, ativo: true, criado_em: serverTimestamp() };
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
    const empresaId = await obterIdEmpresaAtual();
    const referenciaEvento = doc(bancoDados, 'eventos', idEvento);
    const convites = [];
    const equipeInformativa = [];
    
    for (const profissional of profissionais) {
      const idUsuario = profissional.idUsuario || profissional.id;
      const idTipoProfissional = profissional.idTipoProfissional;
      const [snapshotUsuario, snapshotTipo] = await Promise.all([getDoc(doc(bancoDados, 'usuarios', idUsuario)), getDoc(doc(bancoDados, 'tipos_profissional', idTipoProfissional))]);
      
      const usuario = snapshotUsuario.data();
      const tipo = snapshotTipo.data();
      const dadosProfissional = { ...profissional, idUsuario, idTipoProfissional, nomeProfissional: usuario.nome_completo || 'Colaborador', funcao: tipo.nome };
      
      if (profissional.enviarConvite === false) {
        equipeInformativa.push({ id_usuario: idUsuario, id_tipo_profissional: idTipoProfissional, nome_profissional: dadosProfissional.nomeProfissional, nome_tipo_profissional: tipo.nome });
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
    const titulo = String(dadosAtualizados.titulo || '').trim();
    const dataInicio = converterDataEvento(dadosAtualizados.dataInicio, dadosAtualizados.horaInicio);
    
    const [idTipoEvento, idCliente] = await Promise.all([
      buscarOuCriarCadastro('tipos_evento', 'id_tipo_evento', empresaId, dadosAtualizados.tipoEvento),
      buscarOuCriarCadastro('clientes', 'id_cliente', empresaId, dadosAtualizados.cliente?.nome),
    ]);

    const locaisDetalhados = [];
    if (dadosAtualizados.locaisArray) {
        for (const loc of dadosAtualizados.locaisArray) {
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

    await updateDoc(referencia, {
      titulo, id_tipo_evento: idTipoEvento, nome_tipo_evento: dadosAtualizados.tipoEvento, id_cliente: idCliente,
       locais_detalhados: locaisDetalhados,
       data_inicio: dataInicio, quantidade_convidados: Number(dadosAtualizados.numConvidados) || 0,
      observacoes: String(dadosAtualizados.notasProducao || '').trim(),
      financeiro: dadosAtualizados.financeiro || {},
    });
    
    return repositorioEventos.obterEvento(idEvento);
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