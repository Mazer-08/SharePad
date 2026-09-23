const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export async function createShare({ password, ttlHours = 6, initialContent = '' } = {}) {
  const response = await fetch(`${API_BASE_URL}/newShare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, ttlHours, initialContent }),
  });
  if (!response.ok) {
    throw new Error('Failed to create new share');
  }
  return response.json();
}

export async function getShare(code, token = null) {
  const headers = {};
  if (token) {
    headers['X-Share-Token'] = token;
  }
  const response = await fetch(`${API_BASE_URL}/share/${code}`, { headers });
  if (response.status === 404) {
    throw new Error('Share not found or expired');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch share metadata');
  }
  return response.json();
}

export async function verifyPassword(code, password) {
  const response = await fetch(`${API_BASE_URL}/share/${code}/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Invalid password');
  }
  return data;
}

export async function presignUpload(code, fileInfo, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['X-Share-Token'] = token;

  const response = await fetch(`${API_BASE_URL}/share/${code}/files/presign-upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fileInfo),
  });
  if (!response.ok) {
    throw new Error('Failed to request presigned upload URL');
  }
  return response.json();
}

export async function uploadDirectToPresignedUrl(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Direct upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during file upload'));
    xhr.send(file);
  });
}

export async function completeUpload(code, completeInfo, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['X-Share-Token'] = token;

  const response = await fetch(`${API_BASE_URL}/share/${code}/files/complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify(completeInfo),
  });
  if (!response.ok) {
    throw new Error('Failed to complete upload');
  }
  return response.json();
}
