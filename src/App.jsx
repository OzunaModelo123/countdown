import { useState, useEffect, useCallback } from 'react';
import Configurator from './components/Configurator';
import CountdownTimer from './components/CountdownTimer';
import FactLine from './components/FactLine';
import HypeButton from './components/HypeButton';
import Particles from './components/Particles';
import CelebrationOverlay from './components/CelebrationOverlay';
import { Pencil, Maximize, Minimize, Loader2, X } from 'lucide-react';
import { saveCountdown } from './utils/storage';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import './index.css';

function App() {
  const params = new URLSearchParams(window.location.search);
  const cloudId = params.get('id');
  const isEmbed = params.get('embed') === 'true';
  const isDisplayMode = params.get('mode') === 'display';
  
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
          isKiosk: isDisplayMode || isEmbed,
          isEmbed: isEmbed,
        };
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }

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
      isKiosk: isDisplayMode || isEmbed,
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
        isKiosk: isDisplayMode || isEmbed || prev.isKiosk,
        isEmbed: isEmbed || prev.isEmbed,
      }));
      setIsLaunched(true);
    }
  }, [cloudData, cloudId, isDisplayMode, isEmbed]);

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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isLaunched || isDisplayMode) return;
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'e' || e.key === 'E') handleEdit();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLaunched, isDisplayMode, toggleFullscreen]);

  const handleLaunch = useCallback((newConfig) => {
    const finalConfig = newConfig || config;
    saveCountdown(finalConfig);
    setIsTransitioning(true);
    
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
      <div className={`app-shell ${isDisplayMode ? 'mode-display' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}>
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

              {!isDisplayMode && !isEmbed && (
                <>
                  <FactLine title={config.title} context={config.context} colors={config.colors} />
                  <HypeButton accent={config.colors.accent} />
                </>
              )}
            </div>

            {/* Controls */}
            {isLaunched && (
              <>
                {/* Standard controls (Hidden in display mode) */}
                {!isDisplayMode && !isFullscreen && !isEmbed && (
                  <div className="bottom-controls">
                    <button className="ctrl-btn" onClick={handleEdit}>
                      <Pencil size={14} />
                      <span className="ctrl-label">Edit</span>
                    </button>
                    <button className="ctrl-btn" onClick={toggleFullscreen}>
                      <Maximize size={14} />
                      <span className="ctrl-label">Fullscreen</span>
                    </button>
                  </div>
                )}
                
                {/* Subtle info trigger for Display Mode (only on hover) */}
                {isDisplayMode && (
                  <button className="display-info-trigger" onClick={() => setIsLaunched(false)} title="Show Settings">
                    <X size={16} />
                  </button>
                )}

                {isFullscreen && !isDisplayMode && (
                  <button className="exit-fullscreen-btn" onClick={toggleFullscreen} title="Exit Fullscreen">
                    <Minimize size={20} />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <DisplayGuide 
        isOpen={!isLaunched && isDisplayMode} 
        onClose={() => setIsLaunched(true)} 
        cloudUrl={window.location.href.replace('&mode=display', '').replace('?mode=display', '')} 
      />

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
