import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDFeGuAE_Ec0LF9V7PBoGvbZQ5WyqnV-Eg",
    authDomain: "ahmed-ref3t-platform.firebaseapp.com",
    databaseURL: "https://ahmed-ref3t-platform-default-rtdb.firebaseio.com",
    projectId: "ahmed-ref3t-platform",
    storageBucket: "ahmed-ref3t-platform.firebasestorage.app",
    messagingSenderId: "941374495002",
    appId: "1:941374495002:web:a8b9f81c89da58748034a3",
    measurementId: "G-TS7B6ED7NK"
};

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const analytics: Analytics = getAnalytics(app);
export const db = getDatabase(app, firebaseConfig.databaseURL);
