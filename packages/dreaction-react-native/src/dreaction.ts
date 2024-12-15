import { Platform } from 'react-native';
import { createClient } from 'dreaction-client-core';
import type {
  ClientOptions,
  InferFeaturesFromPlugins,
  PluginCreator,
  Reactotron,
  DReactionCore,
} from 'dreaction-client-core';
// @ts-ignore
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

export type { ClientOptions };

const DREACTION_ASYNC_CLIENT_ID = '@REACTOTRON/clientId';

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
  asyncStorage?: AsyncStorageOptions | boolean;
  networking?: NetworkingOptions | boolean;
  devTools?: boolean;
}

type ReactNativePluginFeatures = InferFeaturesFromPlugins<
  DReactionCore,
  typeof reactNativeCorePlugins
>;

export interface ReactotronReactNative
  extends Reactotron,
    // @ts-ignore
    ReactNativePluginFeatures {
  useReactNative: (options?: UseReactNativeOptions) => this;
  asyncStorageHandler?: AsyncStorageStatic;
  setAsyncStorageHandler: (asyncStorage: AsyncStorageStatic) => this;
  registerDataWatcher: (
    name: string,
    type: DataWatchPayload['type']
  ) => {
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

const DEFAULTS: ClientOptions<ReactotronReactNative> = {
  createSocket: (path: string) => new WebSocket(path), // eslint-disable-line
  host: getHost('localhost'),
  port: 9600,
  name: 'React Native App',
  environment: process.env.NODE_ENV || (__DEV__ ? 'development' : 'production'),
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

export const dreaction = createClient<ReactotronReactNative>(DEFAULTS);

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

dreaction.registerDataWatcher = (
  name: string,
  type: DataWatchPayload['type']
) => {
  if (!__DEV__) {
    return {
      updateDebugValue: () => {},
      useDebugDataWatch: () => {},
    };
  }

  const updateDebugValue = (data: unknown) => {
    dreaction.send('dataWatch', { name, type, data });
  };

  return {
    updateDebugValue,
    useDebugDataWatch: (target: unknown) => {
      useEffect(() => {
        updateDebugValue(target);
      }, [target]);
    },
  };
};