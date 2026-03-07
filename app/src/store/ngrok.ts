import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rpc } from '../utils/rpc';

export type NgrokStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface NgrokState {
  status: NgrokStatus;
  tunnelUrl: string | null;
  authtoken: string;
  domain: string;
  error: string | null;
  isLoading: boolean;

  connections: number;
  httpRequests: number;
  bytesIn: number;
  bytesOut: number;

  setAuthtoken: (token: string) => void;
  setDomain: (domain: string) => void;
  startTunnel: (port?: number) => Promise<void>;
  stopTunnel: () => Promise<void>;
  clearError: () => void;
}

export const useNgrokStore = create<NgrokState>()(
  persist(
    (set, get) => ({
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

      setAuthtoken: (token: string) => {
        set({ authtoken: token });
      },

      setDomain: (domain: string) => {
        set({ domain: domain });
      },

      startTunnel: async (port: number = 9600) => {
        const { authtoken, domain } = get();
        set({ isLoading: true, error: null, status: 'connecting' });

        try {
          const result = await rpc.request.startNgrokTunnel({
            port,
            authtoken: authtoken || undefined,
            domain: domain || undefined,
          });

          if ('error' in result) {
            set({
              status: 'error',
              error: result.error,
              isLoading: false,
              tunnelUrl: null,
            });
          } else {
            set({
              status: 'connected',
              tunnelUrl: result.url,
              isLoading: false,
              error: null,
            });
          }
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

      stopTunnel: async () => {
        set({ isLoading: true, error: null });

        try {
          await rpc.request.stopNgrokTunnel({});

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

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'ngrok-storage',
      partialize: (state) => ({
        authtoken: state.authtoken,
        domain: state.domain,
      }),
    }
  )
);
