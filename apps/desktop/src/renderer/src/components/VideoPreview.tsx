import React, { useEffect, useRef } from 'react';

interface VideoPreviewProps {
  isConnected: boolean;
  streamId?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ isConnected, streamId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isConnected) {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      return;
    }

    // In a real implementation, the stream would be passed from the main process
    // via IPC. For now, we'll show a placeholder.
    // The actual WebRTC stream handling happens in the main process.
  }, [isConnected, streamId]);

  if (!isConnected) {
    return (
      <div className="video-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <p>Waiting for connection...</p>
        <p style={{fontSize: '13px', opacity: 0.6}}>Start streaming from your phone</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
};