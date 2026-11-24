import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VideoPreview } from './components/VideoPreview';
import { ConnectionPanel } from './components/ConnectionPanel';
import { StatsPanel } from './components/StatsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { useWebRTC } from './hooks/useWebRTC';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  const {
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
  } = useWebRTC();

  const isConnected = state === 'connected';
  const isConnecting = state === 'connecting';

  return (
    <div className="app">
      <div className="video-container">
        <VideoPreview 
          isConnected={isConnected}
          streamId={stats.streamId}
        />
        
        {/* Status Overlay */}
        <div className={`status-overlay ${state}`}>
          <div className="status-badge">
            <span className="status-dot" />
            <span className="status-text">
              {state === 'connected' && '● LIVE'}
              {state === 'connecting' && '● CONNECTING...'}
              {state === 'disconnected' && '● DISCONNECTED'}
              {state === 'failed' && '● FAILED'}
              {state === 'new' && '● READY'}
            </span>
            {isConnected && stats.viewerCount !== undefined && (
              <span className="viewer-count">· {stats.viewerCount} viewer{stats.viewerCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Room ID Display */}
        {roomId && state !== 'new' && (
          <div className="room-id-badge">
            Room: <span className="room-id-value">{roomId}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={clearError}>DISMISS</button>
          </div>
        )}
      </div>

      <div className="controls-panel">
        <ConnectionPanel
          roomId={roomId}
          setRoomId={setRoomId}
          signalingHost={signalingHost}
          setSignalingHost={setSignalingHost}
          state={state}
          onStart={start}
          onStop={stop}
          disabled={isConnecting}
        />

        <div className="control-buttons">
          <button 
            className={`btn ${isConnected ? 'btn-stop' : 'btn-start'}`}
            onClick={isConnected ? stop : start}
            disabled={isConnecting}
          >
            {isConnected ? 'STOP' : 'START STREAM'}
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => setShowStats(!showStats)}
          >
            STATS
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => setShowSettings(!showSettings)}
          >
            SETTINGS
          </button>
        </div>
      </div>

      {showStats && (
        <StatsPanel 
          stats={stats}
          onClose={() => setShowStats(false)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          roomId={roomId}
          setRoomId={setRoomId}
          signalingHost={signalingHost}
          setSignalingHost={setSignalingHost}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}