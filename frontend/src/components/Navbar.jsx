import React from 'react';
import { Sparkles, Shield, Zap } from 'lucide-react';

export default function Navbar({ onGoHome }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(9, 13, 22, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div 
        onClick={onGoHome}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
        }}>
          <Zap size={20} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SharePad
          </span>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366f1', marginLeft: '8px', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
            EPHEMERAL
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#9ca3af', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Shield size={14} color="#10b981" />
          <span>Direct Storage & Ephemeral Purge</span>
        </div>
      </div>
    </header>
  );
}
