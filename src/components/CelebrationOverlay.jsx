import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper, X } from 'lucide-react';
import './CelebrationOverlay.css';

export default function CelebrationOverlay({ accent, title, onDismiss }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const colors = [accent || '#7c3aed', '#fff', '#06b6d4', '#fbbf24'];

    const burst = () => confetti({ particleCount: 150, spread: 100, startVelocity: 50, origin: { y: 0.5 }, colors, disableForReducedMotion: true });
    burst();
    setTimeout(burst, 500);
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors, disableForReducedMotion: true });
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors, disableForReducedMotion: true });
    }, 800);
    const iv = setInterval(() => confetti({ particleCount: 25, spread: 180, startVelocity: 12, origin: { y: 0 }, colors, gravity: 0.4, disableForReducedMotion: true }), 400);
    setTimeout(() => clearInterval(iv), 5000);
    return () => clearInterval(iv);
  }, [accent]);

  return (
    <div className="celeb-overlay" onClick={onDismiss}>
      <div className="celeb-card" onClick={e => e.stopPropagation()}>
        <button className="celeb-close" onClick={onDismiss} aria-label="Close"><X size={18} /></button>
        <div className="celeb-icon"><PartyPopper size={40} /></div>
        <h2 className="celeb-heading">It's Time!</h2>
        <p className="celeb-event">{title}</p>
        <p className="celeb-sub">The moment has arrived</p>
        <button className="btn btn-accent celeb-dismiss" onClick={onDismiss}>Amazing!</button>
      </div>
    </div>
  );
}
