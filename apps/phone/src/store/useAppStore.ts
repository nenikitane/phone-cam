import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConnectionState, CameraPosition } from '../webrtc/webrtc';

interface AppState {
  // Connection
  roomId: string;
  setRoomId: (id: string) => void;
  signalingHost: string;
  setSignalingHost: (host: string) => void;
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;
  viewerCount: number;
  setViewerCount: (count: number) => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  
  // Camera settings
  cameraPosition: CameraPosition;
  setCameraPosition: (pos: CameraPosition) => void;
  videoEnabled: boolean;
  setVideoEnabled: (enabled: boolean) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  
  // Video quality
  videoQuality: '720p' | '1080p' | '4k';
  setVideoQuality: (quality: '720p' | '1080p' | '4k') => void;
  
  // UI
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const videoConstraintsMap = {
  '720p': { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
  '1080p': { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
  '4k': { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 30 } },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Connection
      roomId: '',
      setRoomId: (id) => set({ roomId: id }),
      signalingHost: '',
      setSignalingHost: (host) => set({ signalingHost: host }),
      connectionState: 'new',
      setConnectionState: (state) => set({ connectionState: state }),
      viewerCount: 0,
      setViewerCount: (count) => set({ viewerCount: count }),
      isStreaming: false,
      setIsStreaming: (streaming) => set({ isStreaming: streaming }),
      
      // Camera
      cameraPosition: 'back',
      setCameraPosition: (pos) => set({ cameraPosition: pos }),
      videoEnabled: true,
      setVideoEnabled: (enabled) => set({ videoEnabled: enabled }),
      audioEnabled: true,
      setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
      
      // Quality
      videoQuality: '1080p',
      setVideoQuality: (quality) => set({ videoQuality: quality }),
      
      // UI
      showSettings: false,
      setShowSettings: (show) => set({ showSettings: show }),
      error: null,
      setError: (error) => set({ error }),
    }),
    {
      name: 'phonecam-settings',
      partialize: (state) => ({
        roomId: state.roomId,
        signalingHost: state.signalingHost,
        cameraPosition: state.cameraPosition,
        videoQuality: state.videoQuality,
        videoEnabled: state.videoEnabled,
        audioEnabled: state.audioEnabled,
      }),
    }
  )
);

// Selectors
export const useVideoConstraints = () => {
  const quality = useAppStore(s => s.videoQuality);
  return videoConstraintsMap[quality];
};