import { useEffect, useMemo, useState } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import CompletionModal from './components/CompletionModal.jsx';
import { wordDatabase } from './data/wordDatabase.js';
import { useProgress } from './hooks/useProgress.js';
import { chunkWords } from './utils.js';

const WORDS_PER_PUZZLE = 5; // how many words appear in one Word Search grid

export default function App() {
  const { setProgress, completeWord } = useProgress();

  const [screen, setScreen] = useState('home');
  const [mode, setMode] = useState('hex');
  const [difficulty, setDifficulty] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [stars, setStars] = useState(0);
  const [lives, setLives] = useState(5);
  const [completion, setCompletion] = useState(null); // props for CompletionModal, or null

  const words = difficulty ? wordDatabase[difficulty] : [];

  // Memoized so the array reference only changes when the difficulty/mode
  // actually changes — not on every re-render (e.g. a star count update).
  // Otherwise WordSearchMode sees a "new" puzzleWords prop on every find and
  // rebuilds the whole grid mid-puzzle, scrambling letters that were already
  // in place.
  const puzzles = useMemo(
    () => (mode === 'hex' ? chunkWords(words, WORDS_PER_PUZZLE) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, difficulty]
  );
  const puzzleWords = puzzles.length ? puzzles[currentLevel % puzzles.length] : [];
  const currentWord = mode === 'builder' && words.length ? words[currentLevel % words.length] : null;

  // Keep saved progress (Firebase or localStorage) in sync whenever it changes,
  // instead of computing it by hand inside each handler.
  useEffect(() => {
    if (screen === 'game' && difficulty) {
      setProgress(difficulty, { currentLevel, totalStars: stars, lives });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, currentLevel, stars, lives, screen]);

  const startGame = (diff) => {
    setDifficulty(diff);
    setCurrentLevel(0);
    setStars(0);
    setLives(5);
    setCompletion(null);
    setScreen('game');
  };

  // ----- Word Builder (single word per level) -----
  const handleWordComplete = () => {
    const earned = 3;
    setStars((s) => s + earned);
    completeWord(difficulty, currentLevel % words.length);

    setCompletion({
      title: 'Great job!',
      starsEarned: earned,
      word: currentWord.word,
      definition: currentWord.definition,
    });
  };

  // ----- Word Search (several words per puzzle) -----
  const handleWordFound = (word) => {
    setStars((s) => s + 1); // small immediate reward for every word found
    completeWord(difficulty, words.indexOf(word));
  };

  const handleAllFound = () => {
    setCompletion({
      title: 'Puzzle solved!',
      subtitle: `You found all ${puzzleWords.length} words.`,
      starsEarned: puzzleWords.length,
    });
  };

  const nextLevel = () => {
    setCompletion(null);
    setCurrentLevel((c) => c + 1);
  };

  const skipLevel = () => {
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      alert('Game Over! You ran out of lives.');
      setScreen('home');
      return;
    }
    setCurrentLevel((c) => c + 1);
  };

  const noPuzzleReady = mode === 'builder' ? !currentWord : !puzzleWords.length;
  if (screen === 'home' || noPuzzleReady) {
    return <HomeScreen mode={mode} setMode={setMode} onStart={startGame} />;
  }

  return (
    <>
      <GameScreen
        difficulty={difficulty}
        mode={mode}
        currentWord={currentWord}
        puzzleWords={puzzleWords}
        currentLevel={currentLevel}
        stars={stars}
        lives={lives}
        onBack={() => setScreen('home')}
        onWordComplete={handleWordComplete}
        onWordFound={handleWordFound}
        onAllFound={handleAllFound}
        onSkip={skipLevel}
      />

      {completion && (
        <CompletionModal
          title={completion.title}
          subtitle={completion.subtitle}
          starsEarned={completion.starsEarned}
          word={completion.word}
          definition={completion.definition}
          nextLabel={mode === 'hex' ? 'Next Puzzle' : 'Next Level'}
          onNext={nextLevel}
        />
      )}
    </>
  );
}
