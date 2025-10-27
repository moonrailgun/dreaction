export { dreaction, reactCorePlugins } from './dreaction';
export type { DReactionReact, UseReactOptions } from './dreaction';
export { ConfigPanel } from './components/ConfigPanel';
export type { ConfigPanelProps } from './components/ConfigPanel';
export { useConnectionStatus, useDReactionConfig } from './hooks';

// Plugin exports
export { default as networking } from './plugins/networking';
export type { NetworkingOptions } from './plugins/networking';
export { default as localStorage } from './plugins/localStorage';
export type { LocalStorageOptions } from './plugins/localStorage';
export { default as trackGlobalLogs } from './plugins/trackGlobalLogs';
export { default as trackGlobalErrors } from './plugins/trackGlobalErrors';
export type {
  TrackGlobalErrorsOptions,
  ErrorStackFrame,
} from './plugins/trackGlobalErrors';
