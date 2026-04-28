import { createServer, type Server } from 'dreaction-server-core';
import type {
  DReactionConnectionInfo,
  ServerStatus,
  SerializedCommand,
} from '../shared/rpc-types';

const SERVER_PORT = 9600;

let server: Server | null = null;

// Mirror state on the bun side so the webview can sync up after it mounts.
// The server may emit 'start' / 'connectionEstablished' before the webview's
// message listeners are registered, so push-only delivery loses events.
let currentServerStatus: ServerStatus = 'stopped';
const liveConnections = new Map<string, DReactionConnectionInfo>();

function toConnectionInfo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conn: any
): DReactionConnectionInfo {
  return {
    id: conn.id,
    clientId: conn.clientId,
    platform: conn.platform ?? 'web',
    name: conn.name,
    platformVersion: conn.platformVersion,
    osRelease: conn.osRelease,
    userAgent: conn.userAgent,
    address: conn.address,
  };
}

interface RPCSender {
  serverStatusChanged: (data: { status: string }) => void;
  connectionEstablished: (data: {
    connection: DReactionConnectionInfo;
  }) => void;
  connectionDisconnected: (data: {
    connection: DReactionConnectionInfo;
  }) => void;
  commandReceived: (data: { command: SerializedCommand }) => void;
  portUnavailable: (data: { port: number }) => void;
}

export function startDReactionServer(send: RPCSender) {
  if (server) {
    server.stop();
  }

  currentServerStatus = 'stopped';
  liveConnections.clear();

  server = createServer({ port: SERVER_PORT });

  server.on('start', () => {
    currentServerStatus = 'started';
    send.serverStatusChanged({ status: 'started' });
  });

  server.on('stop', () => {
    currentServerStatus = 'stopped';
    send.serverStatusChanged({ status: 'stopped' });
  });

  server.on('portUnavailable', (port: number) => {
    currentServerStatus = 'portUnavailable';
    send.portUnavailable({ port });
    send.serverStatusChanged({ status: 'portUnavailable' });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.on('connectionEstablished', (conn: any) => {
    const connectionInfo = toConnectionInfo(conn);
    liveConnections.set(connectionInfo.clientId, connectionInfo);
    send.connectionEstablished({ connection: connectionInfo });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.on('disconnect', (conn: any) => {
    const connectionInfo = toConnectionInfo(conn);
    liveConnections.delete(connectionInfo.clientId);
    send.connectionDisconnected({ connection: connectionInfo });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.on('command', (command: any) => {
    const serialized: SerializedCommand = {
      type: command.type,
      important: command.important,
      payload: command.payload,
      connectionId: command.connectionId,
      messageId: command.messageId,
      date:
        command.date instanceof Date
          ? command.date.toISOString()
          : String(command.date),
      deltaTime: command.deltaTime,
      clientId: command.clientId,
    };
    send.commandReceived({ command: serialized });
  });

  server.start();
}

export function sendCommandToClient(
  type: string,
  payload: Record<string, unknown>,
  clientId?: string
): boolean {
  if (!server) return false;
  server.send(type, payload, clientId);
  return true;
}

export function stopDReactionServer() {
  if (server) {
    server.stop();
    server = null;
  }
}

export function getServerPort(): number {
  return SERVER_PORT;
}

export function getInitialState(): {
  serverStatus: ServerStatus;
  connections: DReactionConnectionInfo[];
} {
  return {
    serverStatus: currentServerStatus,
    connections: Array.from(liveConnections.values()),
  };
}
