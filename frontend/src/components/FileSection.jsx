import React, { useState, useRef } from 'react';
import { UploadCloud, File, FileText, Image, Archive, Download, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';
import { presignUpload, uploadDirectToPresignedUrl, completeUpload } from '../services/api';

export default function FileSection({ shareCode, token, files = [], onFileUploaded, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType, fileName) => {
    if (contentType?.includes('image') || fileName.match(/\.(png|jpe?g|gif|webp|svg)$/i)) {
      return <Image size={20} color="#38bdf8" />;
    }
    if (fileName.match(/\.(zip|tar|gz|7z|rar)$/i)) {
      return <Archive size={20} color="#f59e0b" />;
    }
    if (contentType?.includes('pdf') || fileName.match(/\.(pdf|doc|docx|txt|md)$/i)) {
      return <FileText size={20} color="#a78bfa" />;
    }
    return <File size={20} color="#9ca3af" />;
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setCurrentFileName(selectedFile.name);

    try {
      // 1. Request presigned upload URL from Spring Boot
      const presignRes = await presignUpload(shareCode, {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        contentType: selectedFile.type,
      }, token);

      // 2. Direct upload file bytes to presigned URL (R2 or Local storage)
      await uploadDirectToPresignedUrl(presignRes.uploadUrl, selectedFile, (percent) => {
        setUploadProgress(percent);
      });

      // 3. Notify backend upload completion to save metadata and broadcast WS event
      const completeRes = await completeUpload(shareCode, {
        fileId: presignRes.fileId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        contentType: selectedFile.type,
        storageKey: presignRes.storageKey,
      }, token);

      if (onFileUploaded) onFileUploaded(completeRes);
    } catch (err) {
      if (onError) onError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setCurrentFileName('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HardDrive size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Shared Files</h3>
          <span style={{ fontSize: '0.78rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Direct S3/R2 Storage Stream</span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '14px',
          padding: '28px',
          textAlign: 'center',
          background: isDragging ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.4)',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          disabled={uploading}
        />

        <UploadCloud size={36} color={isDragging ? '#38bdf8' : '#9ca3af'} style={{ marginBottom: '8px' }} />
        
        {uploading ? (
          <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8' }}>
              Uploading {currentFileName} ({uploadProgress}%)
            </span>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', transition: 'width 0.1s linear' }} />
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f3f4f6' }}>
              Drag & drop files here, or <span style={{ color: '#38bdf8' }}>browse</span>
            </p>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
              Supports images, documents, archives up to 500 MB
            </p>
          </div>
        )}
      </div>

      {/* Shared File Listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {files.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>
            No files attached yet. Drop a file above to share with connected clients.
          </p>
        ) : (
          files.map((file) => (
            <div key={file.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {getFileIcon(file.contentType, file.fileName)}
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '2px' }}>
                    {file.fileName}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontFamily: 'Fira Code, monospace' }}>
                    {formatFileSize(file.fileSize)}
                  </span>
                </div>
              </div>

              <a 
                href={file.downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                download
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', height: '36px', textDecoration: 'none' }}
              >
                <Download size={14} color="#38bdf8" /> Download
              </a>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
