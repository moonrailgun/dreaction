import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  startNgrokTunnel,
  stopNgrokTunnel,
  getTunnelUrl,
  isTunnelActive,
  type NgrokStatus,
} from '../utils/ngrok';

interface NgrokState {
  // State
  status: NgrokStatus;
  tunnelUrl: string | null;
  authtoken: string;
  domain: string;
  error: string | null;
  isLoading: boolean;

  // Stats (for future enhancement)
  connections: number;
  httpRequests: number;
  bytesIn: number;
  bytesOut: number;

  // Actions
  setAuthtoken: (token: string) => void;
  setDomain: (domain: string) => void;
  startTunnel: (port?: number) => Promise<void>;
  stopTunnel: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
}

export const useNgrokStore = create<NgrokState>()(
  persist(
    (set, get) => ({
      // Initial state
      status: 'idle',
      tunnelUrl: null,
      authtoken: '',
      domain: '',
      error: null,
      isLoading: false,
      connections: 0,
      httpRequests: 0,
      bytesIn: 0,
      bytesOut: 0,

      // Set authtoken (automatically persisted by zustand)
      setAuthtoken: (token: string) => {
        set({ authtoken: token });
      },

      // Set domain (automatically persisted by zustand)
      setDomain: (domain: string) => {
        set({ domain: domain });
      },

      // Start ngrok tunnel
      startTunnel: async (port: number = 9600) => {
        const { authtoken, domain } = get();
        set({ isLoading: true, error: null, status: 'connecting' });

        try {
          const tunnelInfo = await startNgrokTunnel(
            port,
            authtoken || undefined,
            domain || undefined
          );

          set({
            status: 'connected',
            tunnelUrl: tunnelInfo.url,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to start tunnel';

          set({
            status: 'error',
            error: errorMessage,
            isLoading: false,
            tunnelUrl: null,
          });

          console.error('Failed to start ngrok tunnel:', error);
        }
      },

      // Stop ngrok tunnel
      stopTunnel: async () => {
        set({ isLoading: true, error: null });

        try {
          await stopNgrokTunnel();

          set({
            status: 'idle',
            tunnelUrl: null,
            isLoading: false,
            error: null,
            connections: 0,
            httpRequests: 0,
            bytesIn: 0,
            bytesOut: 0,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to stop tunnel';

          set({
            error: errorMessage,
            isLoading: false,
          });

          console.error('Failed to stop ngrok tunnel:', error);
        }
      },

      // Refresh tunnel status
      refreshStatus: async () => {
        const isActive = isTunnelActive();

        if (isActive) {
          const url = getTunnelUrl();
          set({
            status: 'connected',
            tunnelUrl: url,
          });
        } else {
          set({
            status: 'idle',
            tunnelUrl: null,
          });
        }
      },

      // Clear error message
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'ngrok-storage', // localStorage key
      // Only persist authtoken and domain, not temporary states
      partialize: (state) => ({
        authtoken: state.authtoken,
        domain: state.domain,
      }),
    }
  )
);
