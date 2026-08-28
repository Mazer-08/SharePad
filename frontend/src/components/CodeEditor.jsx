import React, { useState, useRef, useEffect } from 'react';
import { Code, Copy, Check, Trash2, Wifi } from 'lucide-react';

export default function CodeEditor({ text, onChange, syncStatus }) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const lines = (text || '').split('\n');
  const lineCount = lines.length;

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (window.confirm('Clear workspace text content?')) {
      onChange('');
    }
  };

  const handleKeyDown = (e) => {
    // Support Tab indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = text || '';
      const newText = val.substring(0, start) + '  ' + val.substring(end);
      onChange(newText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="code-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '420px' }}>
      
      {/* Editor Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'rgba(15, 23, 42, 0.9)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#a5b4fc' }}>
            <Code size={16} />
            <span>Shared Code Buffer</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>
            <Wifi size={12} color={syncStatus === 'connected' ? '#10b981' : '#f59e0b'} />
            <span>{syncStatus === 'connected' ? 'Live Synced' : 'Reconnecting...'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#6b7280', fontSize: '0.8rem', fontFamily: 'Fira Code, monospace' }}>
            Lines: {lineCount} | Chars: {(text || '').length}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleCopy}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Copy all code"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button 
              onClick={handleClear}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#f87171' }}
              title="Clear text"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Text Editor Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* Line Numbers Sidebar */}
        <div 
          ref={lineNumbersRef}
          style={{
            padding: '16px 12px 16px 16px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#4b5563',
            fontFamily: 'Fira Code, monospace',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            userSelect: 'none',
            textAlign: 'right',
            overflowY: 'hidden',
            minWidth: '50px'
          }}
        >
          {Array.from({ length: lineCount }).map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>

        {/* Text Area Input */}
        <textarea
          ref={textareaRef}
          className="code-textarea"
          value={text || ''}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder="// Paste or start typing code/text here... Any client connected to this share will see edits in real-time."
          spellCheck={false}
          style={{ flex: 1 }}
        />
      </div>

    </div>
  );
}
