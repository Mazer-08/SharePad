import React, { useState } from 'react';
import { Plus, ArrowRight, Lock, Key, Clock, Sparkles, Code2, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home({ onCreateShare, onOpenShare }) {
  const [openCode, setOpenCode] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMsg('');
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      await onCreateShare({ password: usePassword ? password : null });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create share');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpen = async (e) => {
    e.preventDefault();
    if (!openCode.trim()) return;
    setIsOpening(true);
    setErrorMsg('');
    try {
      await onOpenShare(openCode.trim());
    } catch (err) {
      setErrorMsg(err.message || 'Share not found');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '60px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '48px'
    }} className="animate-fade-in">
      
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '680px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '30px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '20px'
        }}>
          <Sparkles size={16} /> Realtime Ephemeral Code Workspace
        </div>
        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '16px'
        }}>
          Two browsers. One <span className="gradient-text">synchronized workspace</span>.
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#9ca3af', lineHeight: 1.6 }}>
          Share code, text, and large files seamlessly in realtime. Everything automatically expires in 6 hours. Zero sign-up required.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          padding: '12px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '500px',
          width: '100%',
          fontSize: '0.9rem'
        }}>
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Action Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '28px',
        width: '100%'
      }}>
        
        {/* Create New Share Card */}
        <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
            }}>
              <Plus size={24} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Create New Share</h2>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Generate a unique ephemeral workspace link</p>
            </div>
          </div>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Password Toggle Option */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Lock size={16} color={usePassword ? '#6366f1' : '#6b7280'} />
                  <span>Password Protection</span>
                </div>
                <input 
                  type="checkbox"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                />
              </div>

              {usePassword && (
                <input 
                  type="password"
                  placeholder="Set access password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                  required={usePassword}
                />
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#9ca3af' }}>
              <Clock size={15} color="#a5b4fc" />
              <span>Expires automatically in <strong>6 hours</strong></span>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isCreating}
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              {isCreating ? 'Creating Workspace...' : 'Create Share Room'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Open Share Card */}
        <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)'
            }}>
              <Code2 size={24} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Open Existing Share</h2>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Join a workspace using a share code</p>
            </div>
          </div>

          <form onSubmit={handleOpen} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '8px', fontWeight: 500 }}>
                Share Code
              </label>
              <input 
                type="text"
                placeholder="e.g. aX72kp"
                value={openCode}
                onChange={(e) => setOpenCode(e.target.value)}
                className="glass-input"
                style={{ fontFamily: 'Fira Code, monospace', fontSize: '1.1rem', letterSpacing: '0.1em' }}
                required
              />
            </div>

            <div style={{ height: '52px' }}></div> {/* Spacer alignment */}

            <button 
              type="submit" 
              className="btn-secondary" 
              disabled={isOpening || !openCode.trim()}
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              {isOpening ? 'Joining Workspace...' : 'Open Share Workspace'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
