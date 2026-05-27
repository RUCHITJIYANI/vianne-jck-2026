// Firebase project: vianne-b84a8
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDlokoRSQ2TPlNDnOnmNhqPdQtPMdwhegE",
  authDomain: "vianne-b84a8.firebaseapp.com",
  databaseURL: "https://vianne-b84a8-default-rtdb.firebaseio.com",
  projectId: "vianne-b84a8",
  storageBucket: "vianne-b84a8.firebasestorage.app",
  messagingSenderId: "1050978919701",
  appId: "1:1050978919701:web:6f0e5129a9f1bf1bf4751c",
};

// Password for admin.html only — change this to something private
const ADMIN_PASSWORD = "Vianne-Lathiya";

function isFirebaseConfigured() {
  return (
    FIREBASE_CONFIG.databaseURL &&
    !FIREBASE_CONFIG.databaseURL.includes("YOUR_PROJECT")
  );
}
