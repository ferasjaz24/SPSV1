import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, doc, getDocs, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfigLocal from "../firebase-applet-config.json";

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
  appId: getEnv("VITE_FIREBASE_APP_ID") || firebaseConfigLocal.appId
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);

const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dbServer = {
  getAll: async (coll) => {
    try {
      const snap = await getDocs(collection(db, coll));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, coll);
    }
  },
  create: async (coll, data) => {
    try {
      if (data.id) {
        const id = data.id; const clean = { ...data }; delete clean.id;
        await setDoc(doc(db, coll, id), clean, { merge: true });
        return { id, ...clean };
      }
      const docRef = await addDoc(collection(db, coll), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, coll);
    }
  },
  update: async (coll, id, data) => {
    try {
      const clean = { ...data }; delete clean.id;
      await setDoc(doc(db, coll, id), clean, { merge: true });
      return { id, ...clean };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${coll}/${id}`);
    }
  },
  delete: async (coll, id) => {
    try {
      await deleteDoc(doc(db, coll, id));
      return { id, success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${coll}/${id}`);
    }
  }
};
