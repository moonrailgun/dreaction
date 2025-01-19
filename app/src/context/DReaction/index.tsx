/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Command, Server, createServer } from 'dreaction-server-core';
import { config } from '../../utils/config';

import {
  useDReactionServer,
  Connection,
  ServerStatus,
} from './useDReactionServer';
import { first } from 'lodash-es';
import { CommandMap } from 'dreaction-protocol';

export { type Connection };

// TODO: Move up to better places like core somewhere!
interface Context {
  serverStatus: ServerStatus;
  connections: Connection[];
  selectedConnection: Connection | null;
  selectConnection: (clientId: string) => void;
  sendCommand: (
    type: string,
    payload: Record<string, any>,
    clientId?: string
  ) => void;
}

const DReactionServerContext = React.createContext<Context>({
  serverStatus: 'stopped',
  connections: [],
  selectedConnection: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  selectConnection: () => {},
  sendCommand: () => {},
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
    if (dreactionServer.current) {
      dreactionServer.current.stop();
    }

    // @ts-ignore
    dreactionServer.current = createServer({
      port: config.serverPort,
    });

    // @ts-ignore
    window.__server = dreactionServer.current;

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

  const sendCommand = useCallback(
    (type: string, payload: Record<string, any>, clientId?: string) => {
      // TODO: Do better then just throwing these away...
      if (!dreactionServer.current) {
        return;
      }

      dreactionServer.current.send(
        type,
        payload,
        clientId ?? selectedClientId ?? undefined
      );
    },
    [dreactionServer, selectedClientId]
  );

  return (
    <DReactionServerContext.Provider
      value={{
        serverStatus,
        connections,
        selectedConnection,
        selectConnection,
        sendCommand,
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

export function useSelectedConnectionCommmands(
  filter: Command['type'][],
  onlyPayload = false
) {
  const { selectedConnection } = useDReactionServerContext();

  const commandList = useMemo(() => {
    const list =
      selectedConnection?.commands.filter((command) =>
        filter.includes(command.type)
      ) ?? [];

    if (onlyPayload) {
      return list.map((item) => item.payload);
    }

    return list;
  }, [filter, onlyPayload, selectedConnection?.commands]);

  return commandList;
}

export function useLatestSelectedConnectionCommmand<T extends Command['type']>(
  type: T,
  filterFn?: (command: CommandMap[T]) => boolean
) {
  const commandList = useSelectedConnectionCommmands([type]);

  if (filterFn) {
    return first(commandList?.filter((command) => filterFn(command.payload)));
  } else {
    return first(commandList);
  }
}
