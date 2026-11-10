import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const configuracaoFirebase = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validação para checar se as variáveis foram carregadas
export const firebaseEstaConfigurado = Boolean(
  configuracaoFirebase.apiKey &&
  configuracaoFirebase.projectId
);
export const isFirebaseConfigured = firebaseEstaConfigurado;

// Evita inicializar o Firebase repetidas vezes durante o Fast Refresh do Expo
const app = getApps().length === 0 ? initializeApp(configuracaoFirebase) : getApp();

export const autenticacao = getAuth(app);
export const auth = autenticacao;

export const bancoDados = getFirestore(app);
export const db = bancoDados;

export default app;