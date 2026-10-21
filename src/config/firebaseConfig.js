import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyADBXwE5oe3VNLgU_2pPuvG8ybpPxaasHU',
  authDomain: 'celebra-c8f9e.firebaseapp.com',
  projectId: 'celebra-c8f9e',
  storageBucket: 'celebra-c8f9e.firebasestorage.app',
  messagingSenderId: '564146291409',
  appId: '1:564146291409:web:0dd4a7f9b531ee83cbbbf0',
};

// Verifica se o usuário já preencheu as chaves reais do Firebase
export const isFirebaseConfigured =
  firebaseConfig.apiKey && firebaseConfig.apiKey !== 'SUA_API_KEY_AQUI';

// Evita inicializar o Firebase mais de uma vez durante o Fast Refresh do Expo
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;