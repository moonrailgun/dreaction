import type { RPCSchema } from 'electrobun/bun';

export interface DReactionConnectionInfo {
  id: number;
  clientId: string;
  platform: 'ios' | 'android' | 'web';
  name?: string;
  platformVersion?: string;
  osRelease?: string;
  userAgent?: string;
  address?: string;
}

export interface SerializedCommand {
  type: string;
  important: boolean;
  payload: Record<string, unknown>;
  connectionId: number;
  messageId: number;
  date: string;
  deltaTime: number;
  clientId: string;
}

export type NgrokStatus = 'idle' | 'connecting' | 'connected' | 'error';

export type ServerStatus = 'stopped' | 'portUnavailable' | 'started';

export type MainUIRPCType = {
  // Bun side: handles incoming requests from webview, receives messages from webview
  bun: RPCSchema<{
    requests: {
      sendCommand: {
        params: {
          type: string;
          payload: Record<string, unknown>;
          clientId?: string;
        };
        response: boolean;
      };
      startNgrokTunnel: {
        params: {
          port: number;
          authtoken?: string;
          domain?: string;
        };
        response: { url: string } | { error: string };
      };
      stopNgrokTunnel: {
        params: Record<string, never>;
        response: boolean;
      };
      openExternal: {
        params: { url: string };
        response: boolean;
      };
      getLocalIP: {
        params: Record<string, never>;
        response: string;
      };
      // Returned synchronously so the webview can recover any state that
      // changed before its message listeners were registered (e.g. the
      // server `start` event fired during bun bootstrap).
      getInitialState: {
        params: Record<string, never>;
        response: {
          serverStatus: ServerStatus;
          connections: DReactionConnectionInfo[];
        };
      };
    };
    messages: Record<string, never>;
  }>;
  // Webview side: handles incoming requests from bun, receives messages from bun
  webview: RPCSchema<{
    requests: Record<string, never>;
    messages: {
      serverStatusChanged: { status: ServerStatus };
      connectionEstablished: { connection: DReactionConnectionInfo };
      connectionDisconnected: { connection: DReactionConnectionInfo };
      commandReceived: { command: SerializedCommand };
      portUnavailable: { port: number };
    };
  }>;
};
