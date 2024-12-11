import { Platform } from 'react-native';
import { createClient } from 'dreaction-client-core';
import type {
  ClientOptions,
  InferFeaturesFromPlugins,
  PluginCreator,
  Reactotron,
  ReactotronCore,
} from 'dreaction-client-core';
// @ts-ignore
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
// @ts-ignore
import NativeSourceCode from 'react-native/Libraries/NativeModules/specs/NativeSourceCode';
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
import { getHostFromUrl } from './helpers/parseURL';
import getReactNativePlatformConstants from './helpers/getReactNativePlatformConstants';

const REACTOTRON_ASYNC_CLIENT_ID = '@REACTOTRON/clientId';

let tempClientId: string | null = null;

/**
 * Most of the time, host should be 'localhost'.
 * But sometimes, it's not.  So we need to figure out what it is.
 * @see https://github.com/infinitered/dreaction/issues/1107
 *
 * On an Android emulator, if you want to connect any servers of local, you will need run adb reverse on your terminal. This function gets the localhost IP of host machine directly to bypass this.
 */
const getHost = (defaultHost = 'localhost') => {
  try {
    // RN Reference: https://github.com/facebook/react-native/blob/main/packages/react-native/src/private/specs/modules/NativeSourceCode.js
    const scriptURL = NativeSourceCode.getConstants().scriptURL;

    if (typeof scriptURL !== 'string')
      throw new Error('Invalid non-string URL');

    return getHostFromUrl(scriptURL);
  } catch (error) {
    console.warn(
      `getHost: "${
        (error as any).message
      }" for scriptURL - Falling back to ${defaultHost}`
    );
    return defaultHost;
  }
};

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
  port: 9090,
  name: 'React Native App',
  environment: process.env.NODE_ENV || (__DEV__ ? 'development' : 'production'),
  client: {
    reactotronLibraryName: 'dreaction-react-native',
    reactotronLibraryVersion: 'REACTOTRON_REACT_NATIVE_VERSION',
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
        REACTOTRON_ASYNC_CLIENT_ID
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
        REACTOTRON_ASYNC_CLIENT_ID,
        clientId
      );
    }

    tempClientId = clientId;
  },
  proxyHack: true,
};

export interface UseReactNativeOptions {
  errors?: TrackGlobalErrorsOptions | boolean;
  log?: boolean;
  editor?: OpenInEditorOptions | boolean;
  asyncStorage?: AsyncStorageOptions | boolean;
  networking?: NetworkingOptions | boolean;
  devTools?: boolean;
}

export const reactNativeCorePlugins = [
  asyncStorage(),
  trackGlobalErrors(),
  trackGlobalLogs(),
  openInEditor(),
  networking(),
  devTools(),
] satisfies PluginCreator<ReactotronCore>[];

type ReactNativePluginFeatures = InferFeaturesFromPlugins<
  ReactotronCore,
  typeof reactNativeCorePlugins
>;

export interface ReactotronReactNative
  extends Reactotron,
    // @ts-ignore
    ReactNativePluginFeatures {
  useReactNative: (options?: UseReactNativeOptions) => this;
  asyncStorageHandler?: AsyncStorageStatic;
  setAsyncStorageHandler: (asyncStorage: AsyncStorageStatic) => this;
}

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

export {
  asyncStorage,
  trackGlobalErrors,
  trackGlobalLogs,
  openInEditor,
  networking,
  devTools,
};

export type { ClientOptions };
