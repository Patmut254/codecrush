import { useState, useEffect, useCallback } from 'react';
import { getAnonymousUserId, loadProgress, saveProgress } from '../data/progressService';

/**
 * Loads/saves a player's progress for the given difficulty tier.
 * Falls back to localStorage automatically if Firebase isn't configured.
 */
export function useFirebaseProgress(difficulty) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      const id = getAnonymousUserId();
      const saved = await loadProgress(id, difficulty);
      if (!cancelled) {
        setUserId(id);
        setProgress(saved || { currentLevel: 0, totalStars: 0, lives: 5 });
        setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [difficulty]);

  const persistProgress = useCallback(
    async (level, stars, lives) => {
      if (!userId) return;
      await saveProgress(userId, difficulty, level, stars, lives);
      setProgress({ currentLevel: level, totalStars: stars, lives });
    },
    [userId, difficulty]
  );

  return { progress, saveProgress: persistProgress, loading, userId };
}
