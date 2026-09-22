import { useEffect, useMemo, useRef, useState } from 'react';
import { generateWordSearch } from '../utils.js';
import { CheckIcon } from './Icons.jsx';

const MAX_CANVAS = 320;
const FOUND_COLORS = ['#6BCB77', '#4D96FF', '#FF9F45', '#9B6DFF', '#FF6B9D', '#4ECDC4'];

export default function WordSearchMode({ puzzleWords, onWordFound, onAllFound }) {
  const { grid, size } = useMemo(() => generateWordSearch(puzzleWords), [puzzleWords]);
  const cellSize = Math.floor(MAX_CANVAS / size);
  const canvasSize = cellSize * size;

  const canvasRef = useRef(null);
  const foundPaths = useRef([]); // [{ cells: [{r,c}], color }]
  const dragCells = useRef([]);
  const dragging = useRef(false);

  const [foundWords, setFoundWords] = useState(new Set());
  const [, forceRedraw] = useState(0);

  useEffect(() => {
    // New puzzle — reset everything.
    foundPaths.current = [];
    dragCells.current = [];
    setFoundWords(new Set());
    setupCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleWords]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  function setupCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpi = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpi;
    canvas.height = canvasSize * dpi;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
    draw();
  }

  function cellCenter(r, c) {
    return { x: c * cellSize + cellSize / 2, y: r * cellSize + cellSize / 2 };
  }

  function drawPathLine(ctx, cells, color, width) {
    if (cells.length < 1) return;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    cells.forEach((cell, i) => {
      const { x, y } = cellCenter(cell.r, cell.c);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    foundPaths.current.forEach((p) => drawPathLine(ctx, p.cells, p.color, cellSize * 0.7));
    if (dragCells.current.length > 1) drawPathLine(ctx, dragCells.current, '#4D96FF', cellSize * 0.7);

    const foundCellKeys = new Set();
    foundPaths.current.forEach((p) => p.cells.forEach((cell) => foundCellKeys.add(`${cell.r},${cell.c}`)));
    const dragCellKeys = new Set(dragCells.current.map((c) => `${c.r},${c.c}`));

    const fontSize = Math.max(10, Math.floor(cellSize * 0.5));
    ctx.font = `bold ${fontSize}px "Baloo 2", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const key = `${r},${c}`;
        const { x, y } = cellCenter(r, c);
        ctx.fillStyle = foundCellKeys.has(key) || dragCellKeys.has(key) ? '#FFFFFF' : '#263238';
        ctx.fillText(grid[r][c], x, y);
      }
    }
  }

  function cellFromPoint(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches && e.touches[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const c = Math.min(size - 1, Math.max(0, Math.floor(x / cellSize)));
    const r = Math.min(size - 1, Math.max(0, Math.floor(y / cellSize)));
    return { r, c };
  }

  function straightLineTo(start, end) {
    const dr = end.r - start.r;
    const dc = end.c - start.c;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (steps === 0) return [start];
    const isStraight = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
    if (!isStraight) return null;
    const stepR = Math.sign(dr);
    const stepC = Math.sign(dc);
    const cells = [];
    for (let i = 0; i <= steps; i++) {
      cells.push({ r: start.r + stepR * i, c: start.c + stepC * i });
    }
    return cells;
  }

  function handleStart(e) {
    e.preventDefault();
    const cell = cellFromPoint(e);
    dragging.current = true;
    dragCells.current = [cell];
    forceRedraw((n) => n + 1);
  }

  function handleMove(e) {
    if (!dragging.current) return;
    e.preventDefault();
    const start = dragCells.current[0];
    const end = cellFromPoint(e);
    const line = straightLineTo(start, end);
    if (line) dragCells.current = line;
    forceRedraw((n) => n + 1);
  }

  function handleEnd(e) {
    if (!dragging.current) return;
    e.preventDefault();
    dragging.current = false;

    const cells = dragCells.current;
    const forward = cells.map(({ r, c }) => grid[r][c]).join('');
    const backward = forward.split('').reverse().join('');

    const match = puzzleWords.find(
      (w) => !foundWords.has(w.word) && (w.word === forward || w.word === backward)
    );

    if (match) {
      const color = FOUND_COLORS[foundPaths.current.length % FOUND_COLORS.length];
      foundPaths.current.push({ cells, color });
      const next = new Set(foundWords);
      next.add(match.word);
      setFoundWords(next);
      onWordFound(match);
      if (next.size === puzzleWords.length) onAllFound();
    }

    dragCells.current = [];
    forceRedraw((n) => n + 1);
  }

  return (
    <div className="word-search-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          style={{ width: canvasSize, height: canvasSize }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      <div className="word-bank">
        {puzzleWords.map((w) => {
          const found = foundWords.has(w.word);
          return (
            <div key={w.word} className={`word-bank-item ${found ? 'found' : ''}`}>
              <span className="word-bank-status">{found ? <CheckIcon /> : ''}</span>
              <div className="word-bank-text">
                {found ? (
                  <>
                    <strong>{w.word}</strong>: {w.definition}
                  </>
                ) : (
                  w.hint
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
