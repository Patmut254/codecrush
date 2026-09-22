import WordSearchMode from './WordSearchMode.jsx';
import WordBuilderMode from './WordBuilderMode.jsx';
import { BackIcon, HeartIcon, SkipIcon, StarIcon } from './Icons.jsx';
import logo from '../assets/code-crush-logo.png';

export default function GameScreen({
  difficulty,
  mode,
  currentWord,
  puzzleWords,
  currentLevel,
  stars,
  lives,
  onBack,
  onWordComplete,
  onWordFound,
  onAllFound,
  onSkip,
}) {
  return (
    <div className="screen game-screen">
      <div className="header">
        <button className="back-btn" onClick={onBack}>
          <BackIcon /> Back
        </button>
        <img src={logo} alt="Code Crush" className="header-logo" />
        <div className="header-stats">
          <div className="stat">
            <StarIcon />
            <span>{stars}</span>
          </div>
          <div className="stat">
            <HeartIcon />
            <span>{lives}</span>
          </div>
        </div>
      </div>

      <div className="level-badge-row">
        <div className="level-badge">
          {mode === 'hex' ? `Puzzle ${currentLevel + 1}` : `Level ${currentLevel + 1}`} • {difficulty.toUpperCase()}
        </div>
      </div>

      <div className="game-container">
        {mode === 'builder' && (
          <div className="word-target">
            <div className="word-hint">Hint: {currentWord.hint}</div>
          </div>
        )}

        {mode === 'hex' ? (
          <WordSearchMode
            key={currentLevel}
            puzzleWords={puzzleWords}
            onWordFound={onWordFound}
            onAllFound={onAllFound}
          />
        ) : (
          <WordBuilderMode key={currentWord.word} word={currentWord} onComplete={onWordComplete} />
        )}
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onSkip}>
          <SkipIcon /> Skip
        </button>
      </div>
    </div>
  );
}
