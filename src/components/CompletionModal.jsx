import { CelebrationIcon, StarGlyph } from './Icons.jsx';

/**
 * Shown when a word (Drag Build) or a whole puzzle (Trace Draw) is completed.
 * Stays open until the player taps the button — nothing here auto-dismisses,
 * so there's always time to read the definition.
 */
export default function CompletionModal({
  title = 'Great job!',
  subtitle,
  starsEarned = 0,
  word,
  definition,
  onNext,
  nextLabel = 'Next Level',
}) {
  return (
    <div className="celebration">
      <div className="celebration-content completion-card">
        <CelebrationIcon />
        <div className="celebration-text">{title}</div>
        {subtitle && <div className="completion-subtitle">{subtitle}</div>}

        {word && (
          <div className="completion-word-block">
            <div className="definition-word">{word}</div>
            {definition && <div className="definition-text">{definition}</div>}
          </div>
        )}

        <div className="celebration-stars">
          {[...Array(starsEarned)].map((_, i) => (
            <StarGlyph key={i} delay={i * 0.08} />
          ))}
        </div>

        <button className="btn btn-primary celebration-next" onClick={onNext}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
