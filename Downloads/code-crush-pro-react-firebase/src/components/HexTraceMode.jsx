import { useState, useEffect, useRef, useMemo } from 'react';
import { buildLetterGrid } from '../data/wordDatabase';

const GAP = 10;
const MAX_HEX = 62;
const MIN_HEX = 34;
const HIT_PADDING = 6;

const PATH_COLORS = ['#4ECDC4', '#FF6B9D', '#A78BFA', '#FFD166', '#6BCB77', '#4D96FF'];

// How many decoy letters to add around the target word.
function decoyCount(len) {
  if (len <= 5) return 5;
  if (len <= 9) return Math.max(9 - len, 2);
  return 3;
}

// Grid always sized to exactly fit the word + decoys, so every level
// (even long "expert" words) has a workable, fully-filled grid.
function getGridConfig(wordStr) {
  const len = wordStr.length;
  const rawTotal = len + decoyCount(len);
  const cols = Math.ceil(Math.sqrt(rawTotal));
  const rows = Math.ceil(rawTotal / cols);
  return { cols, rows, total: cols * rows };
}

function pickPathColor(wordStr) {
  let sum = 0;
  for (let i = 0; i < wordStr.length; i++) sum += wordStr.charCodeAt(i);
  return PATH_COLORS[sum % PATH_COLORS.length];
}

const getDistance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export default function HexTraceMode({ word, onComplete }) {
  const canvasRef = useRef(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');

  const gridConfig = useMemo(() => getGridConfig(word.word), [word]);
  const letters = useMemo(
    () => buildLetterGrid(word.word, gridConfig.cols, gridConfig.rows),
    [word, gridConfig]
  );
  const pathColor = useMemo(() => pickPathColor(word.word), [word]);

  const tilePositions = useRef({});
  const layoutRef = useRef({ hexSize: MAX_HEX });
  const isDrawing = useRef(false);
  const pathIndices = useRef([]);
  const cursorPoint = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpi = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpi;
    canvas.height = rect.height * dpi;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpi, dpi);

    computeLayout(rect.width, rect.height);
    isDrawing.current = false;
    pathIndices.current = [];
    cursorPoint.current = null;
    setInput('');
    setFeedback('');
    render();

    const down = (e) => handlePointerDown(e);
    const move = (e) => handlePointerMove(e);
    const up = (e) => handlePointerUp(e);

    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', down, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', up);

    return () => {
      canvas.removeEventListener('mousedown', down);
      canvas.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      canvas.removeEventListener('touchstart', down);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, letters]);

  const computeLayout = (width, height) => {
    const { cols, rows } = gridConfig;
    const marginX = 20;
    const marginY = 20;

    let hexSize = Math.min(
      Math.floor((width - marginX - (cols - 1) * GAP) / cols),
      Math.floor((height - marginY - (rows - 1) * GAP) / rows),
      MAX_HEX
    );
    hexSize = Math.max(hexSize, MIN_HEX);
    layoutRef.current = { hexSize, cols, rows };

    const totalWidth = cols * hexSize + (cols - 1) * GAP;
    const totalHeight = rows * hexSize + (rows - 1) * GAP;
    const startX = (width - totalWidth) / 2;
    const startY = (height - totalHeight) / 2;

    tilePositions.current = {};
    let index = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (index >= letters.length) break;
        const x = startX + j * (hexSize + GAP) + hexSize / 2;
        const y = startY + i * (hexSize + GAP) + hexSize / 2;
        tilePositions.current[index] = { x, y, letter: letters[index] };
        index++;
      }
    }
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const width = rect.width;
    const height = rect.height;
    const hexSize = layoutRef.current.hexSize || MAX_HEX;
    const radius = hexSize / 2;
    const fontSize = Math.max(13, Math.round(hexSize * 0.46));

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Colored capsule trace connecting the selected tiles, drawn first so
    // the letters always sit legibly on top of it.
    if (pathIndices.current.length > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = pathColor;
      ctx.fillStyle = pathColor;
      ctx.lineWidth = Math.max(18, radius * 1.5);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const first = tilePositions.current[pathIndices.current[0]];
      ctx.moveTo(first.x, first.y);
      for (let k = 1; k < pathIndices.current.length; k++) {
        const p = tilePositions.current[pathIndices.current[k]];
        ctx.lineTo(p.x, p.y);
      }
      if (isDrawing.current && cursorPoint.current) {
        ctx.lineTo(cursorPoint.current.x, cursorPoint.current.y);
      }
      ctx.stroke();
      pathIndices.current.forEach((idx) => {
        const p = tilePositions.current[idx];
        if (!p) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    const count = Object.keys(tilePositions.current).length;
    for (let i = 0; i < count; i++) {
      const pos = tilePositions.current[i];
      if (!pos) continue;
      const selected = pathIndices.current.includes(i);

      if (!selected) {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E8E8E8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#263238';
      ctx.font = `bold ${fontSize}px 'Baloo 2', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pos.letter, pos.x, pos.y);
    }
  };

  const getEventCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX;
    let clientY;
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const hitTest = (coords) => {
    const hexSize = layoutRef.current.hexSize || MAX_HEX;
    const hitRadius = hexSize / 2 + HIT_PADDING;
    const count = Object.keys(tilePositions.current).length;
    for (let i = 0; i < count; i++) {
      const pos = tilePositions.current[i];
      if (pos && getDistance(coords.x, coords.y, pos.x, pos.y) < hitRadius) return i;
    }
    return null;
  };

  const handlePointerDown = (e) => {
    if (e.cancelable) e.preventDefault();
    const coords = getEventCoords(e);
    const idx = hitTest(coords);
    if (idx === null) return;

    isDrawing.current = true;
    pathIndices.current = [idx];
    cursorPoint.current = coords;
    setInput(tilePositions.current[idx].letter);
    setFeedback('');
    render();
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current) return;
    if (e.cancelable) e.preventDefault();
    const coords = getEventCoords(e);
    cursorPoint.current = coords;

    const idx = hitTest(coords);
    const last = pathIndices.current[pathIndices.current.length - 1];
    if (idx !== null && idx !== last && !pathIndices.current.includes(idx)) {
      pathIndices.current.push(idx);
      setInput(pathIndices.current.map((i) => tilePositions.current[i].letter).join(''));
    }
    render();
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    cursorPoint.current = null;

    const traced = pathIndices.current.map((i) => tilePositions.current[i].letter).join('');

    if (traced === word.word) {
      setFeedbackType('success');
      setFeedback('Nice!');
      render();
      onComplete();
    } else {
      setFeedbackType('error');
      setFeedback('Not a match, try again');
      render();
      setTimeout(() => {
        pathIndices.current = [];
        setInput('');
        setFeedback('');
        render();
      }, 900);
    }
  };

  return (
    <div className="hex-trace-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{ width: '280px', height: '280px', display: 'block' }}
        />
      </div>
      <div className="input-display">{input || '...'}</div>
      {feedback && <div className={`game-feedback feedback-${feedbackType}`}>{feedback}</div>}
    </div>
  );
}
