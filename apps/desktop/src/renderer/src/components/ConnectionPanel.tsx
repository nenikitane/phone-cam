import React from 'react';

interface ConnectionPanelProps {
  roomId: string;
  setRoomId: (id: string) => void;
  signalingHost: string;
  setSignalingHost: (host: string) => void;
  state: string;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  roomId,
  setRoomId,
  signalingHost,
  setSignalingHost,
  state,
  onStart,
  onStop,
  disabled,
}) => {
  const isConnected = state === 'connected';

  return (
    <div className="connection-panel">
      <h3>CONNECTION</h3>
      <div className="input-group">
        <label>
          <span>Room ID</span>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID"
            disabled={isConnected}
            autoComplete="off"
          />
        </label>
        <label className="small">
          <span>Signaling Server (optional)</span>
          <input
            type="text"
            value={signalingHost}
            onChange={(e) => setSignalingHost(e.target.value)}
            placeholder="ws://localhost:8080"
            disabled={isConnected}
            autoComplete="off"
          />
        </label>
      </div>
    </div>
  );
};