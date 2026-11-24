import { Platform } from 'react-native';

export type SignalingMessage =
  | { type: 'connected'; clientId: string; roomId: string; role: 'camera' | 'viewer' }
  | { type: 'offer'; sdp: string; from: string }
  | { type: 'answer'; sdp: string; from: string }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit; from: string }
  | { type: 'camera-disconnected' }
  | { type: 'viewer-left'; viewerId: string }
  | { type: 'viewers-list'; viewers: { id: string }[] }
  | { type: 'error'; message: string };

type MessageHandler = (msg: SignalingMessage) => void;

export class SignalingClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private roomId: string;
  private role: 'camera' | 'viewer';

  constructor(roomId: string, role: 'camera' | 'viewer', signalingHost?: string) {
    this.roomId = roomId;
    this.role = role;
    
    const host = signalingHost || this.getDefaultSignalingHost();
    const protocol = host.startsWith('https') || host.startsWith('wss') ? 'wss' : 'ws';
    const cleanHost = host.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
    this.url = `${protocol}://${cleanHost}/?room=${roomId}&role=${role}`;
  }

  private getDefaultSignalingHost(): string {
    // В dev режиме подключаемся к localhost
    // В проде - к твоему серверу
    if (__DEV__) {
      // Для Android эмулятора используем 10.0.2.2
      // Для iOS симулятора - localhost
      // Для реальных устройств - IP компьютера в локальной сети
      if (Platform.OS === 'android') {
        return 'ws://10.0.2.2:8080';
      }
      return 'ws://localhost:8080';
    }
    // Продакшн URL - замени на свой
    return 'wss://your-signaling-server.com';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('[Signaling] Connected to', this.url);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as SignalingMessage;
            this.handlers.forEach(h => h(message));
          } catch (e) {
            console.error('[Signaling] Parse error:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.error('[Signaling] Error:', err);
          if (this.reconnectAttempts === 0) {
            reject(err);
          }
        };

        this.ws.onclose = () => {
          console.log('[Signaling] Disconnected');
          this.attemptReconnect();
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Signaling] Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[Signaling] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(), delay);
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(message: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[Signaling] Cannot send, not connected');
    }
  }

  sendOffer(sdp: string) {
    this.send({ type: 'offer', sdp });
  }

  sendAnswer(sdp: string) {
    this.send({ type: 'answer', sdp });
  }

  sendIceCandidate(candidate: RTCIceCandidateInit) {
    this.send({ type: 'ice-candidate', candidate });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}