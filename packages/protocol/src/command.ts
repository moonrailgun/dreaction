import { AsyncStorageMutationState } from './asyncStorage';
import {
  CustomCommandRegisterPayload,
  CustomCommandResponsePayload,
} from './customCommand';
import { DataWatchPayload } from './data';
import type { LogPayload } from './log';
import { NetworkPayload } from './network';
import { EditorOpenPayload } from './openInEditor';
import { ProfilerFPSPayload, ProfilerRenderPayload } from './profiler';
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

export interface CommandMap {
  'api.response': NetworkPayload;
  'asyncStorage.mutation': AsyncStorageMutationState;
  'benchmark.report': any;
  'client.intro': any;
  display: any;
  image: any;
  log: LogPayload;
  dataWatch: DataWatchPayload;
  'profiler.render': ProfilerRenderPayload;
  'profiler.fps': ProfilerFPSPayload;
  'saga.task.complete': any;
  'state.action.complete': StateActionCompletePayload;
  'state.keys.response': StateKeysResponsePayload;
  'state.values.change': StateValuesChangePayload;
  'state.values.response': StateValuesResponsePayload;
  'state.backup.response': StateBackupResponsePayload;
  'state.backup.request': StateBackupRequestPayload;
  'state.restore.request': StateRestoreRequestPayload;
  'state.action.dispatch': StateActionDispatchPayload;
  'state.values.subscribe': StateValuesSubscribePayload;
  'state.keys.request': StateKeysRequestPayload;
  'state.values.request': StateValuesRequestPayload;
  'customCommand.register': CustomCommandRegisterPayload;
  'customCommand.unregister': any;
  'customCommand.response': CustomCommandResponsePayload;
  clear: undefined;
  'repl.ls.response': any;
  'repl.execute.response': any;
  'devtools.open': undefined;
  'devtools.reload': undefined;
  'editor.open': EditorOpenPayload;
  storybook: boolean;
  overlay: boolean;
}

export type CommandTypeKey = keyof CommandMap;

export type Command = {
  [Type in CommandTypeKey]: CommandInferType<Type>;
}[CommandTypeKey];

export type CommandEvent = (command: Command) => void;

export type CommandInferType<T extends CommandTypeKey> = {
  type: T;
  connectionId: number;
  clientId?: string;
  date: Date;
  deltaTime: number;
  important: boolean;
  messageId: number;
  payload: CommandMap[T];
};
