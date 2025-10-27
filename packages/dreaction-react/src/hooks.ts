import { useState, useEffect, useRef } from 'react';
import { dreaction } from './dreaction';

const STORAGE_KEY_HOST = 'DREACTION_host';
const STORAGE_KEY_PORT = 'DREACTION_port';
const STORAGE_KEY_AUTO_CONNECT = 'DREACTION_autoConnect';

/**
 * Hook to manage DReaction connection status
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(dreaction.connected);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(dreaction.connected);
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  return isConnected;
}

/**
 * Hook to manage DReaction configuration
 */
export function useDReactionConfig() {
  const [host, setHost] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_KEY_HOST) || 'localhost';
    }
    return 'localhost';
  });

  const [port, setPort] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY_PORT);
      return stored ? parseInt(stored, 10) : 9600;
    }
    return 9600;
  });

  const [isConnected, setIsConnected] = useState(dreaction.connected);
  const hasAutoConnected = useRef(false);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    if (hasAutoConnected.current) return;

    if (typeof window !== 'undefined' && window.localStorage) {
      const shouldAutoConnect = window.localStorage.getItem(
        STORAGE_KEY_AUTO_CONNECT
      );
      if (shouldAutoConnect === 'true' && !dreaction.connected) {
        hasAutoConnected.current = true;
        // Auto-reconnect with saved settings
        dreaction.configure({
          host,
          port,
        });
        dreaction.connect();
        setIsConnected(true);
      }
    }
  }, [host, port]);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(dreaction.connected);
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateHost = (newHost: string) => {
    setHost(newHost);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_HOST, newHost);
    }
  };

  const updatePort = (newPort: number) => {
    setPort(newPort);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_PORT, newPort.toString());
    }
  };

  const connect = () => {
    dreaction.configure({
      host,
      port,
    });
    dreaction.connect();
    setIsConnected(true);

    // Save auto-connect preference
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_AUTO_CONNECT, 'true');
    }
  };

  const disconnect = () => {
    dreaction.close();
    setIsConnected(false);

    // Clear auto-connect preference
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_AUTO_CONNECT, 'false');
    }
  };

  return {
    host,
    port,
    isConnected,
    updateHost,
    updatePort,
    connect,
    disconnect,
  };
}
