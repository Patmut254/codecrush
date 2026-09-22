const WORD_SEARCH_DIRECTIONS = [
  { dr: 0, dc: 1 }, // right
  { dr: 1, dc: 0 }, // down
  { dr: 1, dc: 1 }, // diagonal down-right
  { dr: 1, dc: -1 }, // diagonal down-left
];

function randomLetter() {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

function tryPlace(grid, size, letters, startR, startC, dir) {
  for (let i = 0; i < letters.length; i++) {
    const r = startR + dir.dr * i;
    const c = startC + dir.dc * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    const existing = grid[r][c];
    if (existing !== null && existing !== letters[i]) return false;
  }
  return true;
}

function place(grid, letters, startR, startC, dir) {
  for (let i = 0; i < letters.length; i++) {
    grid[startR + dir.dr * i][startC + dir.dc * i] = letters[i];
  }
}

/**
 * Builds a word-search grid containing every word in `words`, in random
 * directions (horizontal, vertical, both diagonals — forward only, no
 * reversed words, to keep it approachable). Retries with a bigger grid if a
 * word can't be placed, so every word is always findable.
 */
export function generateWordSearch(words) {
  const longest = words.reduce((m, w) => Math.max(m, w.word.length), 0);
  let size = Math.max(longest + 3, 9);

  for (let gridAttempt = 0; gridAttempt < 6; gridAttempt++) {
    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
    let ok = true;

    for (const w of sorted) {
      const letters = w.word.split('');
      let placed = false;

      // Random attempts first.
      for (let attempt = 0; attempt < 300 && !placed; attempt++) {
        const dir = WORD_SEARCH_DIRECTIONS[Math.floor(Math.random() * WORD_SEARCH_DIRECTIONS.length)];
        const startR = Math.floor(Math.random() * size);
        const startC = Math.floor(Math.random() * size);
        if (tryPlace(grid, size, letters, startR, startC, dir)) {
          place(grid, letters, startR, startC, dir);
          placed = true;
        }
      }

      // Exhaustive fallback so a valid placement is never missed unnecessarily.
      if (!placed) {
        outer: for (const dir of WORD_SEARCH_DIRECTIONS) {
          for (let r = 0; r < size && !placed; r++) {
            for (let c = 0; c < size && !placed; c++) {
              if (tryPlace(grid, size, letters, r, c, dir)) {
                place(grid, letters, r, c, dir);
                placed = true;
                break outer;
              }
            }
          }
        }
      }

      if (!placed) {
        ok = false;
        break;
      }
    }

    if (ok) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === null) grid[r][c] = randomLetter();
        }
      }
      return { grid, size };
    }

    size += 2; // grid was too tight — grow and retry
  }

  throw new Error('Could not generate a word search grid for this word set.');
}

/** Splits a word list into fixed-size chunks (used to make word-search puzzle rounds). */
export function chunkWords(words, size) {
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size));
  }
  return chunks;
}

export function getShuffledLetters(wordStr) {
  const word = wordStr.split('');
  const extraLetters = Math.max(9 - word.length, 0);
  const allLetters = [...word];

  for (let i = 0; i < extraLetters; i++) {
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    if (!allLetters.includes(randomLetter) || Math.random() > 0.5) {
      allLetters.push(randomLetter);
    }
  }

  return allLetters.sort(() => Math.random() - 0.5);
}
