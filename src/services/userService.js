import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

const VALID_ROLES = ['organizer', 'technician'];

function assertCurrentUser(uid) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('Você só pode alterar o perfil da conta conectada.');
  }
}

export async function getUserProfile(firebaseUser) {
  const profileRef = doc(db, 'users', firebaseUser.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Colaborador',
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

  const profile = profileSnapshot.data();
  const role = profile.role === 'organizer' ? 'organizer' : 'technician';
  let companyName = '';
  if (profile.companyId) {
    try {
      const companySnapshot = await getDoc(doc(db, 'companies', profile.companyId));
      if (companySnapshot.exists()) companyName = companySnapshot.data().name || '';
    } catch {
      // A falha opcional ao ler a empresa não deve impedir o acesso ao perfil do usuário.
    }
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || profile.email || '',
    name: profile.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Colaborador',
    displayName: profile.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Colaborador',
    username: profile.username || '',
    cpf: profile.cpf || '',
    phone: profile.phone || '',
    city: profile.city || '',
    companyName,
    notificationPreferences: {
      ...(profile.notificationPreferences || {}),
      eventsAndTeam: profile.notificationPreferences?.eventsAndTeam ?? true,
    },
    role,
    companyId: profile.companyId || null,
    active: true,
    profileStatus: 'ready',
  };
}

export async function updateUserProfile(uid, { displayName, cpf, phone, city }) {
  assertCurrentUser(uid);
  const cleanName = typeof displayName === 'string' ? displayName.trim() : '';
  const cleanCpf = String(cpf || '').replace(/\D/g, '');
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const cleanCity = typeof city === 'string' ? city.trim() : '';

  if (!cleanName) throw new Error('Informe seu nome para exibição.');
  if (cleanName.length > 100) throw new Error('O nome deve ter no máximo 100 caracteres.');
  if (cleanCpf && cleanCpf.length !== 11) throw new Error('O CPF deve conter 11 números.');
  if (cleanPhone && ![10, 11].includes(cleanPhone.length)) {
    throw new Error('Informe um telefone com DDD.');
  }
  if (cleanCity.length > 100) throw new Error('A cidade deve ter no máximo 100 caracteres.');

  await updateDoc(doc(db, 'users', uid), {
    displayName: cleanName,
    cpf: cleanCpf,
    phone: cleanPhone,
    city: cleanCity,
    updatedAt: serverTimestamp(),
  });

  return { displayName: cleanName, cpf: cleanCpf, phone: cleanPhone, city: cleanCity };
}

export async function setUserEventsNotificationPreference(uid, enabled) {
  assertCurrentUser(uid);
  if (typeof enabled !== 'boolean') throw new Error('Preferência de notificação inválida.');

  await updateDoc(doc(db, 'users', uid), {
    'notificationPreferences.eventsAndTeam': enabled,
    updatedAt: serverTimestamp(),
  });
}
