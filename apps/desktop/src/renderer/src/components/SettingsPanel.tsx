import React from 'react';

interface SettingsPanelProps {
  roomId: string;
  setRoomId: (id: string) => void;
  signalingHost: string;
  setSignalingHost: (host: string) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  roomId,
  setRoomId,
  signalingHost,
  setSignalingHost,
  onClose,
}) => {
  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>SETTINGS</h2>
          <button className="panel-close" onClick={onClose}>×</button>
        </div>
        <div className="panel-content">
          <div className="panel-section">
            <h3>Connection</h3>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Room ID</div>
                <div className="setting-hint">Unique identifier for the streaming session</div>
              </div>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontFamily: 'monospace',
                  minWidth: '180px',
                }}
              />
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Signaling Server</div>
                <div className="setting-hint">WebSocket URL (leave empty for default)</div>
              </div>
              <input
                type="text"
                value={signalingHost}
                onChange={(e) => setSignalingHost(e.target.value)}
                placeholder="ws://your-server.com:8080"
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontFamily: 'monospace',
                  minWidth: '220px',
                }}
              />
            </div>
          </div>

          <div className="panel-section">
            <h3>About</h3>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">PhoneCam Desktop</div>
                <div className="setting-hint">Version 1.0.0</div>
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Protocol</div>
                <div className="setting-hint">WebRTC with custom signaling</div>
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">GitHub</div>
                <div className="setting-hint">github.com/yourusername/phone-cam</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};