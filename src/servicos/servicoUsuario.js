import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { autenticacao, bancoDados } from '../configuracao/configuracaoFirebase';

function verificarUsuarioAtual(uid) {
  if (!autenticacao.currentUser || autenticacao.currentUser.uid !== uid) {
    throw new Error('Você só pode alterar o perfil da conta conectada.');
  }
}

export async function obterPerfilUsuario(usuarioFirebase) {
  const refPerfil = doc(bancoDados, 'users', usuarioFirebase.uid);
  const snapshotPerfil = await getDoc(refPerfil);

  if (!snapshotPerfil.exists()) {
    return {
      uid: usuarioFirebase.uid,
      email: usuarioFirebase.email,
      name: usuarioFirebase.displayName || usuarioFirebase.email?.split('@')[0] || 'Colaborador',
      role: 'technician',
      companyId: null,
      cpf: '',
      phone: '',
      city: '',
      notificationPreferences: { eventsAndTeam: true },
      active: true,
      profileStatus: 'ready',
    };
  }

  const perfil = snapshotPerfil.data();
  const papel = perfil.role === 'organizer' ? 'organizer' : 'technician';
  let nomeEmpresa = '';
  if (perfil.companyId) {
    try {
      const snapshotEmpresa = await getDoc(doc(bancoDados, 'companies', perfil.companyId));
      if (snapshotEmpresa.exists()) nomeEmpresa = snapshotEmpresa.data().name || '';
    } catch {
      // Falha opcional na leitura da empresa não impede o acesso ao perfil
    }
  }

  return {
    uid: usuarioFirebase.uid,
    email: usuarioFirebase.email || perfil.email || '',
    name: perfil.displayName || usuarioFirebase.displayName || usuarioFirebase.email?.split('@')[0] || 'Colaborador',
    displayName: perfil.displayName || usuarioFirebase.displayName || usuarioFirebase.email?.split('@')[0] || 'Colaborador',
    username: perfil.username || '',
    cpf: perfil.cpf || '',
    phone: perfil.phone || '',
    city: perfil.city || '',
    companyName: nomeEmpresa,
    notificationPreferences: {
      ...(perfil.notificationPreferences || {}),
      eventsAndTeam: perfil.notificationPreferences?.eventsAndTeam ?? true,
    },
    role: papel,
    companyId: perfil.companyId || null,
    active: true,
    profileStatus: 'ready',
  };
}

export const getUserProfile = obterPerfilUsuario;

export async function atualizarPerfilUsuario(uid, { displayName, cpf, phone, city }) {
  verificarUsuarioAtual(uid);
  const nomeLimpo = typeof displayName === 'string' ? displayName.trim() : '';
  const cpfLimpo = String(cpf || '').replace(/\D/g, '');
  const telefoneLimpo = String(phone || '').replace(/\D/g, '');
  const cidadeLimpa = typeof city === 'string' ? city.trim() : '';

  if (!nomeLimpo) throw new Error('Informe seu nome para exibição.');
  if (nomeLimpo.length > 100) throw new Error('O nome deve ter no máximo 100 caracteres.');
  if (cpfLimpo && cpfLimpo.length !== 11) throw new Error('O CPF deve conter 11 números.');
  if (telefoneLimpo && ![10, 11].includes(telefoneLimpo.length)) {
    throw new Error('Informe um telefone com DDD.');
  }
  if (cidadeLimpa.length > 100) throw new Error('A cidade deve ter no máximo 100 caracteres.');

  await updateDoc(doc(bancoDados, 'users', uid), {
    displayName: nomeLimpo,
    cpf: cpfLimpo,
    phone: telefoneLimpo,
    city: cidadeLimpa,
    updatedAt: serverTimestamp(),
  });

  return { displayName: nomeLimpo, cpf: cpfLimpo, phone: telefoneLimpo, city: cidadeLimpa };
}

export const updateUserProfile = atualizarPerfilUsuario;

export async function definirPreferenciaNotificacaoEventos(uid, habilitado) {
  verificarUsuarioAtual(uid);
  if (typeof habilitado !== 'boolean') throw new Error('Preferência de notificação inválida.');

  await updateDoc(doc(bancoDados, 'users', uid), {
    'notificationPreferences.eventsAndTeam': habilitado,
    updatedAt: serverTimestamp(),
  });
}

export const setUserEventsNotificationPreference = definirPreferenciaNotificacaoEventos;
