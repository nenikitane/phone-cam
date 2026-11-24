import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import * as wrtc from 'wrtc';

const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream } = wrtc;

export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export interface WebRTCReceiverConfig {
  roomId: string;
  signalingHost?: string;
}

export class WebRTCReceiver {
  private pc: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;
  private config: WebRTCReceiverConfig;
  private remoteStream: MediaStream | null = null;
  
  onConnectionStateChange?: (state: ConnectionState) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add your TURN servers here for production
  ];

  constructor(config: WebRTCReceiverConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const host = this.config.signalingHost || 'ws://localhost:8080';
      const url = `${host}/?room=${this.config.roomId}&role=viewer`;
      
      console.log('[Desktop] Connecting to signaling:', url);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[Desktop] Signaling connected');
        this.updateState('connecting');
        this.createPeerConnection();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data.toString());
          this.handleSignalingMessage(message);
        } catch (e) {
          console.error('[Desktop] Signaling parse error:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[Desktop] Signaling error:', err);
        this.onError?.(new Error('Signaling connection failed'));
        reject(err);
      };

      this.ws.onclose = () => {
        console.log('[Desktop] Signaling disconnected');
        this.updateState('disconnected');
      };
    });
  }

  async stop(): Promise<void> {
    this.pc?.close();
    this.pc = null;
    this.ws?.close();
    this.ws = null;
    this.remoteStream = null;
    this.updateState('closed');
  }

  private createPeerConnection(): void {
    this.pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        }));
      }
    };

    this.pc.ontrack = (event) => {
      console.log('[Desktop] Remote track received:', event.track.kind);
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(this.remoteStream);
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState as ConnectionState;
      console.log('[Desktop] Connection state:', state);
      this.updateState(state);
      
      if (state === 'failed') {
        this.handleConnectionFailed();
      }
    };

    // Create offer
    this.createOffer();
  }

  private async createOffer(): Promise<void> {
    if (!this.pc) return;

    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await this.pc.setLocalDescription(offer);
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'offer',
          sdp: offer.sdp,
        }));
      }
    } catch (e) {
      console.error('[Desktop] Create offer error:', e);
      this.onError?.(e as Error);
    }
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'connected':
        console.log('[Desktop] Connected as viewer:', message.clientId);
        break;

      case 'offer':
        if (this.pc) {
          try {
            await this.pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            
            if (this.ws?.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({
                type: 'answer',
                sdp: answer.sdp,
              }));
            }
          } catch (e) {
            console.error('[Desktop] Handle offer error:', e);
          }
        }
        break;

      case 'answer':
        // We're the viewer, we don't receive answers
        break;

      case 'ice-candidate':
        if (this.pc && message.candidate) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(message.candidate));
          } catch (e) {
            console.error('[Desktop] ICE candidate error:', e);
          }
        }
        break;

      case 'camera-disconnected':
        console.log('[Desktop] Camera disconnected');
        this.updateState('disconnected');
        break;

      case 'error':
        this.onError?.(new Error(message.message));
        break;
    }
  }

  private async handleConnectionFailed(): Promise<void> {
    // Try to restart ICE
    if (this.pc) {
      try {
        await this.pc.restartIce();
        console.log('[Desktop] ICE restart initiated');
      } catch (e) {
        console.error('[Desktop] ICE restart failed:', e);
      }
    }
  }

  private updateState(state: ConnectionState): void {
    this.onConnectionStateChange?.(state);
  }

  getState(): ConnectionState {
    return this.pc?.connectionState as ConnectionState || 'new';
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}