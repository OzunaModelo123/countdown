import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getLocalFact } from '../utils/ai';

export default function FactLine({ config, timeLeft }) {
  const [displayText, setDisplayText] = useState('');
  const [isFading, setIsFading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const typeTimerRef = useRef(null);
  const generateAIFactAction = useAction(api.ai.generateAIFact);

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
    
    let fact = null;
    try {
      const daysLeft = timeLeft ? timeLeft.days : 0;
      const hoursLeft = timeLeft ? timeLeft.hours : 0;
      const daysPassed = config.createdAt ? Math.floor((Date.now() - config.createdAt) / 86400000) : 0;
      let timeContext = `There are exactly ${daysLeft} days and ${hoursLeft} hours left until the event.`;
      if (daysPassed > 0) {
        timeContext += ` It has been ${daysPassed} days since this countdown was started.`;
      }

      // Ensure the convex url is configured (the app wrapper will throw if not, but good to be safe)
      if (import.meta.env.VITE_CONVEX_URL) {
        fact = await generateAIFactAction({ 
          title: config.title, 
          context: config.context || '', 
          timeContext 
        });
      }
    } catch (e) {
      console.error("AI Fact generation failed:", e);
    }

    if (!fact) {
      fact = getLocalFact(config.title, timeLeft);
    }

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

