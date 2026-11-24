import { useState, useEffect, useCallback, useRef } from 'react';

interface WebRTCStats {
  streamId?: string;
  viewerCount?: number;
  bitrate?: number;
  fps?: number;
  resolution?: string;
  rtt?: number;
  packetsLost?: number;
}

interface UseWebRTCReturn {
  state: string;
  roomId: string;
  setRoomId: (id: string) => void;
  signalingHost: string;
  setSignalingHost: (host: string) => void;
  start: () => void;
  stop: () => void;
  error: string | null;
  clearError: () => void;
  stats: WebRTCStats;
}

export function useWebRTC(): UseWebRTCReturn {
  const [state, setState] = useState<string>('new');
  const [roomId, setRoomId] = useState('');
  const [signalingHost, setSignalingHost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WebRTCStats>({});
  
  const startRef = useRef<() => Promise<void>>();
  const stopRef = useRef<() => Promise<void>>();

  // Listen for IPC events from main process
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubState = window.electronAPI.webrtc.onStateChange(setState);
    const unsubError = window.electronAPI.webrtc.onError(setError);
    const unsubStream = window.electronAPI.webrtc.onStream((streamId) => {
      setStats(s => ({ ...s, streamId }));
    });

    return () => {
      unsubState();
      unsubError();
      unsubStream();
    };
  }, []);

  const start = useCallback(async () => {
    if (!roomId.trim()) {
      setError('Please enter a Room ID');
      return;
    }

    setError(null);
    
    try {
      const result = await window.electronAPI!.webrtc.start({
        roomId,
        signalingHost: signalingHost || undefined,
      });
      
      if (!result.success) {
        setError(result.error || 'Failed to start streaming');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }, [roomId, signalingHost]);

  const stop = useCallback(async () => {
    try {
      await window.electronAPI!.webrtc.stop();
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state,
    roomId,
    setRoomId,
    signalingHost,
    setSignalingHost,
    start,
    stop,
    error,
    clearError,
    stats,
  };
}