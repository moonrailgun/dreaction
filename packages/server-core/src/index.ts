import { Server as WebSocketServer, OPEN, type RawData, WebSocket } from 'ws';
import { EventEmitter } from 'eventemitter-strict';

import type { Command } from 'dreaction-protocol';

export { Command };

interface ServerOptions {
  port: number;
}

interface PartialConnection {
  id: number;
  address?: string;
  socket: WebSocket;
  clientId: string;
}

interface Connection extends PartialConnection {}

/**
 * The default server options.
 */
const DEFAULTS: ServerOptions = {
  port: 9600,
};

function createGuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    s4() +
    s4()
  );
}

interface ServerEventMap {
  start: () => void;
  stop: () => void;
  portUnavailable: (port: number) => void;
  command: (command: Command) => void;
  connect: (connect: Connection) => void;
  disconnect: (connect: Connection) => void;
  connectionEstablished: (connect: Connection) => void;
}

/**
 * The dreaction server.
 */
export class Server extends EventEmitter<ServerEventMap> {
  /**
   * Additional server configuration.
   */
  options: ServerOptions = { ...DEFAULTS };

  /**
   * A unique id which is assigned to each inbound message.
   */
  messageId = 0;

  /**
   * A unique id which is assigned to each inbound connection.
   */
  connectionId = 0;

  /**
   * Which redux state locations we are subscribing to.
   */
  subscriptions: string[] = [];

  /**
   * Clients who are in the process of connecting but haven't yet handshaked.
   */
  partialConnections: PartialConnection[] = [];

  /**
   * The web socket.
   */
  wss: WebSocketServer | undefined;

  /**
   * Holds the currently connected clients.
   */
  connections: Connection[] = [];

  /**
   * Have we started the server?
   */
  started = false;

  /**
   * Keep alive interval to be running while the server is up.
   */
  keepAlive: ReturnType<typeof setInterval> | undefined;

  /**
   * Set the configuration options.
   */
  configure(options: Partial<ServerOptions> = DEFAULTS) {
    // options get merged & validated before getting set
    const newOptions = {
      ...this.options,
      ...options,
    };
    this.options = newOptions;
    return this;
  }

  /**
   * Starts the server
   */
  start = () => {
    const { port } = this.options;

    this.wss = new WebSocketServer({ port });
    this.wss.on('error', (error) => {
      if (error.message.includes('EADDRINUSE')) {
        this.emit('portUnavailable', port);
      } else {
        console.error(error);
      }
    });

    if (this.keepAlive) {
      clearInterval(this.keepAlive);
    }

    // In the future we should bake this in more and use it to clean up dropped connections
    this.keepAlive = setInterval(() => {
      if (!this.wss) {
        return;
      }

      this.wss.clients.forEach((ws) => {
        ws.ping(() => {
          // noop
        });
      });
    }, 30000);

    // register events
    this.wss.on('connection', (socket, request) => {
      const thisConnectionId = this.connectionId++;

      // a wild client appears
      const partialConnection = {
        id: thisConnectionId,
        address: request.socket.remoteAddress,
        socket,
      } as PartialConnection;

      // tuck them away in a "almost connected status"
      this.partialConnections.push(partialConnection);

      // trigger onConnect
      this.emit('connect', partialConnection);

      socket.on('error', (error) => console.log('ERR', error));

      // when this client disconnects
      socket.on('close', () => {
        // remove them from the list partial list
        this.partialConnections = this.partialConnections.filter(
          (connection) => connection.id !== thisConnectionId
        );

        // remove them from the main connections list
        const severingConnection = this.connections.find(
          (connection) => connection.id === thisConnectionId
        );

        if (severingConnection) {
          this.connections = this.connections.filter(
            (connection) => connection.id !== severingConnection.id
          );
          this.emit('disconnect', severingConnection);
        }
      });

      const extractOrCreateDate = (dateString?: string) => {
        if (!dateString) return new Date();
        try {
          return new Date(Date.parse(dateString));
        } catch {
          return new Date();
        }
      };

      // when we receive a command from the client
      socket.on('message', (incoming: RawData) => {
        const message = JSON.parse(incoming.toString());
        const { type, important, payload, deltaTime = 0 } = message;
        this.messageId++;

        const fullCommand: Command = {
          type,
          important,
          payload,
          connectionId: thisConnectionId,
          messageId: this.messageId,
          date: extractOrCreateDate(message.date),
          deltaTime,
          clientId: (socket as any).clientId,
        };

        // for client intros
        if (type === 'client.intro') {
          // find them in the partial connection list

          const partConn = this.partialConnections.find(
            (connection) => connection.id === thisConnectionId
          );

          // add their address in
          fullCommand.payload.address = partConn?.address;

          // remove them from the partial connections list
          this.partialConnections = this.partialConnections.filter(
            (connection) => connection.id !== thisConnectionId
          );

          let connectionClientId = message.payload.clientId;

          if (!connectionClientId) {
            connectionClientId = createGuid();

            socket.send(
              JSON.stringify({
                type: 'setClientId',
                payload: connectionClientId,
              })
            );
          } else {
            // Check if we already have this connection
            const currentWssConnections = Array.from(this.wss?.clients ?? []);
            const currentClientConnections = currentWssConnections.filter(
              (c) => (c as any).clientId === connectionClientId
            );

            for (let i = 0; i < currentClientConnections.length; i++) {
              setTimeout(currentClientConnections[i].close, 500); // Defer this for a small amount of time because reasons.

              const severingConnection = this.connections.find(
                (connection) => connection.clientId === connectionClientId
              );

              if (severingConnection) {
                this.connections = this.connections.filter(
                  (connection) =>
                    connection.clientId !== severingConnection.clientId
                );
              }
            }
          }

          (socket as any).clientId = connectionClientId;
          fullCommand.clientId = connectionClientId;

          // bestow the payload onto the connection
          const connection: Connection = {
            ...payload,
            id: thisConnectionId,
            address: partConn?.address,
            clientId: fullCommand.clientId,
          };

          // then trigger the connection
          this.connections.push(connection);
          this.emit('connectionEstablished', connection);
        }

        // refresh subscriptions
        if (type === 'state.values.change') {
          this.subscriptions = (payload.changes || []).map(
            (change: { path: string }) => change.path
          );
        }

        // assign a name to the backups since the client doesn't pass one.  without it, we have to
        // call extendObservable instead of a standard assignment, which is very confusing.
        if (type === 'state.backup.response') {
          fullCommand.payload.name = null;
        }

        this.emit('command', fullCommand);
      });
    });

    // trigger the start message
    this.emit('start');

    this.started = true;

    return this;
  };

  /**
   * Stops the server
   */
  stop() {
    this.connections.forEach((connection) => {
      if (connection.socket && (connection.socket as any).connected) {
        (connection.socket as any).disconnect();
      }
    });

    if (this.keepAlive) {
      clearInterval(this.keepAlive);
    }

    if (this.wss) {
      this.wss.close();
    }

    // trigger the stop message
    this.emit('stop');
    this.started = false;

    return this;
  }

  /**
   * Sends a command to the client
   */
  send = (type: string, payload: Record<string, any>, clientId?: string) => {
    if (!this.wss) {
      return;
    }

    this.wss.clients.forEach((client) => {
      if (
        client.readyState === OPEN &&
        (!clientId || (client as any).clientId === clientId)
      ) {
        client.send(JSON.stringify({ type, payload }));
      }
    });
  };
}

// convenience factory function
export const createServer = (options?: Partial<ServerOptions>) => {
  const server = new Server();
  server.configure(options);
  return server;
};
