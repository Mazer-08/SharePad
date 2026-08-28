import React, { useState } from 'react';
import { Lock, Key, ArrowRight, ShieldAlert } from 'lucide-react';
import { verifyPassword } from '../services/api';

export default function PasswordModal({ shareCode, onUnlocked, onCancel }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyPassword(shareCode, password);
      if (res.success && res.token) {
        onUnlocked(res.token);
      } else {
        setErrorMsg('Invalid password');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 500,
      padding: '24px'
    }}>
      <div className="glass-card animate-fade-in" style={{ maxWidth: '440px', width: '100%', padding: '36px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Lock size={28} color="#f59e0b" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>
            Protected Share Room
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#9ca3af' }}>
            Share code <strong style={{ color: '#a5b4fc', fontFamily: 'Fira Code, monospace' }}>{shareCode}</strong> requires a password to unlock
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '8px', fontWeight: 500 }}>
              Access Password
            </label>
            <input 
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              onClick={onCancel}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              Cancel
            </button>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
              style={{ flex: 1, padding: '12px' }}
            >
              {loading ? 'Verifying...' : 'Unlock Room'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
