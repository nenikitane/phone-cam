import React from 'react';

interface StatsPanelProps {
  stats: {
    streamId?: string;
    viewerCount?: number;
    bitrate?: number;
    fps?: number;
    resolution?: string;
    rtt?: number;
    packetsLost?: number;
  };
  onClose: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, onClose }) => {
  const formatBitrate = (bps?: number) => {
    if (!bps) return '—';
    if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
    if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} Kbps`;
    return `${bps} bps`;
  };

  const getRttClass = (rtt?: number) => {
    if (!rtt) return '';
    if (rtt < 100) return 'good';
    if (rtt < 300) return 'warn';
    return 'bad';
  };

  const getLossClass = (lost?: number) => {
    if (!lost) return '';
    if (lost < 1) return 'good';
    if (lost < 5) return 'warn';
    return 'bad';
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>STREAM STATISTICS</h2>
          <button className="panel-close" onClick={onClose}>×</button>
        </div>
        <div className="panel-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Status</div>
              <div className="stat-value">{stats.streamId ? 'Active' : 'Inactive'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Viewers</div>
              <div className="stat-value">{stats.viewerCount || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Bitrate</div>
              <div className="stat-value">{formatBitrate(stats.bitrate)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">FPS</div>
              <div className="stat-value">{stats.fps || '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Resolution</div>
              <div className="stat-value">{stats.resolution || '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Round-trip Time</div>
              <div className={`stat-value ${getRttClass(stats.rtt)}`}>
                {stats.rtt ? `${stats.rtt} ms` : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Packet Loss</div>
              <div className={`stat-value ${getLossClass(stats.packetsLost)}`}>
                {stats.packetsLost !== undefined ? `${stats.packetsLost}%` : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Stream ID</div>
              <div className="stat-value" style={{fontSize: '11px', fontFamily: 'monospace'}}>
                {stats.streamId?.slice(0, 20) || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};