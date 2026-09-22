import { db, isConfigured, ref, set, get, update } from '../firebase';

/**
 * Persistent anonymous player id, stored in localStorage.
 * No login required — matches the original game's design.
 */
export function getAnonymousUserId() {
  let userId = localStorage.getItem('code-crush-user-id');
  if (!userId) {
    userId = 'anonymous_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('code-crush-user-id', userId);
  }
  return userId;
}

/** Save player progress for a difficulty tier. */
export async function saveProgress(userId, difficulty, level, stars, lives) {
  const payload = { currentLevel: level, totalStars: stars, lives, lastUpdated: Date.now() };

  if (!isConfigured) {
    localStorage.setItem(`code-crush-progress-${difficulty}`, JSON.stringify(payload));
    return;
  }

  try {
    await update(ref(db, `users/${userId}/progress/${difficulty}`), payload);
  } catch (error) {
    console.error('Error saving progress to Firebase:', error);
    localStorage.setItem(`code-crush-progress-${difficulty}`, JSON.stringify(payload));
  }
}

/** Load player progress for a difficulty tier. */
export async function loadProgress(userId, difficulty) {
  if (!isConfigured) {
    const raw = localStorage.getItem(`code-crush-progress-${difficulty}`);
    return raw ? JSON.parse(raw) : null;
  }

  try {
    const snapshot = await get(ref(db, `users/${userId}/progress/${difficulty}`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error loading progress from Firebase:', error);
    return null;
  }
}

/** Mark a word as completed (for stats/history). */
export async function markWordComplete(userId, difficulty, wordIndex) {
  if (!isConfigured) return;
  try {
    await set(ref(db, `users/${userId}/completedWords/${difficulty}/${wordIndex}`), {
      completedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error marking word complete:', error);
  }
}
