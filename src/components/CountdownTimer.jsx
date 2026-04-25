import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import './CountdownTimer.css';

export default function CountdownTimer({ targetDate, onComplete, onTimeUpdate }) {
  const [timeLeft, setTimeLeft] = useState(() => calc(targetDate));
  const doneRef = useRef(false);
  const prevSecRef = useRef(null);

  useEffect(() => { doneRef.current = false; }, [targetDate]);

  const [milestone, setMilestone] = useState(null);

  const triggerMilestone = (msg) => {
    setMilestone(msg);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => setMilestone(null), 4000);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const tl = calc(targetDate);
      setTimeLeft(tl);
      
      const urgency = Math.max(0, 1 - (tl.totalSeconds / 86400));
      if (onTimeUpdate) onTimeUpdate(tl, urgency);
      
      if (prevSecRef.current !== null && prevSecRef.current !== tl.totalSeconds) {
        if (tl.totalSeconds === 86400) triggerMilestone("24 Hours Left!");
        if (tl.totalSeconds === 3600) triggerMilestone("1 Hour Left!");
        if (tl.totalSeconds === 60) triggerMilestone("60 Seconds!");
      }
      prevSecRef.current = tl.totalSeconds;
      
      if (tl.isComplete && !doneRef.current) { doneRef.current = true; if (onComplete) onComplete(); }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onComplete, onTimeUpdate]);

  const pad = (v) => String(v).padStart(2, '0');

  return (
    <div className="timer" role="timer" aria-label="Countdown timer">
      <Digit value={pad(timeLeft.days)} label="Days" />
      <span className="sep" aria-hidden="true">:</span>
      <Digit value={pad(timeLeft.hours)} label="Hours" />
      <span className="sep" aria-hidden="true">:</span>
      <Digit value={pad(timeLeft.minutes)} label="Min" />
      <span className="sep" aria-hidden="true">:</span>
      <Digit value={pad(timeLeft.seconds)} label="Sec" />
      
      {milestone && <div className="milestone-toast">{milestone}</div>}
    </div>
  );
}

function calc(targetDate) {
  const d = +new Date(targetDate) - +new Date();
  if (d > 0) return {
    days: Math.floor(d / 86400000), hours: Math.floor((d / 3600000) % 24),
    minutes: Math.floor((d / 60000) % 60), seconds: Math.floor((d / 1000) % 60), 
    totalSeconds: Math.floor(d / 1000), isComplete: false,
  };
  return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isComplete: true };
}

function Digit({ value, label }) {
  const prevRef = useRef(value);
  const [flipping, setFlipping] = useState(false);
  const [shown, setShown] = useState(value);
  const [prev, setPrev] = useState(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setPrev(prevRef.current);
      setFlipping(true);
      const t = setTimeout(() => { setShown(value); setFlipping(false); }, 280);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="digit-col" aria-label={`${value} ${label}`}>
      <div className="digit-box">
        <div className="digit-top"><span>{shown}</span></div>
        <div className="digit-bot"><span>{shown}</span></div>
        {flipping && (
          <>
            <div className="flip-top"><span>{prev}</span></div>
            <div className="flip-bot"><span>{value}</span></div>
          </>
        )}
        <div className="digit-line" />
      </div>
      <span className="digit-label">{label}</span>
    </div>
  );
}
