import logo from '../assets/code-crush-logo.png';

const DIFFICULTIES = [
  { level: 'rookie', label: 'Rookie', desc: 'Learning basics' },
  { level: 'coder', label: 'Coder', desc: 'Intermediate challenge' },
  { level: 'expert', label: 'Expert', desc: 'Advanced vocabulary' },
];

export default function HomeScreen({ mode, setMode, onStart }) {
  return (
    <div className="screen home-screen">
      <div className="home-content">
        <img src={logo} alt="Code Crush" className="home-logo" />
        <div className="home-subtitle">Learn tech words through play</div>

        <div className="mode-tabs">
          <button className={`mode-tab ${mode === 'hex' ? 'active' : ''}`} onClick={() => setMode('hex')}>
            Trace Draw
          </button>
          <button className={`mode-tab ${mode === 'builder' ? 'active' : ''}`} onClick={() => setMode('builder')}>
            Drag Build
          </button>
        </div>

        <div className="difficulty-grid">
          {DIFFICULTIES.map((d) => (
            <button key={d.level} className={`difficulty-btn ${d.level}`} onClick={() => onStart(d.level)}>
              <div>{d.label}</div>
              <div className="difficulty-description">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
