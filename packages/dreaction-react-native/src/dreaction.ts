import { Platform } from 'react-native';
import { createClient, runFPSMeter } from 'dreaction-client-core';
import type {
  ClientOptions,
  InferFeaturesFromPlugins,
  PluginCreator,
  DReaction,
  DReactionCore,
} from 'dreaction-client-core';
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
import getReactNativeVersion from './helpers/getReactNativeVersion';
import getReactNativeDimensions from './helpers/getReactNativeDimensions';
import asyncStorage, { AsyncStorageOptions } from './plugins/asyncStorage';
import openInEditor, { OpenInEditorOptions } from './plugins/openInEditor';
import trackGlobalErrors, {
  TrackGlobalErrorsOptions,
} from './plugins/trackGlobalErrors';
import networking, { NetworkingOptions } from './plugins/networking';
import devTools from './plugins/devTools';
import trackGlobalLogs from './plugins/trackGlobalLogs';
import getReactNativePlatformConstants from './helpers/getReactNativePlatformConstants';
import { DataWatchPayload } from 'dreaction-protocol';
import { useEffect } from 'react';
import { getHost } from './helpers/getHost';
import { isDev } from './helpers/common';
import overlay from './plugins/overlay';

export type { ClientOptions };

export { overlay };

const DREACTION_ASYNC_CLIENT_ID = '@DREACTION/clientId';

let tempClientId: string | null = null;

export const reactNativeCorePlugins = [
  asyncStorage(),
  trackGlobalErrors(),
  trackGlobalLogs(),
  openInEditor(),
  networking(),
  devTools(),
] satisfies PluginCreator<DReactionCore>[];

export interface UseReactNativeOptions {
  errors?: TrackGlobalErrorsOptions | boolean;
  log?: boolean;
  editor?: OpenInEditorOptions | boolean;
  overlay?: boolean;
  asyncStorage?: AsyncStorageOptions | boolean;
  networking?: NetworkingOptions | boolean;
  devTools?: boolean;
}

type ReactNativePluginFeatures = InferFeaturesFromPlugins<
  DReactionCore,
  typeof reactNativeCorePlugins
>;

export interface DReactionReactNative
  extends DReaction,
    // @ts-ignore
    ReactNativePluginFeatures {
  useReactNative: (options?: UseReactNativeOptions) => this;
  asyncStorageHandler?: AsyncStorageStatic;
  setAsyncStorageHandler: (asyncStorage: AsyncStorageStatic) => this;
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

const {
  osRelease,
  model,
  serverHost,
  forceTouch,
  interfaceIdiom,
  systemName,
  uiMode,
  serial,
} = getReactNativePlatformConstants();

const DEFAULTS: ClientOptions<DReactionReactNative> = {
  createSocket: (path: string) => new WebSocket(path), // eslint-disable-line
  host: getHost('localhost'),
  port: 9600,
  name: 'React Native App',
  environment: process.env.NODE_ENV || (isDev() ? 'development' : 'production'),
  client: {
    dreactionLibraryName: 'dreaction-react-native',
    dreactionLibraryVersion: 'DREACTION_REACT_NATIVE_VERSION',
    platform: Platform.OS,
    platformVersion: Platform.Version,
    osRelease,
    model,
    serverHost,
    forceTouch,
    interfaceIdiom,
    systemName,
    uiMode,
    serial,
    reactNativeVersion: getReactNativeVersion()!,
    ...getReactNativeDimensions(),
  },
  /* eslint-disable @typescript-eslint/no-use-before-define */
  getClientId: async (name: string = '') => {
    if (dreaction.asyncStorageHandler) {
      return (await dreaction.asyncStorageHandler.getItem(
        DREACTION_ASYNC_CLIENT_ID
      ))!;
    }

    // Generate clientId based on the device info
    const { screenWidth, screenHeight, screenScale } =
      getReactNativeDimensions()!;

    // Accounting for screen rotation
    const dimensions = [screenWidth, screenHeight].sort().join('-');

    const additionalInfo = Platform.select({
      ios: systemName,
      android: model,
      default: '',
    });

    tempClientId = [
      name,
      Platform.OS,
      Platform.Version,
      additionalInfo,
      dimensions,
      screenScale,
    ]
      .filter(Boolean)
      .join('-');

    return tempClientId;
  },
  setClientId: async (clientId: string) => {
    if (dreaction.asyncStorageHandler) {
      return dreaction.asyncStorageHandler.setItem(
        DREACTION_ASYNC_CLIENT_ID,
        clientId
      );
    }

    tempClientId = clientId;
  },
  proxyHack: true,
};

export const dreaction = createClient<DReactionReactNative>(DEFAULTS);

function getPluginOptions<T>(options?: T | boolean): T | null {
  return typeof options === 'object' ? options : null;
}

dreaction.useReactNative = (options: UseReactNativeOptions = {}) => {
  if (options.errors !== false) {
    dreaction.use(
      trackGlobalErrors(getPluginOptions(options.errors as any)) as any
    );
  }

  if (options.log !== false) {
    dreaction.use(trackGlobalLogs() as any);
  }

  if (options.editor !== false) {
    dreaction.use(openInEditor(getPluginOptions(options.editor as any)));
  }

  if (options.overlay !== false) {
    dreaction.use(overlay());
  }

  if (options.asyncStorage !== false) {
    dreaction.use(
      asyncStorage(getPluginOptions(options.asyncStorage) as any) as any
    );
  }

  if (options.networking !== false) {
    dreaction.use(
      networking(getPluginOptions(options.networking) as any) as any
    );
  }

  if (options.devTools !== false) {
    dreaction.use(devTools());
  }

  return dreaction;
};

dreaction.setAsyncStorageHandler = (asyncStorage: AsyncStorageStatic) => {
  dreaction.asyncStorageHandler = asyncStorage;

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
  const { enabled = __DEV__ } = options ?? {};
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

export function watchFPS() {
  return runFPSMeter((fps) => {
    dreaction.send('profiler.fps', {
      fps,
    });
  });
}
