import React, { useMemo } from 'react';
import './Particles.css';

export default function Particles({ accent, secondary }) {
  const particles = useMemo(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      dur: 14 + Math.random() * 22,
      delay: Math.random() * 15,
      size: 3 + Math.random() * 10,
      opacity: 0.08 + Math.random() * 0.18,
      type: Math.random() > 0.5 ? 'orb' : 'dust',
    })), [accent, secondary]);

  return (
    <div className="ptcl-wrap" aria-hidden="true">
      {particles.map(p => (
        <div key={p.id} className={`ptcl ${p.type}`}
          style={{ left: `${p.left}%`, width: `${p.size}px`, height: `${p.size}px`,
            animationDuration: `${p.dur}s`, animationDelay: `-${p.delay}s`, opacity: p.opacity,
            background: p.type === 'orb' ? accent : secondary }} />
      ))}
    </div>
  );
}
