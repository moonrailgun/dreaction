import type {
  Command,
  CommandMap,
  CustomCommandArg,
  CustomCommandRegisterPayload,
} from 'dreaction-protocol';
import type { ClientOptions } from './client-options';

// #region Basic Types
type AnyFunction = (...args: any[]) => any;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

export interface DisplayConfig {
  name: string;
  value?: object | string | number | boolean | null | undefined;
  preview?: string;
  image?: string | { uri: string };
  important?: boolean;
}

interface ArgTypeMap {
  string: string;
}

export type CustomCommandArgs<Args extends CustomCommandArg[]> =
  UnionToIntersection<
    Args extends Array<infer U>
      ? U extends CustomCommandArg
        ? { [K in U as U['name']]: ArgTypeMap[U['type']] }
        : never
      : never
  >;

export interface CustomCommand<
  Args extends CustomCommandArg[] = CustomCommandArg[]
> extends Omit<CustomCommandRegisterPayload, 'id' | 'args'> {
  id?: number;
  handler: (args: CustomCommandArgs<Args>) => any | Promise<any>;
  args?: Args;
}
// #endregion

// #region Plugin Types
export interface LifeCycleMethods {
  onCommand?: (command: Command) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface Plugin<Client> extends LifeCycleMethods {
  features?: {
    [key: string]: AnyFunction;
  };
  onPlugin?: (client: Client) => void;
}

export type PluginCreator<Client> = (client: Client) => Plugin<Client>;

/**
 * Extract features from a single PluginCreator
 */
type ExtractPluginFeatures<P> = P extends PluginCreator<any>
  ? ReturnType<P> extends { features: infer F }
    ? F
    : {}
  : {};

/**
 * Extract features type from a plugin or array of plugins.
 * Supports:
 * - Single PluginCreator: InferFeatures<typeof myPlugin>
 * - Array of PluginCreators: InferFeatures<typeof plugins>
 * - Legacy format: InferFeatures<Client, PluginCreator> (second param is the plugin)
 */
export type InferFeatures<ClientOrPlugin, LegacyPluginCreator = never> = [
  LegacyPluginCreator
] extends [never]
  ? ClientOrPlugin extends PluginCreator<any>[]
    ? UnionToIntersection<ExtractPluginFeatures<ClientOrPlugin[number]>>
    : ExtractPluginFeatures<ClientOrPlugin>
  : ExtractPluginFeatures<LegacyPluginCreator>;

/**
 * @deprecated Use InferFeatures instead
 */
export type InferFeaturesFromPlugins<
  _Client,
  Plugins extends PluginCreator<any>[]
> = UnionToIntersection<ExtractPluginFeatures<Plugins[number]>>;
// #endregion

// #region Core Interface
export interface DReactionCore {
  connected: boolean;
  isReady: boolean;
  options: ClientOptions<this>;
  plugins: Plugin<this>[];
  startTimer: () => () => number;
  close: () => this;
  send: <Type extends keyof CommandMap>(
    type: Type,
    payload?: CommandMap[Type],
    important?: boolean
  ) => void;
  display: (config: DisplayConfig) => void;
  registerCustomCommand: <
    Args extends CustomCommandArg[] = Exclude<CustomCommand['args'], undefined>
  >(
    config: CustomCommand<Args>
  ) => () => void | ((config: string, optHandler?: () => void) => () => void);
  configure: (
    options?: ClientOptions<this>
  ) => ClientOptions<this>['plugins'] extends PluginCreator<this>[]
    ? this & InferFeatures<ClientOptions<this>['plugins']>
    : this;
  use: <P extends PluginCreator<this>>(
    pluginCreator: P
  ) => this & InferFeatures<P>;
  connect: () => this;
  waitForConnect: () => Promise<void>;
}
// #endregion
