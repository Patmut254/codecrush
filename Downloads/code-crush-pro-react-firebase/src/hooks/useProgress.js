import { useEffect, useState, useCallback } from 'react';
import { isConfigured, ensureSignedIn, saveProgress, loadProgress, markWordComplete } from '../firebase.js';

const LOCAL_KEY = 'code-crush-progress';

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {};
  } catch {
    return {};
  }
}

function writeLocal(all) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable — progress just won't persist
  }
}

/**
 * Tracks stars/lives/level per difficulty. Uses Firebase Realtime Database
 * (anonymous auth) when configured, otherwise falls back to localStorage
 * so the game is fully playable without any setup.
 */
export function useProgress() {
  const [userId, setUserId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureSignedIn()
      .then((uid) => {
        if (!cancelled) {
          setUserId(uid);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true); // fall back to local storage
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getProgress = useCallback(
    async (difficulty) => {
      if (isConfigured && userId) {
        const remote = await loadProgress(userId, difficulty);
        if (remote) return remote;
      }
      return readLocal()[difficulty] || { currentLevel: 0, totalStars: 0, lives: 5 };
    },
    [userId]
  );

  const setProgress = useCallback(
    async (difficulty, progress) => {
      const all = readLocal();
      all[difficulty] = progress;
      writeLocal(all);

      if (isConfigured && userId) {
        saveProgress(userId, difficulty, progress).catch(() => {});
      }
    },
    [userId]
  );

  const completeWord = useCallback(
    (difficulty, wordIndex) => {
      if (isConfigured && userId) {
        markWordComplete(userId, difficulty, wordIndex).catch(() => {});
      }
    },
    [userId]
  );

  return { ready, isConfigured, userId, getProgress, setProgress, completeWord };
}
