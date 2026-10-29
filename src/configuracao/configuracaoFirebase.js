import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const configuracaoFirebase = {
  apiKey: 'AIzaSyADBXwE5oe3VNLgU_2pPuvG8ybpPxaasHU',
  authDomain: 'celebra-c8f9e.firebaseapp.com',
  projectId: 'celebra-c8f9e',
  storageBucket: 'celebra-c8f9e.firebasestorage.app',
  messagingSenderId: '564146291409',
  appId: '1:564146291409:web:0dd4a7f9b531ee83cbbbf0',
};

// Verifica se as chaves do Firebase estão devidamente preenchidas
export const firebaseEstaConfigurado =
  configuracaoFirebase.apiKey && configuracaoFirebase.apiKey !== 'SUA_API_KEY_AQUI';
export const isFirebaseConfigured = firebaseEstaConfigurado;

// Evita inicializar o Firebase repetidas vezes durante o Fast Refresh do Expo
const app = getApps().length === 0 ? initializeApp(configuracaoFirebase) : getApp();

export const autenticacao = getAuth(app);
export const auth = autenticacao;

export const bancoDados = getFirestore(app);
export const db = bancoDados;
export default app;
