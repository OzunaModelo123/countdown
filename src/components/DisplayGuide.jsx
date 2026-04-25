import React from 'react';
import { X, Tv, Code2, Monitor, Smartphone, Copy, ExternalLink } from 'lucide-react';

export default function DisplayGuide({ isOpen, onClose, cloudUrl }) {
  if (!isOpen) return null;

  const embedCode = `<iframe src="${cloudUrl}&embed=true" width="100%" height="400" style="border:none; border-radius:12px; background:transparent;"></iframe>`;
  const displayUrl = `${cloudUrl}&mode=display`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cloudUrl)}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="guide-overlay" onClick={onClose}>
      <div className="guide-content glass" onClick={e => e.stopPropagation()}>
        <button className="guide-close" onClick={onClose}><X size={24} /></button>
        
        <h2>Display & Embed Guide</h2>

        <div className="guide-section">
          <h3><Tv size={20} /> Retail & Office Displays</h3>
          <p>Perfect for TVs, monitor walls, or storefront tablets. Use "Display Mode" to hide all buttons and auto-scale for large screens.</p>
          <div className="guide-code">{displayUrl}</div>
          <button className="btn btn-ghost" style={{marginTop: '12px'}} onClick={() => window.open(displayUrl, '_blank')}>
            <ExternalLink size={14} /> Open in Display Mode
          </button>
        </div>

        <div className="guide-section">
          <h3><Code2 size={20} /> Website Embedding</h3>
          <p>Add this countdown to your Shopify, WordPress, or custom site. Copy this snippet:</p>
          <div className="guide-code">{embedCode}</div>
          <button className="btn btn-ghost" style={{marginTop: '12px'}} onClick={() => copyToClipboard(embedCode)}>
            <Copy size={14} /> Copy Snippet
          </button>
        </div>

        <div className="guide-section">
          <h3><Smartphone size={20} /> Mobile Handoff (QR Code)</h3>
          <p>Let customers "take the moment with them" by scanning this code to open the countdown on their phone.</p>
          <div className="qr-preview">
            <img src={qrUrl} alt="QR Code" />
            <span>Scan to View</span>
          </div>
        </div>

        <div className="guide-section">
          <h3><Monitor size={20} /> Kiosk Protection</h3>
          <p>When running in a store, use the <code>&mode=display</code> URL parameter. This disables the mouse cursor and all interactive elements, preventing customers from tampering with your settings.</p>
        </div>
      </div>
    </div>
  );
}
