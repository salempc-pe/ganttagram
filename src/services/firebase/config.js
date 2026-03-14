import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug: Verificar si las variables se cargaron (no mostrar valores completos por seguridad)
console.log('Firebase Config Loaded:', {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

if (!firebaseConfig.apiKey) {
  // Lanza un error fatal que será capturado por el Global Error Handler en index.html
  throw new Error(
    "FATAL: Faltan las variables de entorno de Firebase.\n\n" +
    "SOLUCIÓN: Ve a Netlify > Site settings > Environment variables\n" +
    "y agrega las claves VITE_FIREBASE_API_KEY, etc."
  );
}

// Initialize Firebase
console.log('Firebase: Initializing app with initializeApp function:', typeof initializeApp);
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);

// Forzar persistencia local explícita para evitar problemas en entornos nativos (Tauri)
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn("Auth: No se pudo establecer persistencia local", err);
});

export const db = getFirestore(app);

// Exportar utilidades de Firestore desde el mismo archivo que db para evitar conflictos de instancia
export { doc, setDoc, getDoc, getDocs, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, updateDoc };

export default app;
