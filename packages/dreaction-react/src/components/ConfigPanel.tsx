import React, { useState } from 'react';
import { useDReactionConfig } from '../hooks';

export interface ConfigPanelProps {
  /**
   * Initial collapsed state
   */
  defaultCollapsed?: boolean;
  /**
   * Position of the panel
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ConfigPanel({
  defaultCollapsed = true,
  position = 'top-right',
}: ConfigPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const {
    host,
    port,
    isConnected,
    updateHost,
    updatePort,
    connect,
    disconnect,
  } = useDReactionConfig();

  const [localHost, setLocalHost] = useState(host);
  const [localPort, setLocalPort] = useState(port.toString());

  const handleConnect = () => {
    updateHost(localHost);
    updatePort(parseInt(localPort, 10));
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const positionStyles = {
    'top-right': { top: '12px', right: '12px' },
    'top-left': { top: '12px', left: '12px' },
    'bottom-right': { bottom: '12px', right: '12px' },
    'bottom-left': { bottom: '12px', left: '12px' },
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    ...positionStyles[position],
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderRadius: isCollapsed ? '6px' : '8px',
    boxShadow: isCollapsed
      ? '0 2px 8px rgba(0, 0, 0, 0.2)'
      : '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    width: isCollapsed ? '120px' : '280px',
    transition:
      'width 0.2s ease-in-out, border-radius 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  };

  const headerStyle: React.CSSProperties = {
    padding: '2px 6px',
    borderBottom: isCollapsed ? '1px solid transparent' : '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transition: 'border-bottom 0.2s ease-in-out',
  };

  const bodyStyle: React.CSSProperties = {
    padding: isCollapsed ? '0 16px' : '16px',
    maxHeight: isCollapsed ? '0' : '400px',
    overflow: 'hidden',
    opacity: isCollapsed ? 0 : 1,
    transition:
      'max-height 0.2s ease-in-out, opacity 0.2s ease-in-out, padding 0.2s ease-in-out',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    marginTop: '4px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    marginTop: '12px',
    backgroundColor: isConnected ? '#dc2626' : '#10b981',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const statusStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    marginTop: '8px',
    backgroundColor: isConnected ? '#065f46' : '#7c2d12',
    borderRadius: '4px',
    fontSize: '13px',
  };

  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isConnected ? '#10b981' : '#ef4444',
    marginRight: '8px',
  };

  const labelStyle: React.CSSProperties = {
    marginTop: '12px',
    marginBottom: '4px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#a0a0a0',
  };

  const statusIndicatorStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: isConnected ? '#10b981' : '#ef4444',
    marginLeft: '8px',
    flexShrink: 0,
    transition: 'background-color 0.2s ease-in-out',
    boxShadow: isConnected
      ? '0 0 8px rgba(16, 185, 129, 0.6)'
      : '0 0 12px rgba(239, 68, 68, 0.8)',
    animation: isConnected
      ? 'none'
      : 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.3;
              transform: scale(1.3);
            }
          }
        `}
      </style>
      <div style={panelStyle}>
        <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontWeight: '600',
                fontSize: '10px',
              }}
            >
              ⚛️&nbsp;DReaction
            </div>
            {isCollapsed && <div style={statusIndicatorStyle}></div>}
          </div>
          <div
            style={{
              fontSize: '14px',
              marginLeft: '4px',
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            ▼
          </div>
        </div>

        <div style={bodyStyle}>
          <div style={statusStyle}>
            <div style={dotStyle}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>

          <div style={labelStyle}>Host</div>
          <input
            type="text"
            value={localHost}
            onChange={(e) => setLocalHost(e.target.value)}
            placeholder="localhost"
            style={inputStyle}
            disabled={isConnected}
          />

          <div style={labelStyle}>Port</div>
          <input
            type="number"
            value={localPort}
            onChange={(e) => setLocalPort(e.target.value)}
            placeholder="9600"
            style={inputStyle}
            disabled={isConnected}
          />

          <button
            style={buttonStyle}
            onClick={isConnected ? handleDisconnect : handleConnect}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </>
  );
}
