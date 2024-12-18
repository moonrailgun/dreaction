import React, { useRef, useEffect } from 'react';
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
  const dreactionServer = useRef<Server>(null);

  const {
    serverStatus,
    connections,
    selectedClientId,
    selectConnection,
    serverStarted,
    serverStopped,
    connectionEstablished,
    commandReceived,
    connectionDisconnected,
    // addCommandListener,
    portUnavailable,
  } = useDReactionServer();

  const selectedConnection =
    connections.find((c) => c.clientId === selectedClientId) ?? null;

  useEffect(() => {
    // @ts-ignore
    dreactionServer.current = createServer({
      port: config.serverPort,
    });

    dreactionServer.current.on('start', serverStarted);
    dreactionServer.current.on('stop', serverStopped);
    // need to sync these types between dreaction-core-server and dreaction-app
    // @ts-ignore
    dreactionServer.current.on('connectionEstablished', connectionEstablished);
    dreactionServer.current.on('command', commandReceived);
    // need to sync these types between dreaction-core-server and dreaction-app

    // @ts-ignore
    dreactionServer.current.on('disconnect', connectionDisconnected);
    dreactionServer.current.on('portUnavailable', portUnavailable);

    dreactionServer.current.start();

    return () => {
      dreactionServer.current?.stop();
    };
  }, [
    serverStarted,
    serverStopped,
    connectionEstablished,
    commandReceived,
    connectionDisconnected,
    portUnavailable,
  ]);

  // const sendCommand = useCallback(
  //   (type: string, payload: any, clientId?: string) => {
  //     // TODO: Do better then just throwing these away...
  //     if (!dreactionServer.current) {
  //       return;
  //     }

  //     dreactionServer.current.send(
  //       type,
  //       payload,
  //       clientId || selectedClientId || undefined
  //     );
  //   },
  //   [dreactionServer, selectedClientId]
  // );

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
