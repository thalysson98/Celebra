import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { autenticacao, bancoDados, firebaseEstaConfigurado } from '../configuracao/configuracaoFirebase';
import { obterPerfilUsuario } from './servicoUsuario';

function traduzirErroFirebase(erro) {
  const codigo = erro?.code || '';
  switch (codigo) {
    case 'auth/email-already-in-use': return 'Este e-mail já está cadastrado em outra conta.';
    case 'auth/invalid-email': return 'O formato do e-mail digitado é inválido.';
    case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests': return 'Muitas tentativas seguidas. Aguarde um momento e tente novamente.';
    case 'auth/network-request-failed': return 'Não foi possível conectar ao Firebase. Verifique sua internet e tente novamente.';
    case 'auth/operation-not-allowed': return 'O login por e-mail e senha está desativado no Firebase Authentication.';
    case 'auth/configuration-not-found': return 'O provedor de autenticação do Firebase não está configurado.';
    case 'permission-denied': return 'O cadastro foi bloqueado pelas regras do banco. Publique as regras atuais do Firestore e tente novamente.';
    default: return erro?.message || 'Ocorreu um erro inesperado na autenticação.';
  }
}

function validarNome(nome) {
  const nomeLimpo = String(nome || '').trim().replace(/\s+/g, ' ');
  if (nomeLimpo.length < 2) throw new Error('Informe seu nome completo.');
  if (nomeLimpo.length > 120) throw new Error('O nome completo deve ter no máximo 120 caracteres.');
  return nomeLimpo;
}

function dadosPerfilInicial(uid, nome, email) {
  return {
    id_usuario: uid,
    nome_completo: nome,
    email,
    telefone: '',
    papel: false,
    id_empresa: null,
    ativo: true,
    criado_em: serverTimestamp(),
  };
}

function perfilInicialParaSessao(uid, nome, email) {
  return {
    uid,
    id: uid,
    name: nome,
    displayName: nome,
    email,
    papel: false,
    idEmpresa: null,
    companyId: null,
    ativo: true,
    active: true,
    profileStatus: 'pendente_vinculo',
  };
}

export async function registrarUsuario({ nomeCompleto, username, email, password }) {
  if (!firebaseEstaConfigurado) throw new Error('Configure as chaves do Firebase no arquivo src/configuracao/configuracaoFirebase.js.');
  const nomeLimpo = validarNome(nomeCompleto || username);
  const emailLimpo = String(email || '').trim().toLowerCase();

  let usuarioCriado = null;
  try {
    const credencialUsuario = await createUserWithEmailAndPassword(autenticacao, emailLimpo, password);
    const usuarioFirebase = credencialUsuario.user;
    usuarioCriado = usuarioFirebase;
    await updateProfile(usuarioFirebase, { displayName: nomeLimpo });
    await setDoc(doc(bancoDados, 'usuarios', usuarioFirebase.uid), dadosPerfilInicial(usuarioFirebase.uid, nomeLimpo, emailLimpo));
    return perfilInicialParaSessao(usuarioFirebase.uid, nomeLimpo, emailLimpo);
  } catch (erro) {
    // Se o Auth já tinha a conta, mas o documento usuarios foi apagado,
    // recupera o cadastro usando a senha informada e recria somente o perfil.
    if (erro?.code === 'auth/email-already-in-use') {
      try {
        const credencialExistente = await signInWithEmailAndPassword(autenticacao, emailLimpo, password);
        const perfilExistente = await obterPerfilUsuario(credencialExistente.user);
        if (perfilExistente.profileStatus === 'perfil_nao_cadastrado' || perfilExistente.ativo !== true) {
          await updateProfile(credencialExistente.user, { displayName: nomeLimpo });
          await setDoc(doc(bancoDados, 'usuarios', credencialExistente.user.uid), dadosPerfilInicial(credencialExistente.user.uid, nomeLimpo, emailLimpo));
          return perfilInicialParaSessao(credencialExistente.user.uid, nomeLimpo, emailLimpo);
        }
        await signOut(autenticacao);
      } catch {
        await signOut(autenticacao);
      }
    }
    // Se a conta Auth foi criada, mas o perfil não pôde ser salvo, desfaz a
    // conta parcial para permitir que o mesmo e-mail tente se cadastrar de novo.
    if (usuarioCriado) {
      try {
        await deleteUser(usuarioCriado);
      } catch {
        // A mensagem original é mais útil para o usuário neste momento.
      }
    }
    throw new Error(erro.message?.startsWith('Informe ') ? erro.message : traduzirErroFirebase(erro));
  }
}

export const registerUser = registrarUsuario;

export async function autenticarUsuario({ identifier, password }) {
  if (!firebaseEstaConfigurado) throw new Error('Configure as chaves do Firebase no arquivo src/configuracao/configuracaoFirebase.js.');
  const email = String(identifier || '').trim().toLowerCase();
  if (!email.includes('@')) throw new Error('Use o e-mail cadastrado para entrar.');
  try {
    const credencialUsuario = await signInWithEmailAndPassword(autenticacao, email, password);
    const perfil = await obterPerfilUsuario(credencialUsuario.user);

    // A conta do Authentication só pode acessar o app se o perfil oficial
    // também existir e estiver ativo no Firestore.
    if (!['ready', 'pendente_vinculo'].includes(perfil.profileStatus) || perfil.ativo !== true) {
      await signOut(autenticacao);
      throw new Error('Esta conta não possui um perfil ativo no Celebra. Procure o administrador.');
    }

    return perfil;
  } catch (erro) {
    if (erro.message === 'Esta conta não possui um perfil ativo no Celebra. Procure o administrador.') {
      throw erro;
    }
    throw new Error(traduzirErroFirebase(erro));
  }
}

export const loginUser = autenticarUsuario;

export async function desconectarUsuario() {
  if (firebaseEstaConfigurado) await signOut(autenticacao);
}

export const logoutUser = desconectarUsuario;

export async function solicitarRedefinicaoSenha(email) {
  if (!firebaseEstaConfigurado) throw new Error('Configure as chaves do Firebase no arquivo src/configuracao/configuracaoFirebase.js.');
  if (!email?.trim()) throw new Error('Não há um e-mail associado a esta conta.');
  try {
    await sendPasswordResetEmail(autenticacao, email.trim().toLowerCase());
  } catch (erro) {
    throw new Error(traduzirErroFirebase(erro));
  }
}

export const requestPasswordReset = solicitarRedefinicaoSenha;
