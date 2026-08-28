import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const bgColors = {
    error: 'rgba(239, 68, 68, 0.9)',
    success: 'rgba(16, 185, 129, 0.9)',
    info: 'rgba(99, 102, 241, 0.9)',
  };

  const icons = {
    error: <AlertCircle size={18} color="#fff" />,
    success: <CheckCircle size={18} color="#fff" />,
    info: <Info size={18} color="#fff" />,
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: bgColors[type] || bgColors.info,
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '10px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease'
    }}>
      {icons[type]}
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
      <button 
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
