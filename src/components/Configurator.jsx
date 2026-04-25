import React, { useState, useEffect, useRef } from 'react';
import { Play, Share2, Clock, Trash2, ChevronDown, ChevronUp, Palette, Code2, Loader2 } from 'lucide-react';
import { getSavedCountdowns, deleteCountdown, formatDateForDisplay } from '../utils/storage';
import { detectThemeColors as localDetectThemeColors, suggestEventDate as localSuggestEventDate } from '../utils/ai';
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import './Configurator.css';

export default function Configurator({ config, setConfig, onLaunch }) {
  const [showSaved, setShowSaved] = useState(false);
  const [saved, setSaved] = useState(() => getSavedCountdowns());
  const [showColors, setShowColors] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState(null);
  const detectTimerRef = useRef(null);
  
  const suggestEventDateAction = useAction(api.ai.suggestEventDate);
  const detectThemeColorsAction = useAction(api.ai.detectThemeColors);
  const saveMutation = useMutation(api.countdowns.save);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  // Auto-detect colors when title changes (debounced)
  const prevTitleRef = useRef(config.title);
  useEffect(() => {
    if (config.title === prevTitleRef.current) return;
    prevTitleRef.current = config.title;

    if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
    detectTimerRef.current = setTimeout(async () => {
      if (config.title.length < 3) return;
      setAutoDetecting(true);
      try {
        let colors = null;
        let suggested = null;
        
        if (import.meta.env.VITE_CONVEX_URL) {
          try {
            [colors, suggested] = await Promise.all([
              detectThemeColorsAction({ title: config.title, context: config.context || '' }),
              suggestEventDateAction({ title: config.title, currentDateISO: new Date().toISOString() })
            ]);
          } catch (e) {
            console.error("Convex AI failed, using fallback");
          }
        }
        
        if (!colors) colors = await localDetectThemeColors(config.title, config.context);
        if (!suggested) suggested = await localSuggestEventDate(config.title);

        if (colors) {
          setConfig(prev => ({ ...prev, colors: { ...prev.colors, ...colors } }));
        }
        if (suggested && suggested !== config.date) {
          setSuggestedDate(suggested);
        } else {
          setSuggestedDate(null);
        }
      } catch (e) { /* silent */ }
      setAutoDetecting(false);
    }, 800);

    return () => { if (detectTimerRef.current) clearTimeout(detectTimerRef.current); };
  }, [config.title, config.context]);

  const setColor = (key, value) => {
    setConfig(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const saveToCloud = async () => {
    setIsSaving(true);
    try {
      const id = await saveMutation({
        title: config.title,
        date: new Date(config.date).toISOString(), // Ensure UTC storage
        context: config.context,
        bgImage: config.bgImage,
        colors: config.colors,
      });
      return id;
    } catch (e) {
      console.error("Failed to save to cloud", e);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const getUrlForId = (id, isEmbed = false) => {
    const url = new URL(window.location.origin);
    url.searchParams.set('id', id);
    if (isEmbed) url.searchParams.set('embed', 'true');
    return url.toString();
  };

  const shareUrl = async () => {
    const id = await saveToCloud();
    if (!id) return;
    
    navigator.clipboard.writeText(getUrlForId(id, false)).then(() => {
      setShareToast('Cloud link copied!');
      setTimeout(() => setShareToast(false), 2500);
    });
  };

  const shareEmbed = async () => {
    const id = await saveToCloud();
    if (!id) return;

    const code = `<iframe src="${getUrlForId(id, true)}" width="100%" height="400" style="border:none; border-radius:12px; background:transparent;"></iframe>`;
    navigator.clipboard.writeText(code).then(() => {
      setShareToast('Iframe code copied!');
      setTimeout(() => setShareToast(false), 2500);
    });
  };

  const handleStart = async () => {
    const id = await saveToCloud();
    if (id) {
      // Update local config with cloud ID and UTC date
      const updatedConfig = { 
        ...config, 
        id, 
        date: new Date(config.date).toISOString() 
      };
      onLaunch(updatedConfig);
      // Update URL without refreshing
      window.history.pushState({}, '', `?id=${id}`);
    } else {
      onLaunch(config);
    }
  };

  const loadSaved = (item) => { setConfig(item); setShowSaved(false); };
  const removeSaved = (e, id) => { e.stopPropagation(); setSaved(deleteCountdown(id)); };

  return (
    <div className="configurator glass">
      {/* Saved */}
      {saved.length > 0 && (
        <button className="saved-toggle" onClick={() => { setSaved(getSavedCountdowns()); setShowSaved(!showSaved); }}>
          <Clock size={14} />
          <span>{saved.length} saved</span>
          {showSaved ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
      {showSaved && (
        <div className="saved-list">
          {saved.map(item => (
            <button key={item.id} className="saved-item" onClick={() => loadSaved(item)}>
              <div className="saved-info">
                <span className="saved-title">{item.title}</span>
                <span className="saved-date">{formatDateForDisplay(item.date)}</span>
              </div>
              <button className="saved-del" onClick={(e) => removeSaved(e, item.id)} aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Form */}
      <div className="config-form">
        <div className="field">
          <label htmlFor="title-input">What are you counting down to?</label>
          <input id="title-input" type="text" name="title" value={config.title} onChange={handleChange}
            placeholder="e.g., Product Launch, Christmas, Birthday Party" autoComplete="off" />
          {autoDetecting && <span className="detect-hint">✨ Matching...</span>}
          {suggestedDate && !autoDetecting && (
            <button 
              className="suggestion-chip" 
              onClick={() => {
                setConfig(prev => ({ ...prev, date: suggestedDate }));
                setSuggestedDate(null);
              }}
            >
              ✨ Did you mean {new Date(suggestedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}? <span className="apply-txt">Apply</span>
            </button>
          )}
        </div>

        <div className="field">
          <label htmlFor="date-input">When? <span className="hint">(automatically synced to your timezone)</span></label>
          <input id="date-input" type="datetime-local" name="date" value={config.date} onChange={handleChange} />
        </div>

        <div className="field">
          <label htmlFor="context-input">Extra context <span className="hint">(optional — makes facts more relevant)</span></label>
          <textarea id="context-input" name="context" value={config.context} onChange={handleChange}
            placeholder="e.g., We're celebrating our 5th anniversary as a team..." rows={2} />
        </div>

        <div className="field">
          <label htmlFor="bg-image-input">Background Image URL <span className="hint">(optional)</span></label>
          <input id="bg-image-input" type="text" name="bgImage" value={config.bgImage || ''} onChange={handleChange}
            placeholder="e.g., https://images.unsplash.com/..." autoComplete="off" />
        </div>

        {/* Color Customization */}
        <button className="color-toggle" onClick={() => setShowColors(!showColors)}>
          <Palette size={14} />
          <span>Theme Colors</span>
          {showColors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showColors && (
          <div className="color-panel">
            <div className="color-field">
              <label>Primary</label>
              <div className="color-input-wrap">
                <input type="color" value={config.colors.accent} onChange={(e) => setColor('accent', e.target.value)} />
                <input type="text" value={config.colors.accent} onChange={(e) => setColor('accent', e.target.value)}
                  className="color-hex" spellCheck="false" />
              </div>
            </div>
            <div className="color-field">
              <label>Secondary</label>
              <div className="color-input-wrap">
                <input type="color" value={config.colors.accentSecondary} onChange={(e) => setColor('accentSecondary', e.target.value)} />
                <input type="text" value={config.colors.accentSecondary} onChange={(e) => setColor('accentSecondary', e.target.value)}
                  className="color-hex" spellCheck="false" />
              </div>
            </div>
            <div className="color-field">
              <label>Background</label>
              <div className="color-input-wrap">
                <input type="color" value={config.colors.background} onChange={(e) => setColor('background', e.target.value)} />
                <input type="text" value={config.colors.background} onChange={(e) => setColor('background', e.target.value)}
                  className="color-hex" spellCheck="false" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="config-actions">
        <button className="btn btn-accent launch-btn" onClick={handleStart} disabled={isSaving}>
          {isSaving ? <Loader2 size={18} className="spin" /> : <Play size={18} />}
          <span>{isSaving ? 'Saving...' : 'Start'}</span>
        </button>
        <button className="btn btn-ghost share-btn" onClick={shareUrl} disabled={isSaving}>
          <Share2 size={16} /> Link
        </button>
        <button className="btn btn-ghost share-btn" onClick={shareEmbed} disabled={isSaving}>
          <Code2 size={16} /> Embed
        </button>
      </div>

      {shareToast && <div className="toast">✓ {shareToast}</div>}
    </div>
  );
}
