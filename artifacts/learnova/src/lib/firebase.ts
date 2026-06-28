import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0973405273",
  appId: "1:667148609183:web:8b579d0b6c4e26806e64aa",
  apiKey: "AIzaSyCmPFZj77OCqDb63MBo_bJSbQQBn_0tgIM",
  authDomain: "gen-lang-client-0973405273.firebaseapp.com",
  storageBucket: "gen-lang-client-0973405273.firebasestorage.app",
  messagingSenderId: "667148609183",
  measurementId: ""
};

const firestoreDatabaseId = "ai-studio-0f069908-45e0-4658-9690-7540d97cad42";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);
