import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import firebaseConfigLocal from '../../firebase-applet-config.json' with { type: "json" };

const getEnv = (key) => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== "undefined" && import.meta && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
};

export const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY") || firebaseConfigLocal.apiKey,
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN") || firebaseConfigLocal.authDomain,
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID") || firebaseConfigLocal.projectId,
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET") || firebaseConfigLocal.storageBucket,
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || firebaseConfigLocal.messagingSenderId,
  appId: getEnv("VITE_FIREBASE_APP_ID") || firebaseConfigLocal.appId,
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID") || firebaseConfigLocal.measurementId
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

