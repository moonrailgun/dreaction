import { create } from 'zustand';
import { Command } from 'dreaction-server-core';
import { notifications } from '@mantine/notifications';

export enum ActionTypes {
  ServerStarted = 'SERVER_STARTED',
  ServerStopped = 'SERVER_STOPPED',
  AddConnection = 'ADD_CONNECTION',
  RemoveConnection = 'REMOVE_CONNECTION',
  ClearConnectionCommands = 'CLEAR_CONNECTION_COMMANDS',
  CommandReceived = 'COMMAND_RECEIVED',
  ChangeSelectedClientId = 'CHANGE_SELECTED_CLIENT_ID',
  AddCommandHandler = 'ADD_COMMAND_HANDLER',
  PortUnavailable = 'PORT_UNAVAILABLE',
}

export type ServerStatus = 'stopped' | 'portUnavailable' | 'started';

export interface DReactionConnection {
  id: number;
  clientId: string;
  platform: 'ios' | 'android' | 'web';
  name?: string;
  platformVersion?: string;
  osRelease?: string;
  userAgent?: string;
}

export interface Connection extends DReactionConnection {
  commands: Command[];
  connected: boolean;
}

interface State {
  serverStatus: ServerStatus;
  connections: Connection[];
  selectedClientId: string | null;
  orphanedCommands: any[];
  commandListeners: ((command: any) => void)[];
  serverStarted: () => void;
  serverStopped: () => void;
  connectionEstablished: (connection: DReactionConnection) => void;
  connectionDisconnected: (connection: DReactionConnection) => void;
  commandReceived: (command: any) => void;
  clearSelectedConnectionCommands: () => void;
  clearSelectedConnectionIssues: () => void;
  selectConnection: (clientId: string) => void;
  addCommandListener: (callback: (command: any) => void) => void;
  portUnavailable: () => void;
}

export const useDReactionServer = create<State>((set) => ({
  serverStatus: 'stopped',
  connections: [],
  selectedClientId: null,
  orphanedCommands: [],
  commandListeners: [],
  serverStarted: () =>
    set((state) => ({
      ...state,
      serverStatus: 'started',
    })),
  serverStopped: () =>
    set((state) => ({
      ...state,
      serverStatus: 'stopped',
    })),
  connectionEstablished: (connection) =>
    set((state) => {
      const existingConnection = state.connections.find(
        (c) => c.clientId === connection.clientId
      );

      let updatedConnections = state.connections;
      if (existingConnection) {
        updatedConnections = state.connections.map((c) =>
          c.clientId === connection.clientId ? { ...c, connected: true } : c
        );
      } else {
        updatedConnections = [
          ...state.connections,
          { ...connection, commands: [], connected: true },
        ];
      }

      const filteredConnections = updatedConnections.filter((c) => c.connected);
      const selectedClientId =
        filteredConnections.length === 1
          ? filteredConnections[0].clientId
          : state.selectedClientId;

      return {
        ...state,
        connections: updatedConnections,
        selectedClientId,
        serverStatus: 'started',
      };
    }),
  connectionDisconnected: (connection) =>
    set((state) => {
      const updatedConnections = state.connections.map((c) =>
        c.clientId === connection.clientId ? { ...c, connected: false } : c
      );

      const filteredConnections = updatedConnections.filter((c) => c.connected);
      const selectedClientId =
        state.selectedClientId === connection.clientId
          ? filteredConnections.length > 0
            ? filteredConnections[0].clientId
            : state.selectedClientId
          : state.selectedClientId;

      return {
        ...state,
        connections: updatedConnections,
        selectedClientId,
      };
    }),
  commandReceived: (command) =>
    set((state) => {
      if (!command.clientId) {
        return {
          ...state,
          orphanedCommands: [...state.orphanedCommands, command],
        };
      }

      const updatedConnections = state.connections.map((c) =>
        c.clientId === command.clientId
          ? { ...c, commands: [command, ...c.commands] }
          : c
      );

      state.commandListeners.forEach((listener) => listener(command));

      return {
        ...state,
        connections: updatedConnections,
      };
    }),
  clearSelectedConnectionCommands: () =>
    set((state) => {
      if (!state.selectedClientId) return state;

      const updatedConnections = state.connections.map((c) =>
        c.clientId === state.selectedClientId ? { ...c, commands: [] } : c
      );

      return {
        ...state,
        connections: updatedConnections,
      };
    }),
  clearSelectedConnectionIssues: () =>
    set((state) => {
      if (!state.selectedClientId) return state;

      const updatedConnections = state.connections.map((c) =>
        c.clientId === state.selectedClientId
          ? {
              ...c,
              commands: c.commands.filter((cmd) => cmd.type !== 'report.issue'),
            }
          : c
      );

      return {
        ...state,
        connections: updatedConnections,
      };
    }),
  selectConnection: (clientId) =>
    set((state) => ({
      ...state,
      selectedClientId: state.connections.some((c) => c.clientId === clientId)
        ? clientId
        : state.selectedClientId,
    })),
  addCommandListener: (callback) =>
    set((state) => ({
      ...state,
      commandListeners: [...state.commandListeners, callback],
    })),
  portUnavailable: () =>
    set((state) => {
      console.error('Port unavailable!');
      notifications.show({
        title: 'Server Init Failed',
        message: 'Port unavailable!',
      });

      return {
        ...state,
        serverStatus: 'portUnavailable',
      };
    }),
}));
