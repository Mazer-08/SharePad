import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Workspace from './components/Workspace';
import Toast from './components/Toast';
import { createShare } from './services/api';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleCreateShare = async (options) => {
    const res = await createShare(options);
    if (res && res.code) {
      showToast(`Share created! Code: ${res.code}`, 'success');
      navigateTo(`/share/${res.code}`);
    }
  };

  const handleOpenShare = async (code) => {
    navigateTo(`/share/${code}`);
  };

  // Route matching
  const shareMatch = currentPath.match(/^\/share\/([a-zA-Z0-9_-]+)/);
  const currentShareCode = shareMatch ? shareMatch[1] : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onGoHome={() => navigateTo('/')} />

      <main style={{ flex: 1 }}>
        {currentShareCode ? (
          <Workspace 
            shareCode={currentShareCode} 
            onGoHome={() => navigateTo('/')}
            showToast={showToast}
          />
        ) : (
          <Home 
            onCreateShare={handleCreateShare}
            onOpenShare={handleOpenShare}
          />
        )}
      </main>

      {toast.message && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ message: '', type: 'info' })} 
        />
      )}
    </div>
  );
}
