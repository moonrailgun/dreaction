import { createClient } from 'dreaction-client-core';
import type {
  ClientOptions,
  DReaction,
  DReactionCore,
  InferFeaturesFromPlugins,
  PluginCreator,
} from 'dreaction-client-core';
import type { DataWatchPayload } from 'dreaction-protocol';
import { useEffect } from 'react';
import networking, { NetworkingOptions } from './plugins/networking';
import localStorage, { LocalStorageOptions } from './plugins/localStorage';
import trackGlobalLogs from './plugins/trackGlobalLogs';
import trackGlobalErrors, {
  TrackGlobalErrorsOptions,
} from './plugins/trackGlobalErrors';

export type { ClientOptions };

const DREACTION_LOCAL_STORAGE_CLIENT_ID = 'DREACTION_clientId';

let tempClientId: string | null = null;

export const reactCorePlugins = [
  trackGlobalErrors(),
  trackGlobalLogs(),
  localStorage(),
  networking(),
] satisfies PluginCreator<DReactionCore>[];

export interface UseReactOptions {
  errors?: TrackGlobalErrorsOptions | boolean;
  log?: boolean;
  localStorage?: LocalStorageOptions | boolean;
  networking?: NetworkingOptions | boolean;
}

type ReactPluginFeatures = InferFeaturesFromPlugins<
  DReactionCore,
  typeof reactCorePlugins
>;

export interface DReactionReact
  extends DReaction,
    // @ts-ignore
    ReactPluginFeatures {
  useReact: (options?: UseReactOptions) => this;
  registerDataWatcher: <T = unknown>(
    name: string,
    type: DataWatchPayload['type'],
    options?: {
      /**
       * Is data watcher enabled?
       */
      enabled?: boolean;
    }
  ) => {
    currentDebugValue: T | undefined;
    updateDebugValue: (data: unknown) => void;
    useDebugDataWatch: (target: unknown) => void;
  };
}

const DEFAULTS: ClientOptions<DReactionReact> = {
  createSocket: (path: string) => new WebSocket(path),
  host: 'localhost',
  port: 9600,
  name: 'React Web App',
  environment: process.env.NODE_ENV || 'development',
  client: {
    dreactionLibraryName: 'dreaction-react',
    dreactionLibraryVersion: '1.0.0',
    platform: 'web',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  },
  getClientId: async (name: string = '') => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(
        DREACTION_LOCAL_STORAGE_CLIENT_ID
      );
      if (stored) {
        return stored;
      }
    }

    // Generate clientId based on browser info
    tempClientId = [
      name,
      'web',
      typeof navigator !== 'undefined' ? navigator.userAgent : '',
      Date.now(),
    ]
      .filter(Boolean)
      .join('-');

    return tempClientId;
  },
  setClientId: async (clientId: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DREACTION_LOCAL_STORAGE_CLIENT_ID, clientId);
    } else {
      tempClientId = clientId;
    }
  },
  proxyHack: true,
};

export const dreaction = createClient<DReactionReact>(DEFAULTS);

function getPluginOptions<T>(options?: T | boolean): T | null {
  return typeof options === 'object' ? options : null;
}

dreaction.useReact = (options: UseReactOptions = {}) => {
  if (options.errors !== false) {
    dreaction.use(
      trackGlobalErrors(getPluginOptions(options.errors as any)) as any
    );
  }

  if (options.log !== false) {
    dreaction.use(trackGlobalLogs() as any);
  }

  if (options.localStorage !== false) {
    dreaction.use(
      localStorage(getPluginOptions(options.localStorage) as any) as any
    );
  }

  if (options.networking !== false) {
    dreaction.use(
      networking(getPluginOptions(options.networking) as any) as any
    );
  }

  return dreaction;
};

dreaction.registerDataWatcher = <T = unknown>(
  name: string,
  type: DataWatchPayload['type'],
  options?: {
    /**
     * Is data watcher enabled?
     */
    enabled?: boolean;
  }
) => {
  const { enabled = process.env.NODE_ENV === 'development' } = options ?? {};
  if (!enabled) {
    return {
      currentDebugValue: undefined,
      updateDebugValue: () => {},
      useDebugDataWatch: () => {},
    };
  }

  let prev: T | undefined = undefined;

  const updateDebugValue = (data: T | ((prev: T | undefined) => T)) => {
    let newData = prev;
    if (typeof data === 'function') {
      newData = (data as (prev: T | undefined) => T)(prev);
    } else {
      newData = data;
    }
    prev = newData;
    dreaction.send('dataWatch', { name, type, data: newData });
  };

  return {
    currentDebugValue: prev,
    updateDebugValue,
    useDebugDataWatch: (target: T) => {
      useEffect(() => {
        updateDebugValue(target);
      }, [target]);
    },
  };
};
