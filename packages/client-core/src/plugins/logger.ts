import type { DReactionCore, Plugin, InferFeatures } from '../types';
import { createPluginGuard } from '../utils/plugin-guard';

/**
 * Provides logging features: log, info, debug, warn, error
 */
const logger = () => (dreaction: DReactionCore) => {
  return {
    features: {
      log: (...args: any[]) => {
        const content = args.length === 1 ? args[0] : args;
        dreaction.send('log', { level: 'debug', message: content }, false);
      },
      info: (...args: any[]) => {
        const content = args.length === 1 ? args[0] : args;
        dreaction.send('log', { level: 'debug', message: content }, false);
      },
      logImportant: (...args: any[]) => {
        const content = args.length === 1 ? args[0] : args;
        dreaction.send('log', { level: 'debug', message: content }, true);
      },
      debug: (message, important = false) =>
        dreaction.send('log', { level: 'debug', message }, !!important),
      warn: (message) =>
        dreaction.send('log', { level: 'warn', message }, true),
      error: (message, stack?) =>
        dreaction.send('log', { level: 'error', message, stack }, true),
    },
  } satisfies Plugin<DReactionCore>;
};

export default logger;

export type LoggerPlugin = ReturnType<typeof logger>;
export type LoggerFeatures = InferFeatures<ReturnType<typeof logger>>;

const loggerGuard = createPluginGuard<LoggerFeatures>(
  ['log', 'info', 'logImportant', 'debug', 'warn', 'error'],
  'logger'
);

export const hasLoggerPlugin = loggerGuard.has;
export const assertHasLoggerPlugin = loggerGuard.assert;
