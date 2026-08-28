import React, { useState } from 'react';
import { Copy, Check, Users, Lock, Unlock, Share2, ArrowLeft } from 'lucide-react';
import ExpiryTimer from './ExpiryTimer';

export default function ShareHeader({ shareCode, hasPassword, activeUsers, expiresAt, onGoHome, onExpire }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + '/share/' + shareCode;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '20px 24px',
      background: 'rgba(17, 24, 39, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onGoHome}
          className="btn-secondary"
          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          title="Back to Home"
        >
          <ArrowLeft size={16} /> Home
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>Share Code:</span>
          <span style={{
            fontFamily: 'Fira Code, monospace',
            fontSize: '1.2rem',
            fontWeight: 700,
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            padding: '4px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            letterSpacing: '0.05em'
          }}>
            {shareCode}
          </span>

          <button 
            onClick={handleCopyLink}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', height: '36px' }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied Link!' : 'Copy Share Link'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Active users badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#34d399',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
          <Users size={15} />
          <span>{activeUsers || 1} connected</span>
        </div>

        {/* Lock status badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.85rem',
          color: '#9ca3af'
        }}>
          {hasPassword ? <Lock size={14} color="#f59e0b" /> : <Unlock size={14} color="#6b7280" />}
          <span>{hasPassword ? 'Protected' : 'Public Link'}</span>
        </div>

        {/* Expiry countdown */}
        <ExpiryTimer expiresAt={expiresAt} onExpire={onExpire} />
      </div>

    </div>
  );
}
