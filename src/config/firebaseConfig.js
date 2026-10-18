import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Substitua pelos dados reais do seu projeto no Console do Firebase:
// Configurações do Projeto > Geral > Seus aplicativos > App da Web (</>)
const firebaseConfig = {
  apiKey: 'SUA_API_KEY_AQUI',
  authDomain: 'seu-projeto.firebaseapp.com',
  projectId: 'seu-projeto-id',
  storageBucket: 'seu-projeto.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:000000000000',
};

// Verifica se o usuário já preencheu as chaves reais do Firebase
export const isFirebaseConfigured =
  firebaseConfig.apiKey && firebaseConfig.apiKey !== 'SUA_API_KEY_AQUI';

// Evita inicializar o Firebase mais de uma vez durante o Fast Refresh do Expo
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;