export class ShareWebSocket {
  constructor(shareCode, token = null, callbacks = {}) {
    this.shareCode = shareCode;
    this.token = token;
    this.callbacks = callbacks; // { onInitState, onTextUpdate, onFileAdded, onPresence, onError, onStatusChange }
    this.ws = null;
    this.reconnectTimer = null;
    this.isExplicitClose = false;
    this.debounceTimer = null;
  }

  connect() {
    this.isExplicitClose = false;
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
    let url = `${baseUrl}?code=${encodeURIComponent(this.shareCode)}`;
    if (this.token) {
      url += `&token=${encodeURIComponent(this.token)}`;
    }

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        if (this.callbacks.onStatusChange) this.callbacks.onStatusChange('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      this.ws.onclose = (event) => {
        if (this.callbacks.onStatusChange) this.callbacks.onStatusChange('disconnected');
        if (!this.isExplicitClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        if (this.callbacks.onError) this.callbacks.onError(error);
      };
    } catch (e) {
      console.error('WebSocket connection error', e);
      this.scheduleReconnect();
    }
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'INIT_STATE':
        if (this.callbacks.onInitState) this.callbacks.onInitState(msg);
        break;
      case 'TEXT_UPDATE':
        if (this.callbacks.onTextUpdate) this.callbacks.onTextUpdate(msg.text);
        break;
      case 'FILE_ADDED':
        if (this.callbacks.onFileAdded) this.callbacks.onFileAdded(msg.file);
        break;
      case 'PRESENCE':
        if (this.callbacks.onPresence) this.callbacks.onPresence(msg.activeUsers);
        break;
      case 'ERROR':
        if (this.callbacks.onError) this.callbacks.onError(new Error(msg.text));
        break;
      default:
        break;
    }
  }

  sendTextUpdate(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      const payload = JSON.stringify({
        type: 'TEXT_UPDATE',
        shareCode: this.shareCode,
        text: text,
      });
      this.ws.send(payload);
    }, 150); // 150ms debounce for ultra-smooth typing feel
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitClose) {
        this.connect();
      }
    }, 3000);
  }

  disconnect() {
    this.isExplicitClose = true;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
    }
  }
}
