import {
  InferFeatures,
  LoggerPlugin,
  DReactionCore,
  assertHasLoggerPlugin,
  Plugin,
} from 'dreaction-client-core';

/**
 * Track calls to console.log, console.warn, and console.debug and send them to DReaction logger
 */
const trackGlobalLogs = () => (dreaction: DReactionCore) => {
  assertHasLoggerPlugin(dreaction);
  const client = dreaction as DReactionCore &
    InferFeatures<DReactionCore, LoggerPlugin>;

  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleDebug = console.debug;
  const originalConsoleInfo = console.info;

  return {
    onConnect: () => {
      console.log = (...args: Parameters<typeof console.log>) => {
        originalConsoleLog(...args);
        client.log(...args);
      };
      console.info = (...args: Parameters<typeof console.info>) => {
        originalConsoleInfo(...args);
        client.info(...args);
      };
      console.warn = (...args: Parameters<typeof console.warn>) => {
        originalConsoleWarn(...args);
        client.warn(args[0]);
      };

      console.debug = (...args: Parameters<typeof console.debug>) => {
        originalConsoleDebug(...args);
        client.debug(args[0]);
      };

      // console.error is taken care of by ./trackGlobalErrors.ts
    },
    onDisconnect: () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.debug = originalConsoleDebug;
      console.info = originalConsoleInfo;
    }
  } satisfies Plugin<DReactionCore>;
};

export default trackGlobalLogs;
