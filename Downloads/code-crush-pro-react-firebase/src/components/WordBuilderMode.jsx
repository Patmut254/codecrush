import { useMemo, useState } from 'react';
import { getShuffledLetters } from '../utils.js';

export default function WordBuilderMode({ word, onComplete }) {
  const letters = useMemo(() => getShuffledLetters(word.word), [word]);
  const [slots, setSlots] = useState(Array(word.word.length).fill(null));
  const [used, setUsed] = useState(new Set());

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('index', String(index));
    e.dataTransfer.setData('letter', letters[index]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, position) => {
    e.preventDefault();
    const index = parseInt(e.dataTransfer.getData('index'), 10);
    const letter = e.dataTransfer.getData('letter');
    if (Number.isNaN(index) || used.has(index)) return;

    const newSlots = [...slots];
    newSlots[position] = letter;
    setSlots(newSlots);
    setUsed((prev) => new Set(prev).add(index));

    if (newSlots.join('') === word.word) {
      onComplete();
    }
  };

  return (
    <div className="word-builder">
      <div className="target-slots" onDragOver={handleDragOver}>
        {slots.map((letter, i) => (
          <div
            key={i}
            className={`letter-slot ${!letter ? 'empty' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, i)}
          >
            {letter}
          </div>
        ))}
      </div>
      <div className="draggable-letters">
        {letters.map((letter, i) => (
          <div
            key={i}
            className={`draggable-tile ${used.has(i) ? 'used' : ''}`}
            draggable={!used.has(i)}
            onDragStart={(e) => handleDragStart(e, i)}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
}
