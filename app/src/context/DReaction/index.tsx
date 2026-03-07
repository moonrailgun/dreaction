/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useMemo } from 'react';
import { rpc } from '../../utils/rpc';
import type { Command } from 'dreaction-protocol';

import {
  useDReactionServer,
  Connection,
  ServerStatus,
} from './useDReactionServer';
import { first } from 'lodash-es';
import { CommandMap } from 'dreaction-protocol';
import type {
  DReactionConnectionInfo,
  SerializedCommand,
  ServerStatus as RpcServerStatus,
} from '../../shared/rpc-types';

export { type Connection };

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
  selectConnection: () => {},
  sendCommand: () => {},
});

export const DReactionServerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
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
    portUnavailable,
  } = useDReactionServer();

  const selectedConnection =
    connections.find((c) => c.clientId === selectedClientId) ?? null;

  useEffect(() => {
    const handleServerStatus = (data: { status: RpcServerStatus }) => {
      if (data.status === 'started') serverStarted();
      else if (data.status === 'stopped') serverStopped();
      else if (data.status === 'portUnavailable') portUnavailable();
    };

    const handleConnection = (data: {
      connection: DReactionConnectionInfo;
    }) => {
      connectionEstablished(data.connection);
    };

    const handleDisconnect = (data: {
      connection: DReactionConnectionInfo;
    }) => {
      connectionDisconnected(data.connection);
    };

    const handleCommand = (data: { command: SerializedCommand }) => {
      const deserialized = {
        ...data.command,
        date: new Date(data.command.date),
      };
      commandReceived(deserialized);
    };

    const handlePortUnavailable = () => {
      portUnavailable();
    };

    rpc.addMessageListener('serverStatusChanged', handleServerStatus);
    rpc.addMessageListener('connectionEstablished', handleConnection);
    rpc.addMessageListener('connectionDisconnected', handleDisconnect);
    rpc.addMessageListener('commandReceived', handleCommand);
    rpc.addMessageListener('portUnavailable', handlePortUnavailable);

    return () => {
      rpc.removeMessageListener('serverStatusChanged', handleServerStatus);
      rpc.removeMessageListener('connectionEstablished', handleConnection);
      rpc.removeMessageListener('connectionDisconnected', handleDisconnect);
      rpc.removeMessageListener('commandReceived', handleCommand);
      rpc.removeMessageListener('portUnavailable', handlePortUnavailable);
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
      rpc.request.sendCommand({
        type,
        payload,
        clientId: clientId ?? selectedClientId ?? undefined,
      });
    },
    [selectedClientId]
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
