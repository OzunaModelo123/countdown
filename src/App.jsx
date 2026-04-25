import { useState, useEffect, useCallback } from 'react';
import Configurator from './components/Configurator';
import CountdownTimer from './components/CountdownTimer';
import FactLine from './components/FactLine';
import HypeButton from './components/HypeButton';
import Particles from './components/Particles';
import CelebrationOverlay from './components/CelebrationOverlay';
import { Pencil, Volume2, VolumeX } from 'lucide-react';
import { playTick, playThemeComplete } from './utils/sounds';
import { saveCountdown } from './utils/storage';
import { detectThemeColors } from './utils/ai';
import './index.css';

function App() {
  const [config, setConfig] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(12, 0, 0, 0);
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = new Date(nextWeek - tzoffset).toISOString().slice(0, 16);

    return {
      id: params.get('id') || `cd_${Date.now()}`,
      title: params.get('title') || 'Next Big Event',
      date: params.get('date') || localISOTime,
      context: params.get('context') || '',
      colors: {
        accent: params.get('accent') || '#7c3aed',
        accentSecondary: params.get('accent2') || '#06b6d4',
        background: params.get('bg') || '#06060f',
      },
      isKiosk: mode === 'kiosk',
      soundEnabled: true,
    };
  });

  const [isLaunched, setIsLaunched] = useState(config.isKiosk);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Apply dynamic colors to CSS
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', config.colors.accent);
    root.style.setProperty('--accent-secondary', config.colors.accentSecondary);
    root.style.setProperty('--bg-deep', config.colors.background);

    // Derive glow from accent
    const hex = config.colors.accent;
    root.style.setProperty('--accent-glow', hex + '59');
    root.style.setProperty('--accent-glow-strong', hex + '8c');
  }, [config.colors]);

  // Keyboard shortcuts (only in countdown view)
  useEffect(() => {
    if (!isLaunched) return;
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'e' || e.key === 'E') handleEdit();
      if (e.key === 'm' || e.key === 'M') toggleSound();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLaunched]);

  const toggleSound = useCallback(() => {
    setConfig(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const handleLaunch = useCallback(() => {
    saveCountdown(config);
    setIsTransitioning(true);
    setTimeout(() => { setIsLaunched(true); setIsTransitioning(false); }, 250);
  }, [config]);

  const handleEdit = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => { setIsLaunched(false); setIsComplete(false); setIsTransitioning(false); }, 250);
  }, []);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    if (config.soundEnabled) playThemeComplete('minimal');
  }, [config.soundEnabled]);

  const handleTick = useCallback(() => {
    if (config.soundEnabled) playTick();
  }, [config.soundEnabled]);

  const handleTimeUpdate = useCallback((tl) => setTimeLeft(tl), []);

  return (
    <>
      <div className="ambient-bg">
        <div className="ambient-orb" />
        <div className="ambient-orb" />
      </div>

      <div className="app-shell">
        {!isLaunched ? (
          <div className={`view-frame ${isTransitioning ? 'exit' : ''}`} key="setup">
            <div className="setup-header">
              <h1 className="brand-title">Countdown</h1>
              <p className="brand-sub">Set up your moment</p>
            </div>
            <Configurator config={config} setConfig={setConfig} onLaunch={handleLaunch} />
          </div>
        ) : (
          <div className={`view-frame ${isTransitioning ? 'exit' : ''}`} key="live">
            <div className="countdown-layout">
              <h1 className="event-name">{config.title}</h1>
              <p className="event-date-line">
                {new Date(config.date).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </p>

              <CountdownTimer
                targetDate={config.date}
                onComplete={handleComplete}
                onTick={handleTick}
                onTimeUpdate={handleTimeUpdate}
              />

              <FactLine config={config} timeLeft={timeLeft} />

              <HypeButton accent={config.colors.accent} soundEnabled={config.soundEnabled} />
            </div>

            {/* Bottom controls — clearly separated from content */}
            {!config.isKiosk && (
              <div className="bottom-controls">
                <button className="ctrl-btn" onClick={handleEdit}>
                  <Pencil size={14} />
                  <span className="ctrl-label">Edit</span>
                </button>
                <button className={`ctrl-btn ${config.soundEnabled ? 'active' : ''}`} onClick={toggleSound}>
                  {config.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  <span className="ctrl-label">{config.soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isLaunched && <Particles accent={config.colors.accent} secondary={config.colors.accentSecondary} />}
      {isComplete && (
        <CelebrationOverlay
          accent={config.colors.accent}
          title={config.title}
          onDismiss={() => setIsComplete(false)}
        />
      )}
    </>
  );
}

export default App;
