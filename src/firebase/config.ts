// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCITMvOluen00KbDP6LnsY7dvgpMEtaNIA",
  authDomain: "tripflow-app-mobile.firebaseapp.com",
  projectId: "tripflow-app-mobile",
  storageBucket: "tripflow-app-mobile.firebasestorage.app",
  messagingSenderId: "715625582180",
  appId: "1:715625582180:web:bbd46e5a130ddf61255971"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export default app;