// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC4W5Uxu106A8RDyp45h43xCVHNqFFQ4U4",
  authDomain: "service-ae5f5.firebaseapp.com",
  projectId: "service-ae5f5",
  storageBucket: "service-ae5f5.firebasestorage.app",
  messagingSenderId: "670848591176",
  appId: "1:670848591176:web:616ab30d003a3219043f7d",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
