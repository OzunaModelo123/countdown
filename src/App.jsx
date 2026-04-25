import { useState, useEffect, useCallback } from 'react';
import Configurator from './components/Configurator';
import CountdownTimer from './components/CountdownTimer';
import FactLine from './components/FactLine';
import HypeButton from './components/HypeButton';
import Particles from './components/Particles';
import CelebrationOverlay from './components/CelebrationOverlay';
import { Pencil, Maximize, Minimize, Loader2 } from 'lucide-react';
import { saveCountdown } from './utils/storage';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import './index.css';

function App() {
  const params = new URLSearchParams(window.location.search);
  const cloudId = params.get('id');
  
  // Fetch from cloud if ID exists
  const cloudData = useQuery(api.countdowns.get, cloudId ? { id: cloudId } : "skip");

  const [config, setConfig] = useState(() => {
    // Check for base64 compressed state (legacy support)
    const compressedState = params.get('s');
    if (compressedState) {
      try {
        const decoded = JSON.parse(atob(compressedState));
        return {
          ...decoded,
          isKiosk: params.get('mode') === 'kiosk' || params.get('embed') === 'true',
          isEmbed: params.get('embed') === 'true',
        };
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }

    const mode = params.get('mode');
    const isEmbed = params.get('embed') === 'true';
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(12, 0, 0, 0);
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = new Date(nextWeek - tzoffset).toISOString().slice(0, 16);

    return {
      id: cloudId || `cd_${Date.now()}`,
      title: params.get('title') || 'Next Big Event',
      date: params.get('date') || localISOTime,
      createdAt: params.get('createdAt') ? parseInt(params.get('createdAt')) : Date.now(),
      context: params.get('context') || '',
      bgImage: params.get('bgImage') || '',
      colors: {
        accent: params.get('accent') || '#7c3aed',
        accentSecondary: params.get('accent2') || '#06b6d4',
        background: params.get('bg') || '#06060f',
      },
      isKiosk: mode === 'kiosk' || isEmbed,
      isEmbed: isEmbed,
    };
  });

  // Sync cloud data to local state
  useEffect(() => {
    if (cloudData) {
      setConfig(prev => ({
        ...prev,
        ...cloudData,
        id: cloudId,
        isKiosk: params.get('mode') === 'kiosk' || params.get('embed') === 'true' || prev.isKiosk,
        isEmbed: params.get('embed') === 'true' || prev.isEmbed,
      }));
      setIsLaunched(true);
    }
  }, [cloudData, cloudId]);

  const [isLaunched, setIsLaunched] = useState(config.isKiosk);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts (only in countdown view)
  useEffect(() => {
    if (!isLaunched) return;
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'e' || e.key === 'E') handleEdit();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLaunched, toggleFullscreen]);

  const handleLaunch = useCallback((newConfig) => {
    const finalConfig = newConfig || config;
    saveCountdown(finalConfig);
    setIsTransitioning(true);
    
    // Request notification permissions
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    setTimeout(() => { 
      setIsLaunched(true); 
      setIsTransitioning(false); 
      if (newConfig) setConfig(newConfig);
    }, 250);
  }, [config]);

  const handleEdit = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => { setIsLaunched(false); setIsComplete(false); setIsTransitioning(false); }, 250);
  }, []);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    // Fire Web Push Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Countdown Complete!', {
        body: `${config.title} is finally here!`,
        icon: '/favicon.ico'
      });
    }
  }, [config.title]);

  const handleTimeUpdate = useCallback((tl, urgency) => {
    setTimeLeft(tl);
    if (urgency !== undefined) {
      document.documentElement.style.setProperty('--urgency', urgency);
    }
  }, []);

  if (cloudId && cloudData === undefined) {
    return (
      <div className="loading-screen">
        <Loader2 className="spin" size={48} />
        <p>Fetching your moment...</p>
      </div>
    );
  }

  return (
    <>
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
                onTimeUpdate={handleTimeUpdate}
              />

              {!config.isEmbed && <FactLine config={config} timeLeft={timeLeft} />}
              {!config.isEmbed && <HypeButton accent={config.colors.accent} />}
            </div>

            {/* Bottom controls — clearly separated from content */}
            {!config.isKiosk && !isFullscreen && (
              <div className="bottom-controls">
                <button className="ctrl-btn" onClick={handleEdit}>
                  <Pencil size={14} />
                  <span className="ctrl-label">Edit</span>
                </button>
                <button className={`ctrl-btn ${isFullscreen ? 'active' : ''}`} onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                  <span className="ctrl-label">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                </button>
              </div>
            )}
            
            {/* Provide a hidden exit button that appears when hovering top right in fullscreen */}
            {!config.isKiosk && isFullscreen && (
               <button className="exit-fullscreen-btn" onClick={toggleFullscreen} aria-label="Exit Fullscreen">
                 <Minimize size={20} />
               </button>
            )}
          </div>
        )}
      </div>

      {config.bgImage ? (
        <>
          <div className="bg-image-layer" style={{ backgroundImage: `url(${config.bgImage})` }} />
          <div className="bg-glass-overlay" />
        </>
      ) : (
        <Particles accent={config.colors.accent} secondary={config.colors.accentSecondary} />
      )}
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
