import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const VALID_ROLES = ['organizer', 'technician'];

export async function getUserProfile(firebaseUser) {
  const profileRef = doc(db, 'users', firebaseUser.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email || 'Usuário',
      role: 'pending',
      companyId: null,
      active: false,
      profileStatus: 'missing',
    };
  }

  const profile = profileSnapshot.data();
  const role = VALID_ROLES.includes(profile.role) ? profile.role : 'pending';

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || profile.email || '',
    name: profile.displayName || firebaseUser.displayName || firebaseUser.email || 'Usuário',
    username: profile.username || '',
    role,
    companyId: profile.companyId || null,
    active: profile.active !== false,
    profileStatus: role === 'pending' ? 'pending' : 'ready',
  };
}
