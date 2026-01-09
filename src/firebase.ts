// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDOBYxFe-2X-8z_ytDWuxkHJ9Hcd4YseU4",
    authDomain: "twin-path-fire.firebaseapp.com",
    projectId: "twin-path-fire",
    storageBucket: "twin-path-fire.firebasestorage.app",
    messagingSenderId: "706389807344",
    appId: "1:706389807344:web:0f0b9e03761c328f00b235",
    measurementId: "G-BNSQWX0F5M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {app, auth}