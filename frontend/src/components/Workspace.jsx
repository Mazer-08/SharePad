import React, { useState, useEffect, useRef } from 'react';
import ShareHeader from './ShareHeader';
import CodeEditor from './CodeEditor';
import FileSection from './FileSection';
import PasswordModal from './PasswordModal';
import { getShare } from '../services/api';
import { ShareWebSocket } from '../services/websocket';
import { AlertTriangle, Home as HomeIcon } from 'lucide-react';

export default function Workspace({ shareCode, initialToken = null, onGoHome, showToast }) {
  const [shareData, setShareData] = useState(null);
  const [token, setToken] = useState(initialToken);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [activeUsers, setActiveUsers] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [errorMsg, setErrorMsg] = useState('');

  const wsRef = useRef(null);

  // Fetch initial share metadata
  const fetchMetadata = async (activeToken) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getShare(shareCode, activeToken);
      setShareData(data);
      setIsLocked(!data.unlocked && data.hasPassword);
      if (data.unlocked) {
        setText(data.content || '');
        setFiles(data.files || []);
      }
    } catch (err) {
      if (err.message?.includes('expired') || err.message?.includes('not found')) {
        setIsExpired(true);
      } else {
        setErrorMsg(err.message || 'Error loading share');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata(token);
  }, [shareCode]);

  // Setup WebSocket connection when unlocked
  useEffect(() => {
    if (loading || isLocked || isExpired || !shareData) return;

    const ws = new ShareWebSocket(shareCode, token, {
      onInitState: (msg) => {
        if (msg.text !== undefined) setText(msg.text);
        if (msg.activeUsers !== undefined) setActiveUsers(msg.activeUsers);
        if (msg.payload?.files) setFiles(msg.payload.files);
        setSyncStatus('connected');
      },
      onTextUpdate: (newText) => {
        setText(newText);
      },
      onFileAdded: (newFile) => {
        setFiles((prev) => {
          if (prev.some((f) => f.id === newFile.id)) return prev;
          return [newFile, ...prev];
        });
        showToast(`New file shared: ${newFile.fileName}`, 'info');
      },
      onPresence: (count) => {
        setActiveUsers(count);
      },
      onStatusChange: (status) => {
        setSyncStatus(status);
      },
      onError: (err) => {
        console.error('WS Error:', err);
        showToast(err.message || 'Realtime sync error', 'error');
      },
    });

    ws.connect();
    wsRef.current = ws;

    return () => {
      ws.disconnect();
    };
  }, [shareCode, token, isLocked, isExpired, loading]);

  const handleTextChange = (newText) => {
    setText(newText);
    if (wsRef.current) {
      wsRef.current.sendTextUpdate(newText);
    }
  };

  const handlePasswordUnlocked = (newToken) => {
    setToken(newToken);
    setIsLocked(false);
    fetchMetadata(newToken);
    showToast('Workspace unlocked successfully!', 'success');
  };

  const handleFileUploaded = (fileEvent) => {
    setFiles((prev) => [fileEvent, ...prev]);
    showToast(`File "${fileEvent.fileName}" attached to share!`, 'success');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>Loading workspace <strong>{shareCode}</strong>...</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '40px' }} className="glass-card animate-fade-in">
        <AlertTriangle size={48} color="#f87171" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>Share Workspace Expired</h2>
        <p style={{ color: '#9ca3af', lineHeight: 1.6, marginBottom: '24px' }}>
          This share code (<strong style={{ fontFamily: 'Fira Code, monospace', color: '#f3f4f6' }}>{shareCode}</strong>) has reached its 6-hour lifespan and all associated files have been permanently purged.
        </p>
        <button onClick={onGoHome} className="btn-primary">
          <HomeIcon size={16} /> Return to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Password Unlock Modal Overlay */}
      {isLocked && (
        <PasswordModal 
          shareCode={shareCode} 
          onUnlocked={handlePasswordUnlocked} 
          onCancel={onGoHome} 
        />
      )}

      {/* Share Header */}
      <ShareHeader 
        shareCode={shareCode}
        hasPassword={shareData?.hasPassword}
        activeUsers={activeUsers}
        expiresAt={shareData?.expiresAt}
        onGoHome={onGoHome}
        onExpire={() => setIsExpired(true)}
      />

      {/* Main Workspace Split Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Code Editor */}
        <CodeEditor 
          text={text} 
          onChange={handleTextChange} 
          syncStatus={syncStatus} 
        />

        {/* Files Dropzone & Listing */}
        <FileSection 
          shareCode={shareCode}
          token={token}
          files={files}
          onFileUploaded={handleFileUploaded}
          onError={(msg) => showToast(msg, 'error')}
        />
      </div>

    </div>
  );
}
