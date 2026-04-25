import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { generateAIFact } from '../utils/ai';

export default function FactLine({ config, timeLeft }) {
  const [displayText, setDisplayText] = useState('');
  const [isFading, setIsFading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const typeTimerRef = useRef(null);

  const typeText = (text) => {
    setDisplayText('');
    let i = 0;
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    typeTimerRef.current = setInterval(() => {
      if (i < text.length) { setDisplayText(text.slice(0, i + 1)); i++; }
      else clearInterval(typeTimerRef.current);
    }, 20);
  };

  const loadFact = async (fade = true) => {
    if (fade) { setIsFading(true); await new Promise(r => setTimeout(r, 350)); }
    setIsLoading(true);
    const fact = await generateAIFact(config.title, 'minimal', config.context, timeLeft);
    setIsLoading(false);
    if (fade) setIsFading(false);
    typeText(fact);
  };

  useEffect(() => {
    loadFact(false);
    const iv = setInterval(() => loadFact(true), 20000);
    return () => { clearInterval(iv); if (typeTimerRef.current) clearInterval(typeTimerRef.current); };
  }, [config.title, config.context]);

  return (
    <div className="fact-line">
      <p className={`fact-text ${isFading ? 'fading' : ''}`}>{displayText}</p>
      <button className="fact-refresh" onClick={() => !isLoading && loadFact(true)} disabled={isLoading}
        aria-label="New fact">
        <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
      </button>
    </div>
  );
}
