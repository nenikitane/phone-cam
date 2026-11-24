import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  registerGlobals,
} from 'react-native-webrtc';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Camera from 'expo-camera';
import * as Audio from 'expo-av';
import { SignalingClient, SignalingMessage } from './signaling';

// Register WebRTC globals for react-native-webrtc
registerGlobals();

export interface WebRTCConfig {
  roomId: string;
  signalingHost?: string;
  videoConstraints?: MediaTrackConstraints;
  audioConstraints?: MediaTrackConstraints;
}

export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
export type CameraPosition = 'front' | 'back';

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private signaling: SignalingClient;
  private config: WebRTCConfig;
  private viewers: Map<string, RTCPeerConnection> = new Map();
  
  // Callbacks
  onConnectionStateChange?: (state: ConnectionState) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
  onViewerCountChange?: (count: number) => void;

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Добавь свои TURN серверы для продакшена
    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' },
  ];

  constructor(config: WebRTCConfig) {
    this.config = config;
    this.signaling = new SignalingClient(config.roomId, 'camera', config.signalingHost);
    
    this.signaling.onMessage(this.handleSignalingMessage.bind(this));
  }

  async start(): Promise<void> {
    try {
      // Request permissions
      await this.requestPermissions();
      
      // Get local media stream
      this.localStream = await this.getUserMedia();
      this.onLocalStream?.(this.localStream);

      // Connect to signaling
      await this.signaling.connect();

      this.updateConnectionState('connecting');
    } catch (error) {
      this.onError?.(error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    // Close all peer connections
    this.viewers.forEach(pc => pc.close());
    this.viewers.clear();

    // Stop local stream
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;

    // Disconnect signaling
    this.signaling.disconnect();

    this.updateConnectionState('disconnected');
  }

  async switchCamera(position: CameraPosition): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Get new stream with different camera
    const newStream = await this.getUserMedia({ 
      video: { facingMode: position === 'front' ? 'user' : 'environment' } 
    });
    
    const newVideoTrack = newStream.getVideoTracks()[0];
    if (!newVideoTrack) return;

    // Replace track in all peer connections
    this.viewers.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(newVideoTrack);
      }
    });

    // Stop old video track
    videoTrack.stop();
    
    // Update local stream
    this.localStream.removeTrack(videoTrack);
    this.localStream.addTrack(newVideoTrack);
  }

  async toggleAudio(enabled: boolean): Promise<void> {
    this.localStream?.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  }

  async toggleVideo(enabled: boolean): Promise<void> {
    this.localStream?.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  }

  private async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      
      if (granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Camera or microphone permission denied');
      }
    } else {
      const cameraPerm = await Camera.requestCameraPermissionsAsync();
      const audioPerm = await Audio.requestPermissionsAsync();
      
      if (!cameraPerm.granted || !audioPerm.granted) {
        throw new Error('Camera or microphone permission denied');
      }
    }
  }

  private async getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    const videoConstraints = this.config.videoConstraints || {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
      facingMode: 'environment',
    };

    const audioConstraints = this.config.audioConstraints || {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2,
    };

    const finalConstraints = constraints || {
      video: videoConstraints,
      audio: audioConstraints,
    };

    const stream = await mediaDevices.getUserMedia(finalConstraints);
    return stream;
  }

  private createPeerConnection(viewerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    // Add local tracks
    this.localStream?.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream!);
    });

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendIceCandidate(event.candidate.toJSON());
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Viewer ${viewerId} state:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.handleViewerDisconnect(viewerId);
      }
    };

    // Track events
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind);
    };

    return pc;
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    switch (message.type) {
      case 'connected':
        console.log('[Signaling] Connected as camera, clientId:', message.clientId);
        break;

      case 'answer':
        const pc = this.viewers.get(message.from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        }
        break;

      case 'ice-candidate':
        const pcForCandidate = this.viewers.get(message.from);
        if (pcForCandidate && message.candidate) {
          try {
            await pcForCandidate.addIceCandidate(new RTCIceCandidate(message.candidate));
          } catch (e) {
            console.error('[WebRTC] ICE candidate error:', e);
          }
        }
        break;

      case 'viewer-left':
        this.handleViewerDisconnect(message.viewerId);
        break;

      case 'viewers-list':
        this.onViewerCountChange?.(message.viewers.length);
        // Create peer connections for existing viewers
        for (const viewer of message.viewers) {
          if (!this.viewers.has(viewer.id)) {
            await this.createOfferForViewer(viewer.id);
          }
        }
        break;

      case 'camera-disconnected':
        // Shouldn't happen for camera role
        break;

      case 'error':
        this.onError?.(new Error(message.message));
        break;
    }
  }

  private async createOfferForViewer(viewerId: string): Promise<void> {
    const pc = this.createPeerConnection(viewerId);
    this.viewers.set(viewerId, pc);

    const offer = await pc.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });
    
    await pc.setLocalDescription(offer);
    this.signaling.sendOffer(offer.sdp!);
  }

  private handleViewerDisconnect(viewerId: string): void {
    const pc = this.viewers.get(viewerId);
    if (pc) {
      pc.close();
      this.viewers.delete(viewerId);
      this.onViewerCountChange?.(this.viewers.size);
    }
  }

  private updateConnectionState(state: ConnectionState): void {
    this.onConnectionStateChange?.(state);
  }

  getViewerCount(): number {
    return this.viewers.size;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getConnectionState(): ConnectionState {
    // Return state based on first viewer or 'new'
    const firstPc = this.viewers.values().next().value;
    return firstPc?.connectionState as ConnectionState || 'new';
  }
}