import { AsyncStorageMutationState } from './asyncStorage';
import { CustomCommandPayload } from './customCommand';
import { DataWatchPayload } from './data';
import type { LogPayload } from './log';
import { NetworkPayload } from './network';
import { EditorOpenPayload } from './openInEditor';
import type {
  StateActionCompletePayload,
  StateActionDispatchPayload,
  StateBackupRequestPayload,
  StateBackupResponsePayload,
  StateKeysRequestPayload,
  StateKeysResponsePayload,
  StateRestoreRequestPayload,
  StateValuesChangePayload,
  StateValuesRequestPayload,
  StateValuesResponsePayload,
  StateValuesSubscribePayload,
} from './state';

export const CommandType = {
  ApiResponse: 'api.response',
  AsyncStorageMutation: 'asyncStorage.mutation',
  Benchmark: 'benchmark.report',
  ClientIntro: 'client.intro',
  Display: 'display',
  Image: 'image',
  Log: 'log',
  DataWatch: 'dataWatch',
  SagaTaskComplete: 'saga.task.complete',
  StateActionComplete: 'state.action.complete',
  StateKeysResponse: 'state.keys.response',
  StateValuesChange: 'state.values.change',
  StateValuesResponse: 'state.values.response',
  StateBackupResponse: 'state.backup.response',
  StateBackupRequest: 'state.backup.request',
  StateRestoreRequest: 'state.restore.request',
  StateActionDispatch: 'state.action.dispatch',
  StateValuesSubscribe: 'state.values.subscribe',
  StateKeysRequest: 'state.keys.request',
  StateValuesRequest: 'state.values.request',
  CustomCommandRegister: 'customCommand.register',
  CustomCommandUnregister: 'customCommand.unregister',
  Clear: 'clear',
  ReplLsResponse: 'repl.ls.response',
  ReplExecuteResponse: 'repl.execute.response',
  // these technically are commands only in dreaction-react-native, but I felt lazy so they can live here
  DevtoolsOpen: 'devtools.open',
  DevtoolsReload: 'devtools.reload',
  EditorOpen: 'editor.open',
  Storybook: 'storybook',
  Overlay: 'overlay',
} as const;

export type CommandTypeKey = (typeof CommandType)[keyof typeof CommandType];

export interface CommandMap {
  [CommandType.ApiResponse]: NetworkPayload;
  [CommandType.AsyncStorageMutation]: AsyncStorageMutationState;
  [CommandType.Benchmark]: any;
  [CommandType.ClientIntro]: any;
  [CommandType.Display]: any;
  [CommandType.Image]: any;
  [CommandType.Log]: LogPayload;
  [CommandType.DataWatch]: DataWatchPayload;
  [CommandType.SagaTaskComplete]: any;
  [CommandType.StateActionComplete]: StateActionCompletePayload;
  [CommandType.StateKeysResponse]: StateKeysResponsePayload;
  [CommandType.StateValuesChange]: StateValuesChangePayload;
  [CommandType.StateValuesResponse]: StateValuesResponsePayload;
  [CommandType.StateBackupResponse]: StateBackupResponsePayload;
  [CommandType.StateBackupRequest]: StateBackupRequestPayload;
  [CommandType.StateRestoreRequest]: StateRestoreRequestPayload;
  [CommandType.StateActionDispatch]: StateActionDispatchPayload;
  [CommandType.StateValuesSubscribe]: StateValuesSubscribePayload;
  [CommandType.StateKeysRequest]: StateKeysRequestPayload;
  [CommandType.StateValuesRequest]: StateValuesRequestPayload;
  [CommandType.CustomCommandRegister]: CustomCommandPayload;
  [CommandType.CustomCommandUnregister]: any;
  [CommandType.Clear]: undefined;
  [CommandType.ReplLsResponse]: any;
  [CommandType.ReplExecuteResponse]: any;
  [CommandType.DevtoolsOpen]: undefined;
  [CommandType.DevtoolsReload]: undefined;
  [CommandType.EditorOpen]: EditorOpenPayload;
  [CommandType.Storybook]: boolean;
  [CommandType.Overlay]: boolean;
}

export type Command = {
  [Type in keyof CommandMap]: {
    type: Type;
    connectionId: number;
    clientId?: string;
    date: Date;
    deltaTime: number;
    important: boolean;
    messageId: number;
    payload: CommandMap[Type];
  };
}[keyof CommandMap];

export type CommandEvent = (command: Command) => void;
