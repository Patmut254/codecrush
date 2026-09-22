// Firebase setup — Realtime Database + anonymous auth.
// Fill in your project's values in a .env file (see .env.example).

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get, set, update } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC-esuf9QingXXaNqZHl5qNMGhaAVWMp4c",
  authDomain: "codecrush-2b7f4.firebaseapp.com",
  projectId: "codecrush-2b7f4",
  storageBucket: "codecrush-2b7f4.firebasestorage.app",
  messagingSenderId: "688994880932",
  appId: "1:688994880932:web:ab9fe9af0bdef236f14531",
  measurementId: "G-1QRGTFZ7D1"
};


// const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const isConfigured = Boolean(firebaseConfig.apiKey);

let app = null;
let auth = null;
let db = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
}

/** Resolves once an anonymous Firebase user is signed in. Returns the uid. */
function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    if (!isConfigured) return resolve(null);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) return resolve(user.uid);
        signInAnonymously(auth)
          .then((cred) => resolve(cred.user.uid))
          .catch(reject);
      },
      reject
    );
  });
}

async function saveProgress(userId, difficulty, progress) {
  if (!isConfigured || !userId) return;
  await update(ref(db, `users/${userId}/progress/${difficulty}`), {
    ...progress,
    lastUpdated: Date.now(),
  });
}

async function loadProgress(userId, difficulty) {
  if (!isConfigured || !userId) return null;
  const snapshot = await get(ref(db, `users/${userId}/progress/${difficulty}`));
  return snapshot.exists() ? snapshot.val() : null;
}

async function markWordComplete(userId, difficulty, wordIndex) {
  if (!isConfigured || !userId) return;
  await set(ref(db, `users/${userId}/completedWords/${difficulty}/${wordIndex}`), {
    completedAt: Date.now(),
  });
}

export { isConfigured, ensureSignedIn, saveProgress, loadProgress, markWordComplete };
