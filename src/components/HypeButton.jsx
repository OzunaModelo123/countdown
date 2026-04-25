import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Flame, Zap } from 'lucide-react';
import { generateHypeMessage } from '../utils/ai';
import './HypeButton.css';

export default function HypeButton({ accent }) {
  const [clicks, setClicks] = useState(0);
  const [jiggle, setJiggle] = useState(false);
  const [message, setMessage] = useState('');
  const [showMsg, setShowMsg] = useState(false);
  const [comboTimer, setComboTimer] = useState(null);

  useEffect(() => () => { if (comboTimer) clearTimeout(comboTimer); }, [comboTimer]);

  useEffect(() => {
    const h = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); doHype();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [clicks, accent]);

  const doHype = useCallback(() => {
    const n = clicks + 1;
    setClicks(n);
    setJiggle(true); setTimeout(() => setJiggle(false), 200);

    const colors = [accent || '#7c3aed', '#fff', '#06b6d4'];
    confetti({ particleCount: 20 + Math.min(n, 30) * 3, spread: 50 + Math.min(n, 30) * 2,
      origin: { y: 0.7 }, colors, disableForReducedMotion: true, gravity: 0.8 });

    if (n % 10 === 0) setTimeout(() => {
      confetti({ particleCount: 100, spread: 120, startVelocity: 45, origin: { y: 0.5 }, colors, disableForReducedMotion: true });
    }, 200);

    if (n >= 15) { document.body.style.animation = 'shake 0.2s ease'; setTimeout(() => { document.body.style.animation = ''; }, 200); }

    setMessage(generateHypeMessage(n)); setShowMsg(true);
    if (comboTimer) clearTimeout(comboTimer);
    setComboTimer(setTimeout(() => setShowMsg(false), 3000));
  }, [clicks, accent, comboTimer]);

  const intensity = clicks >= 30 ? 'max' : clicks >= 15 ? 'high' : clicks >= 5 ? 'mid' : '';

  return (
    <div className="hype-wrap">
      <button className={`hype-btn ${jiggle ? 'jiggle' : ''} ${intensity ? 'i-' + intensity : ''}`}
        onClick={doHype} aria-label="Hype!">
        {clicks >= 20 ? <Zap size={20} /> : <Flame size={20} className="flame" />}
        <span>HYPE!</span>
      </button>
      {clicks > 0 && (
        <div className="hype-stats">
          <span className="hype-count" key={clicks}>×{clicks}</span>
          {showMsg && <span className="hype-msg" key={`m${clicks}`}>{message}</span>}
        </div>
      )}
    </div>
  );
}
