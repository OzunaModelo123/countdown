import { useState, useEffect, useCallback, useMemo } from 'react';
import Configurator from './components/Configurator';
import CountdownTimer from './components/CountdownTimer';
import FactLine from './components/FactLine';
import HypeButton from './components/HypeButton';
import Particles from './components/Particles';
import CelebrationOverlay from './components/CelebrationOverlay';
import DisplayGuide from './components/DisplayGuide';
import { Pencil, Maximize, Minimize, Loader2, X } from 'lucide-react';
import { saveCountdown } from './utils/storage';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import './index.css';

function App() {
  // Use state for URL params to make them reactive to pushState
  const [urlParams, setUrlParams] = useState(() => new URLSearchParams(window.location.search));
  
  useEffect(() => {
    const handleLocationChange = () => setUrlParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', handleLocationChange);
    // Listen for custom pushState events if needed, but App usually triggers them
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const cloudId = urlParams.get('id');
  const isEmbed = urlParams.get('embed') === 'true';
  const isDisplayMode = urlParams.get('mode') === 'display';
  
  const cloudData = useQuery(api.countdowns.get, cloudId ? { id: cloudId } : "skip");

  const [config, setConfig] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(12, 0, 0, 0);
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = new Date(nextWeek - tzoffset).toISOString().slice(0, 16);

    return {
      id: cloudId || `cd_${Date.now()}`,
      title: urlParams.get('title') || 'Next Big Event',
      date: urlParams.get('date') || localISOTime,
      createdAt: urlParams.get('createdAt') ? parseInt(urlParams.get('createdAt')) : Date.now(),
      context: urlParams.get('context') || '',
      bgImage: urlParams.get('bgImage') || '',
      colors: {
        accent: urlParams.get('accent') || '#7c3aed',
        accentSecondary: urlParams.get('accent2') || '#06b6d4',
        background: urlParams.get('bg') || '#06060f',
      },
      isKiosk: isDisplayMode || isEmbed,
      isEmbed: isEmbed,
    };
  });

  const [isLaunched, setIsLaunched] = useState(config.isKiosk);
  const [isComplete, setIsComplete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

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

  // Apply dynamic colors to CSS
  useEffect(() => {
    if (!config.colors) return;
    const root = document.documentElement;
    root.style.setProperty('--accent', config.colors.accent || '#7c3aed');
    root.style.setProperty('--accent-secondary', config.colors.accentSecondary || '#06b6d4');
    root.style.setProperty('--bg-deep', config.colors.background || '#06060f');
    const hex = config.colors.accent || '#7c3aed';
    root.style.setProperty('--accent-glow', hex + '59');
    root.style.setProperty('--accent-glow-strong', hex + '8c');
  }, [config.colors]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleLaunch = useCallback((newConfig) => {
    const finalConfig = newConfig || config;
    saveCountdown(finalConfig);
    setIsLaunched(true); 
    if (newConfig) setConfig(newConfig);
    // Refresh params to sync with potential pushState from Configurator
    setUrlParams(new URLSearchParams(window.location.search));
  }, [config]);

  const handleEdit = useCallback(() => {
    setIsLaunched(false); 
    setIsComplete(false);
  }, []);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Countdown Complete!', { body: `${config.title} is finally here!` });
    }
  }, [config.title]);

  const handleTimeUpdate = useCallback((tl, urgency) => {
    setTimeLeft(tl);
    if (urgency !== undefined) document.documentElement.style.setProperty('--urgency', urgency);
  }, []);

  // Show loading ONLY if we are waiting for a specific cloud ID we don't have yet
  const isLoading = cloudId && cloudData === undefined && !isLaunched;

  return (
    <>
      <div className={`app-shell ${isDisplayMode ? 'mode-display' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}>
        {isLoading ? (
          <div className="loading-screen">
            <Loader2 className="spin" size={48} />
            <p>Fetching your moment...</p>
          </div>
        ) : !isLaunched ? (
          <div className="view-frame" key="setup">
            <div className="setup-header">
              <h1 className="brand-title">Countdown</h1>
              <p className="brand-sub">Set up your moment</p>
            </div>
            <Configurator config={config} setConfig={setConfig} onLaunch={handleLaunch} />
          </div>
        ) : (
          <div className="view-frame" key="live">
            <div className="countdown-layout">
              <h1 className="event-name">{config.title || 'Untitled Event'}</h1>
              <p className="event-date-line">
                {(() => {
                  try {
                    const d = new Date(config.date);
                    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    });
                  } catch (e) { return 'Invalid Date'; }
                })()}
              </p>
              <CountdownTimer targetDate={config.date} onComplete={handleComplete} onTimeUpdate={handleTimeUpdate} />
              {!isDisplayMode && !isEmbed && (
                <>
                  <FactLine config={config} timeLeft={timeLeft} />
                  <HypeButton accent={config.colors?.accent} />
                </>
              )}
            </div>

            <div className="controls-layer">
              {!isDisplayMode && !isFullscreen && !isEmbed && (
                <div className="bottom-controls">
                  <button className="ctrl-btn" onClick={handleEdit}><Pencil size={14} /><span className="ctrl-label">Edit</span></button>
                  <button className="ctrl-btn" onClick={toggleFullscreen}><Maximize size={14} /><span className="ctrl-label">Fullscreen</span></button>
                </div>
              )}
              {isDisplayMode && (
                <button className="display-info-trigger" onClick={handleEdit} title="Show Settings"><X size={16} /></button>
              )}
              {isFullscreen && !isDisplayMode && (
                <button className="exit-fullscreen-btn" onClick={toggleFullscreen} title="Exit Fullscreen"><Minimize size={20} /></button>
              )}
            </div>
          </div>
        )}
      </div>

      <DisplayGuide 
        isOpen={!isLaunched && isDisplayMode} 
        onClose={() => setIsLaunched(true)} 
        cloudUrl={window.location.href.split('&mode=')[0].split('?mode=')[0]} 
      />

      {config.bgImage ? (
        <>
          <div className="bg-image-layer" style={{ backgroundImage: `url(${config.bgImage})` }} />
          <div className="bg-glass-overlay" />
        </>
      ) : (
        <Particles accent={config.colors?.accent} secondary={config.colors?.accentSecondary} />
      )}
      
      {isComplete && (
        <CelebrationOverlay accent={config.colors?.accent} title={config.title} onDismiss={() => setIsComplete(false)} />
      )}
    </>
  );
}

export default App;
