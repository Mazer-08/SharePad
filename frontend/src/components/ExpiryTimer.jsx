import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function ExpiryTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const target = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setIsWarning(diff < 15 * 60 * 1000); // Less than 15 mins

      const pad = (n) => String(n).padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 14px',
      borderRadius: '20px',
      background: isWarning ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${isWarning ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
      color: isWarning ? '#f87171' : '#a5b4fc',
      fontSize: '0.85rem',
      fontWeight: 600
    }}>
      <Clock size={15} color={isWarning ? '#f87171' : '#a5b4fc'} />
      <span>Expires in <strong style={{ fontFamily: 'Fira Code, monospace' }}>{timeLeft}</strong></span>
    </div>
  );
}
