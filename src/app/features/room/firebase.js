import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD4fu2LV3hTtijtFcBZsEVgVUy5rcQFI_0",
    authDomain: "pingpong-posts.firebaseapp.com",
    projectId: "pingpong-posts",
    storageBucket: "pingpong-posts.appspot.com",
    messagingSenderId: "853509972860",
    appId: "1:853509972860:web:6cb20d97eec83704227af9",
    measurementId: "G-WBX0GND8T4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

export { db };