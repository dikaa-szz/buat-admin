import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDI3zI4YY87LvRmaOWvsctI8Oxr2ZRuJWQ",
  authDomain: "app-pelaporan-61fea.firebaseapp.com",
  projectId: "app-pelaporan-61fea",
  storageBucket: "app-pelaporan-61fea.appspot.com",  
  messagingSenderId: "266840291575",
  appId: "1:266840291575:web:b11a8ef4567d98e76cfbf2",
  measurementId: "G-6027TCD1VL"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
