// Firebase setup — Realtime Database + anonymous auth.
// Fill in your project's values in a .env file (see .env.example).

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get, set, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialize once a real API key is present, so the game still runs
// locally (with progress saved to localStorage) before Firebase is configured.
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
