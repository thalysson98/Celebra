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
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebaseConfig';
import { createUser as createLocalUser, authenticateUser as authLocalUser } from '../database/userDb';

/**
 * ARQUITETURA PRONTA PARA BACKEND FUTURO:
 * As telas (LoginScreen e RegisterScreen) NÃO chamam o Firebase diretamente.
 * Elas chamam apenas as funções deste arquivo (`loginUser` e `registerUser`).
 *
 * - Hoje: deixe AUTH_MODE = 'FIREBASE'
 * - No futuro (quando criar a API Node/Java/Python): mude para AUTH_MODE = 'BACKEND_API'
 *   e ajuste a URL da sua API em API_BASE_URL, sem precisar mexer nas telas!
 */
const AUTH_MODE = 'FIREBASE'; // Opções: 'FIREBASE' | 'BACKEND_API'
const API_BASE_URL = 'https://seu-backend-futuro.com/api';

/**
 * Traduz códigos de erro do Firebase para mensagens amigáveis em português
 */
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

/**
 * Cadastra um novo usuário (Tela "Criar conta")
 */
export async function registerUser({ username, email, password }) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  // 1. MODO FUTURO: API Backend Própria (REST)
  if (AUTH_MODE === 'BACKEND_API') {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        email: cleanEmail,
        password,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao cadastrar usuário no servidor.');
    }
    return data.user;
  }

  // Fallback automático para banco local caso as chaves do Firebase ainda não tenham sido coladas
  if (!isFirebaseConfigured) {
    console.warn('Firebase ainda não configurado em firebaseConfig.js. Usando banco local para demonstração.');
    return await createLocalUser(username.trim(), cleanUsername, password);
  }

  // 2. MODO ATUAL: Firebase Authentication + Cloud Firestore
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

    // Salva os dados complementares no Firestore (permite login por username ou e-mail)
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      username: cleanUsername,
      displayName: username.trim(),
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    });

    return {
      id: firebaseUser.uid,
      name: username.trim(),
      username: cleanUsername,
      email: cleanEmail,
    };
  } catch (error) {
    throw new Error(parseFirebaseError(error));
  }
}

/**
 * Autentica o usuário (Tela "Bem-vindo!")
 * Aceita tanto o e-mail quanto o nome de usuário no campo "Usuário"
 */
export async function loginUser({ identifier, password }) {
  const cleanIdentifier = identifier.trim().toLowerCase();

  // 1. MODO FUTURO: API Backend Própria (REST)
  if (AUTH_MODE === 'BACKEND_API') {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: cleanIdentifier,
        password,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Credenciais inválidas.');
    }
    return data.user;
  }

  // Fallback automático caso as chaves do Firebase ainda não tenham sido coladas
  if (!isFirebaseConfigured) {
    console.warn('Firebase ainda não configurado em firebaseConfig.js. Usando banco local para demonstração.');
    const localUser = await authLocalUser(cleanIdentifier, password);
    if (!localUser) {
      throw new Error('Usuário ou senha incorretos.');
    }
    return localUser;
  }

  // 2. MODO ATUAL: Firebase Authentication + Cloud Firestore
  try {
    let emailToLogin = cleanIdentifier;

    // Se o usuário digitou o "username" (sem @) em vez do e-mail, busca o e-mail correspondente no Firestore
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

    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || cleanIdentifier,
      username: cleanIdentifier,
      email: firebaseUser.email,
    };
  } catch (error) {
    throw new Error(parseFirebaseError(error));
  }
}

/**
 * Encerra a sessão do usuário
 */
export async function logoutUser() {
  if (AUTH_MODE === 'FIREBASE' && isFirebaseConfigured) {
    await signOut(auth);
  }
}