// Types
export type { ClientOptions } from './client-options';
export type {
  CustomCommand,
  CustomCommandArgs,
  DisplayConfig,
  DReactionCore,
  InferFeatures,
  InferFeaturesFromPlugins,
  LifeCycleMethods,
  Plugin,
  PluginCreator,
} from './types';

// Core
export { DReactionImpl, createClient } from './core';

// Plugins
export { corePlugins } from './plugins';
export { assertHasLoggerPlugin, hasLoggerPlugin } from './plugins/logger';
export type { LoggerPlugin, LoggerFeatures } from './plugins/logger';
export {
  assertHasStateResponsePlugin,
  hasStateResponsePlugin,
} from './plugins/state-responses';
export type {
  StateResponsePlugin,
  StateResponseFeatures,
} from './plugins/state-responses';

// Utils
export { runFPSMeter } from './utils/fps';
export { createPluginGuard } from './utils/plugin-guard';

// Derived Types
import type { InferFeatures } from './types';
import type { corePlugins } from './plugins';

export type CorePluginFeatures = InferFeatures<typeof corePlugins>;

import type { DReactionCore } from './types';
export interface DReaction extends DReactionCore, CorePluginFeatures {}
