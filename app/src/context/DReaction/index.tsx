import React, { useRef, useEffect, useCallback } from 'react';
import { Server, createServer } from 'dreaction-server-core';
import { config } from '../../utils/config';

import {
  useDReactionServer,
  Connection,
  ServerStatus,
} from './useDReactionServer';

export { type Connection };

// TODO: Move up to better places like core somewhere!
interface Context {
  serverStatus: ServerStatus;
  connections: Connection[];
  selectedConnection: Connection | null;
  selectConnection: (clientId: string) => void;
}

const DReactionServerContext = React.createContext<Context>({
  serverStatus: 'stopped',
  connections: [],
  selectedConnection: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  selectConnection: () => {},
});

export const DReactionServerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const reactotronServer = useRef<Server>(null);

  const {
    serverStatus,
    connections,
    selectedClientId,
    selectConnection,
    clearSelectedConnectionCommands,
    serverStarted,
    serverStopped,
    connectionEstablished,
    commandReceived,
    connectionDisconnected,
    addCommandListener,
    portUnavailable,
  } = useDReactionServer();

  const selectedConnection = connections.find(
    (c) => c.clientId === selectedClientId
  );

  useEffect(() => {
    reactotronServer.current = createServer({
      port: config.serverPort,
    });

    reactotronServer.current.on('start', serverStarted);
    reactotronServer.current.on('stop', serverStopped);
    // need to sync these types between reactotron-core-server and reactotron-app
    // @ts-ignore
    reactotronServer.current.on('connectionEstablished', connectionEstablished);
    reactotronServer.current.on('command', commandReceived);
    // need to sync these types between reactotron-core-server and reactotron-app

    // @ts-ignore
    reactotronServer.current.on('disconnect', connectionDisconnected);
    reactotronServer.current.on('portUnavailable', portUnavailable);

    reactotronServer.current.start();

    return () => {
      reactotronServer.current?.stop();
    };
  }, [
    serverStarted,
    serverStopped,
    connectionEstablished,
    commandReceived,
    connectionDisconnected,
    portUnavailable,
  ]);

  const sendCommand = useCallback(
    (type: string, payload: any, clientId?: string) => {
      // TODO: Do better then just throwing these away...
      if (!reactotronServer.current) {
        return;
      }

      reactotronServer.current.send(
        type,
        payload,
        clientId || selectedClientId
      );
    },
    [reactotronServer, selectedClientId]
  );

  return (
    <DReactionServerContext.Provider
      value={{
        serverStatus,
        connections,
        selectedConnection,
        selectConnection,
      }}
    >
      {children}
    </DReactionServerContext.Provider>
  );
};

export function useDReactionServerContext() {
  const context = React.useContext(DReactionServerContext);
  if (context === undefined) {
    throw new Error(
      'useDReactionServer must be used within a DReactionServerProvider'
    );
  }

  return context;
}
