import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebaseConfig';
import { getUserProfile } from './userService';

function parseFirebaseError(error) {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado em outra conta.';
    case 'auth/invalid-email':
      return 'O formato do e-mail digitado é inválido.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Usuário/e-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde um momento e tente novamente.';
    default:
      return error?.message || 'Ocorreu um erro inesperado na autenticação.';
  }
}

export async function registerUser({ username, email, password }) {
  if (!isFirebaseConfigured) {
    throw new Error('Configure as chaves do Firebase no arquivo src/config/firebaseConfig.js.');
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  try {
    // Verifica se o nome de usuário já existe na coleção "users" do Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', cleanUsername));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error('Este nome de usuário já está em uso. Escolha outro.');
    }

    // Cria a conta no Firebase Authentication (E-mail e Senha)
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const firebaseUser = userCredential.user;

    // Salva o nome de usuário no perfil do Firebase Auth
    await updateProfile(firebaseUser, { displayName: username.trim() });

    // Salva os dados complementares no Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      username: cleanUsername,
      displayName: username.trim(),
      email: cleanEmail,
      // O cadastro existente cria a conta organizadora do MVP.
      // Vínculos de técnicos devem ser criados pelo fluxo de convite da empresa.
      role: 'organizer',
      companyId: null,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      name: username.trim(),
      username: cleanUsername,
      email: cleanEmail,
      role: 'organizer',
      companyId: null,
      active: true,
    };
  } catch (error) {
    throw new Error(parseFirebaseError(error));
  }
}

export async function loginUser({ identifier, password }) {
  if (!isFirebaseConfigured) {
    throw new Error('Configure as chaves do Firebase no arquivo src/config/firebaseConfig.js.');
  }

  const cleanIdentifier = identifier.trim().toLowerCase();

  try {
    let emailToLogin = cleanIdentifier;

    // Se digitou o username (sem @), busca o e-mail correspondente no Firestore
    if (!cleanIdentifier.includes('@')) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', cleanIdentifier));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Usuário não encontrado. Verifique o nome digitado ou use seu e-mail.');
      }

      const userData = snapshot.docs[0].data();
      emailToLogin = userData.email;
    }

    const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
    const firebaseUser = userCredential.user;

    return getUserProfile(firebaseUser);
  } catch (error) {
    throw new Error(parseFirebaseError(error));
  }
}

export async function logoutUser() {
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
}
