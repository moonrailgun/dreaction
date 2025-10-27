/**
 * Provides a global error handler to report errors.
 */
import {
  InferFeatures,
  LoggerPlugin,
  DReactionCore,
  assertHasLoggerPlugin,
  Plugin,
} from 'dreaction-client-core';

export interface ErrorStackFrame {
  fileName: string;
  functionName: string;
  lineNumber: number;
  columnNumber?: number | null;
}

export interface TrackGlobalErrorsOptions {
  veto?: (frame: ErrorStackFrame) => boolean;
}

// defaults
const PLUGIN_DEFAULTS: TrackGlobalErrorsOptions = {
  veto: undefined,
};

const objectifyError = (error: Error) => {
  const objectifiedError = {} as Record<string, unknown>;
  Object.getOwnPropertyNames(error).forEach((key) => {
    objectifiedError[key] = (error as any)[key];
  });
  return objectifiedError;
};

/**
 * Parse error stack trace
 */
const parseErrorStack = (error: Error): ErrorStackFrame[] => {
  if (!error.stack) {
    return [];
  }

  const frames: ErrorStackFrame[] = [];
  const lines = error.stack.split('\n');

  // Skip the first line (error message)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Try to match different stack trace formats
    // Format: at functionName (fileName:lineNumber:columnNumber)
    let match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      frames.push({
        functionName: match[1],
        fileName: match[2],
        lineNumber: parseInt(match[3], 10),
        columnNumber: parseInt(match[4], 10),
      });
      continue;
    }

    // Format: at fileName:lineNumber:columnNumber
    match = line.match(/at\s+(.+?):(\d+):(\d+)/);
    if (match) {
      frames.push({
        functionName: '<anonymous>',
        fileName: match[1],
        lineNumber: parseInt(match[2], 10),
        columnNumber: parseInt(match[3], 10),
      });
      continue;
    }

    // Format: functionName@fileName:lineNumber:columnNumber (Firefox)
    match = line.match(/(.+?)@(.+?):(\d+):(\d+)/);
    if (match) {
      frames.push({
        functionName: match[1] || '<anonymous>',
        fileName: match[2],
        lineNumber: parseInt(match[3], 10),
        columnNumber: parseInt(match[4], 10),
      });
      continue;
    }
  }

  return frames;
};

/**
 * Track global errors and send them to DReaction logger.
 */
const trackGlobalErrors =
  (options?: TrackGlobalErrorsOptions) => (dreaction: DReactionCore) => {
    // make sure we have the logger plugin
    assertHasLoggerPlugin(dreaction);
    const client = dreaction as DReactionCore &
      InferFeatures<DReactionCore, LoggerPlugin>;

    // setup configuration
    const config = Object.assign({}, PLUGIN_DEFAULTS, options || {});

    let originalWindowOnError: OnErrorEventHandler;
    let unhandledRejectionHandler:
      | ((event: PromiseRejectionEvent) => void)
      | null = null;

    // manually fire an error
    function reportError(error: Error, stack?: ErrorStackFrame[]) {
      try {
        let prettyStackFrames = stack || parseErrorStack(error);

        // does the dev want us to keep each frame?
        if (config.veto) {
          prettyStackFrames = prettyStackFrames.filter((frame) =>
            config?.veto?.(frame)
          );
        }

        client.error(error.message, prettyStackFrames);
      } catch (e) {
        client.error('Unable to parse stack trace from error object', []);
        client.debug(objectifyError(e as Error));
      }
    }

    // the dreaction plugin interface
    return {
      onConnect: () => {
        if (typeof window === 'undefined') return;

        // Intercept window.onerror
        originalWindowOnError = window.onerror;
        window.onerror = function (
          message: string | Event,
          source?: string,
          lineno?: number,
          colno?: number,
          error?: Error
        ) {
          if (error) {
            reportError(error);
          } else if (typeof message === 'string') {
            const syntheticError = new Error(message);
            const frames: ErrorStackFrame[] = [];
            if (source) {
              frames.push({
                fileName: source,
                functionName: '<unknown>',
                lineNumber: lineno || 0,
                columnNumber: colno || 0,
              });
            }
            reportError(syntheticError, frames);
          }

          // Call original handler
          if (originalWindowOnError) {
            return originalWindowOnError.apply(this, arguments as any);
          }
          return false;
        };

        // Intercept unhandled promise rejections
        unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
          const error =
            event.reason instanceof Error
              ? event.reason
              : new Error(String(event.reason));
          reportError(error);
        };
        window.addEventListener(
          'unhandledrejection',
          unhandledRejectionHandler
        );
      },

      onDisconnect: () => {
        if (typeof window === 'undefined') return;

        // Restore original handlers
        if (originalWindowOnError) {
          window.onerror = originalWindowOnError;
        }

        if (unhandledRejectionHandler) {
          window.removeEventListener(
            'unhandledrejection',
            unhandledRejectionHandler
          );
        }
      },

      // attach these functions to the DReaction
      features: {
        reportError,
      },
    } satisfies Plugin<DReactionCore>;
  };

export default trackGlobalErrors;
