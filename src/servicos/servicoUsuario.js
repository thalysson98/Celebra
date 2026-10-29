import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { autenticacao, bancoDados } from '../configuracao/configuracaoFirebase';

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

  return {
    uid: usuarioFirebase.uid,
    email: usuarioFirebase.email || perfil.email || '',
    name: nome,
    displayName: nome,
    telefone: perfil.telefone || '',
    phone: perfil.telefone || '',
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

export async function definirPreferenciaNotificacaoEventos() {
  throw new Error('Preferências de notificação ainda não fazem parte do modelo oficial de usuarios.');
}

export const setUserEventsNotificationPreference = definirPreferenciaNotificacaoEventos;
