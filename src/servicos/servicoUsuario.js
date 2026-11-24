import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { autenticacao, bancoDados } from '../configuracao/configuracaoFirebase';
import {
  cancelarTodasNotificacoesAgendadas,
  inicializarNotificacoesDispositivo,
} from './servicoNotificacoes';

// Prefixo usado no AsyncStorage para guardar a chave de notificações no aparelho
const CHAVE_PREFERENCIA_NOTIF_PREFIXO = '@celebra:notificacoes_eventos:';

// Lê do AsyncStorage se o usuário deixou as notificações ligadas ou desligadas
async function lerPreferenciaNotificacaoLocal(uid) {
  try {
    const valor = await AsyncStorage.getItem(`${CHAVE_PREFERENCIA_NOTIF_PREFIXO}${uid}`);
    if (valor === 'true') return true;
    if (valor === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

// Salva no AsyncStorage a escolha do usuário para manter o estado após fechar o app
async function salvarPreferenciaNotificacaoLocal(uid, habilitado) {
  try {
    await AsyncStorage.setItem(`${CHAVE_PREFERENCIA_NOTIF_PREFIXO}${uid}`, String(habilitado));
  } catch {
    // Falha de armazenamento local não impede a atualização em memória.
  }
}

function verificarUsuarioAtual(uid) {
  if (!autenticacao.currentUser || autenticacao.currentUser.uid !== uid) {
    throw new Error('Você só pode alterar o perfil da conta conectada.');
  }
}

export async function obterPerfilUsuario(usuarioFirebase) {
  const refPerfil = doc(bancoDados, 'usuarios', usuarioFirebase.uid);
  const snapshotPerfil = await getDoc(refPerfil);
  if (!snapshotPerfil.exists()) {
    return {
      uid: usuarioFirebase.uid,
      email: usuarioFirebase.email || '',
      name: usuarioFirebase.displayName || 'Colaborador',
      displayName: usuarioFirebase.displayName || 'Colaborador',
      papel: false,
      idEmpresa: null,
      companyId: null,
      ativo: false,
      active: false,
      profileStatus: 'perfil_nao_cadastrado',
    };
  }

  const perfil = snapshotPerfil.data();
  if (typeof perfil.papel !== 'boolean') {
    throw new Error('O campo papel do perfil precisa ser booleano (true ou false).');
  }
  const papel = perfil.papel;
  const nome = perfil.nome_completo || usuarioFirebase.displayName || usuarioFirebase.email?.split('@')[0] || 'Colaborador';
  const idEmpresa = perfil.id_empresa || null;
  let nomeEmpresa = '';
  let dadosEmpresa = {};
  const codigoVinculoEmpresa = papel ? idEmpresa || '' : '';
  if (idEmpresa) {
    try {
      const snapshotEmpresa = await getDoc(doc(bancoDados, 'empresas', idEmpresa));
      if (snapshotEmpresa.exists()) {
        dadosEmpresa = snapshotEmpresa.data();
        nomeEmpresa = dadosEmpresa.nome_fantasia || '';
      }
    } catch {
      // O nome da empresa é complementar e não impede o login.
    }
  }

  // Carrega a preferência de notificações do Firestore (ou do AsyncStorage se ainda não existir no banco)
  let notificacoesEventos = true;
  if (typeof perfil.notificacoes_eventos === 'boolean') {
    notificacoesEventos = perfil.notificacoes_eventos;
  } else {
    const preferenciaLocal = await lerPreferenciaNotificacaoLocal(usuarioFirebase.uid);
    if (typeof preferenciaLocal === 'boolean') {
      notificacoesEventos = preferenciaLocal;
    }
  }

  return {
    uid: usuarioFirebase.uid,
    email: usuarioFirebase.email || perfil.email || '',
    name: nome,
    displayName: nome,
    cpf: perfil.cpf || '',
    telefone: perfil.telefone || '',
    phone: perfil.telefone || '',
    notificacoesEventos,
    notificationPreferences: {
      eventsAndTeam: notificacoesEventos,
    },
    companyName: nomeEmpresa,
    companyCnpj: dadosEmpresa.cnpj || '',
    companyEmail: dadosEmpresa.email || '',
    companyPhone: dadosEmpresa.telefone || '',
    companyAddress: dadosEmpresa.endereco || {},
    codigoVinculo: codigoVinculoEmpresa,
    papel,
    idEmpresa,
    companyId: idEmpresa,
    ativo: perfil.ativo === true,
    active: perfil.ativo === true,
    profileStatus: perfil.ativo !== true
      ? 'bloqueado'
      : idEmpresa ? 'ready' : 'pendente_vinculo',
  };
}

export const getUserProfile = obterPerfilUsuario;

// Atualiza apenas nome e telefone do usuário (o CPF não pode ser alterado após o cadastro)
export async function atualizarPerfilUsuario(uid, { displayName, phone }) {
  verificarUsuarioAtual(uid);
  const nomeLimpo = typeof displayName === 'string' ? displayName.trim() : '';
  const telefoneLimpo = String(phone || '').replace(/\D/g, '');
  if (!nomeLimpo) throw new Error('Informe seu nome completo.');
  if (nomeLimpo.length > 120) throw new Error('O nome completo deve ter no máximo 120 caracteres.');
  if (telefoneLimpo && ![10, 11].includes(telefoneLimpo.length)) throw new Error('Informe um telefone com DDD.');

  await updateDoc(doc(bancoDados, 'usuarios', uid), {
    nome_completo: nomeLimpo,
    telefone: telefoneLimpo,
  });
  return { displayName: nomeLimpo, phone: telefoneLimpo };
}

export const updateUserProfile = atualizarPerfilUsuario;

// Ativa ou desativa as notificações do técnico, salvando no AsyncStorage e no Firestore
export async function definirPreferenciaNotificacaoEventos(uid, habilitado) {
  verificarUsuarioAtual(uid);
  if (typeof habilitado !== 'boolean') {
    throw new Error('Preferência de notificação inválida.');
  }

  // Guarda localmente primeiro para a chave continuar salva mesmo ao recarregar o app
  await salvarPreferenciaNotificacaoLocal(uid, habilitado);

  // Tenta salvar também no documento do usuário no Firestore
  const refUsuario = doc(bancoDados, 'usuarios', uid);
  try {
    await updateDoc(
      refUsuario,
      habilitado
        ? { notificacoes_eventos: true }
        : { notificacoes_eventos: false, pushToken: null }
    );
  } catch (erro) {
    // Se a regra nova ainda não foi publicada no Firebase, ao menos limpa o pushToken ao desativar
    if (erro?.code === 'permission-denied') {
      if (!habilitado) {
        try {
          await updateDoc(refUsuario, { pushToken: null });
        } catch {
          // Mantém a preferência salva localmente se o token não puder ser atualizado.
        }
      }
    } else {
      throw new Error('Não foi possível salvar sua preferência de notificações. Tente novamente.');
    }
  }

  // Ao ativar, registra o dispositivo; ao desativar, cancela alarmes agendados no celular
  if (habilitado) {
    await inicializarNotificacoesDispositivo(uid);
  } else {
    await cancelarTodasNotificacoesAgendadas();
  }

  return habilitado;
}

export const setUserEventsNotificationPreference = definirPreferenciaNotificacaoEventos;
