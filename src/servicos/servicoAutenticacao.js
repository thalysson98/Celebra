import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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
import { autenticacao, bancoDados, firebaseEstaConfigurado } from '../configuracao/configuracaoFirebase';
import { obterPerfilUsuario } from './servicoUsuario';

function traduzirErroFirebase(erro) {
  const codigo = erro?.code || '';
  switch (codigo) {
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
      return erro?.message || 'Ocorreu um erro inesperado na autenticação.';
  }
}

export async function registrarUsuario({ username, email, password }) {
  if (!firebaseEstaConfigurado) {
    throw new Error('Configure as chaves do Firebase no arquivo src/configuracao/configuracaoFirebase.js.');
  }

  const nomeUsuarioLimpo = username.trim().toLowerCase();
  const emailLimpo = email.trim().toLowerCase();

  try {
    const refUsuarios = collection(bancoDados, 'users');
    const consulta = query(refUsuarios, where('username', '==', nomeUsuarioLimpo));
    const snapshot = await getDocs(consulta);

    if (!snapshot.empty) {
      throw new Error('Este nome de usuário já está em uso. Escolha outro.');
    }

    const credencialUsuario = await createUserWithEmailAndPassword(autenticacao, emailLimpo, password);
    const usuarioFirebase = credencialUsuario.user;

    await updateProfile(usuarioFirebase, { displayName: username.trim() });

    await setDoc(doc(bancoDados, 'users', usuarioFirebase.uid), {
      uid: usuarioFirebase.uid,
      username: nomeUsuarioLimpo,
      displayName: username.trim(),
      email: emailLimpo,
      cpf: '',
      phone: '',
      city: '',
      notificationPreferences: {
        eventsAndTeam: true,
        clientPayments: true,
      },
      role: 'organizer',
      companyId: null,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      uid: usuarioFirebase.uid,
      id: usuarioFirebase.uid,
      name: username.trim(),
      username: nomeUsuarioLimpo,
      email: emailLimpo,
      cpf: '',
      phone: '',
      city: '',
      notificationPreferences: {
        eventsAndTeam: true,
        clientPayments: true,
      },
      role: 'organizer',
      companyId: null,
      active: true,
    };
  } catch (erro) {
    throw new Error(traduzirErroFirebase(erro));
  }
}

export const registerUser = registrarUsuario;

export async function autenticarUsuario({ identifier, password }) {
  if (!firebaseEstaConfigurado) {
    throw new Error('Configure as chaves do Firebase no arquivo src/configuracao/configuracaoFirebase.js.');
  }

  const identificadorLimpo = identifier.trim().toLowerCase();

  try {
    let emailParaLogin = identificadorLimpo;

    if (!identificadorLimpo.includes('@')) {
      const refUsuarios = collection(bancoDados, 'users');
      const consulta = query(refUsuarios, where('username', '==', identificadorLimpo));
      const snapshot = await getDocs(consulta);

      if (snapshot.empty) {
        throw new Error('Usuário não encontrado. Verifique o nome digitado ou use seu e-mail.');
      }

      const dadosUsuario = snapshot.docs[0].data();
      emailParaLogin = dadosUsuario.email;
    }

    const credencialUsuario = await signInWithEmailAndPassword(autenticacao, emailParaLogin, password);
    return obterPerfilUsuario(credencialUsuario.user);
  } catch (erro) {
    throw new Error(traduzirErroFirebase(erro));
  }
}

export const loginUser = autenticarUsuario;

export async function desconectarUsuario() {
  if (firebaseEstaConfigurado) {
    await signOut(autenticacao);
  }
}

export const logoutUser = desconectarUsuario;

export async function solicitarRedefinicaoSenha(email) {
  if (!firebaseEstaConfigurado) {
    throw new Error('Configure as chaves do Firebase no arquivo src/configuracao/configuracaoFirebase.js.');
  }
  if (!email?.trim()) throw new Error('Não há um e-mail associado a esta conta.');

  try {
    await sendPasswordResetEmail(autenticacao, email.trim().toLowerCase());
  } catch (erro) {
    throw new Error(traduzirErroFirebase(erro));
  }
}

export const requestPasswordReset = solicitarRedefinicaoSenha;
