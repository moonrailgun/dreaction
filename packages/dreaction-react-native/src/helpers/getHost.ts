// @ts-ignore
import { NativeModules } from 'react-native';
import { getHostFromUrl } from './parseURL';

/**
 * Most of the time, host should be 'localhost'.
 * But sometimes, it's not.  So we need to figure out what it is.
 * @see https://github.com/infinitered/dreaction/issues/1107
 *
 * On an Android emulator, if you want to connect any servers of local, you will need run adb reverse on your terminal. This function gets the localhost IP of host machine directly to bypass this.
 */
export const getHost = (defaultHost = 'localhost') => {
  try {
    // RN Reference: https://github.com/facebook/react-native/blob/main/packages/react-native/src/private/specs/modules/NativeSourceCode.js
    const scriptURL = NativeModules?.SourceCode?.getConstants?.().scriptURL;

    if (typeof scriptURL !== 'string') {
      throw new Error('Invalid non-string URL');
    }

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
