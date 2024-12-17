import type { DReactionCore, Plugin, InferFeatures } from '../';

/**
 * Provides 4 features for logging.  log & debug are the same.
 */
const logger = () => (dreaction: DReactionCore) => {
  return {
    features: {
      log: (...args) => {
        const content = args && args.length === 1 ? args[0] : args;
        dreaction.send('log', { level: 'debug', message: content }, false);
      },
      logImportant: (...args) => {
        const content = args && args.length === 1 ? args[0] : args;
        dreaction.send('log', { level: 'debug', message: content }, true);
      },
      debug: (message, important = false) =>
        dreaction.send('log', { level: 'debug', message }, !!important),
      warn: (message) =>
        dreaction.send('log', { level: 'warn', message }, true),
      error: (message, stack) =>
        dreaction.send('log', { level: 'error', message, stack }, true),
    },
  } satisfies Plugin<DReactionCore>;
};

export default logger;

export type LoggerPlugin = ReturnType<typeof logger>;

export const hasLoggerPlugin = (
  dreaction: DReactionCore
): dreaction is DReactionCore &
  InferFeatures<DReactionCore, ReturnType<typeof logger>> => {
  return (
    dreaction &&
    'log' in dreaction &&
    typeof dreaction.log === 'function' &&
    'logImportant' in dreaction &&
    typeof dreaction.logImportant === 'function' &&
    'debug' in dreaction &&
    typeof dreaction.debug === 'function' &&
    'warn' in dreaction &&
    typeof dreaction.warn === 'function' &&
    'error' in dreaction &&
    typeof dreaction.error === 'function'
  );
};

export const assertHasLoggerPlugin = (
  dreaction: DReactionCore
): asserts dreaction is DReactionCore &
  InferFeatures<DReactionCore, ReturnType<typeof logger>> => {
  if (!hasLoggerPlugin(dreaction)) {
    throw new Error(
      'This DReaction client has not had the logger plugin applied to it. Make sure that you add `use(logger())` before adding this plugin.'
    );
  }
};
