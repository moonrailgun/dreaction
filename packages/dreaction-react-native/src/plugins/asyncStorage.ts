import type { DReactionCore, Plugin } from 'dreaction-client-core';
// @ts-ignore
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
export interface AsyncStorageOptions {
  ignore?: string[];
}

const PLUGIN_DEFAULTS: AsyncStorageOptions = {
  ignore: [],
};

const asyncStorage =
  (options?: AsyncStorageOptions) => (dreaction: DReactionCore) => {
    // setup configuration
    const config = Object.assign({}, PLUGIN_DEFAULTS, options || {});
    const ignore = config.ignore || PLUGIN_DEFAULTS.ignore;

    let swizzSetItem: AsyncStorageStatic['setItem'];
    let swizzRemoveItem: AsyncStorageStatic['removeItem'];
    let swizzMergeItem: AsyncStorageStatic['mergeItem'];
    let swizzClear: AsyncStorageStatic['clear'];
    let swizzMultiSet: AsyncStorageStatic['multiSet'];
    let swizzMultiRemove: AsyncStorageStatic['multiRemove'];
    let swizzMultiMerge: AsyncStorageStatic['multiMerge'];
    let isSwizzled = false;

    const sendToDReaction = (action: string, data?: any) => {
      dreaction.send('asyncStorage.mutation', { action, data });
    };

    const setItem: AsyncStorageStatic['setItem'] = async (
      key: string,
      value: any,
      callback: any
    ) => {
      try {
        if (ignore!.indexOf(key) < 0) {
          sendToDReaction('setItem', { key, value });
        }
      } catch (e) {}
      return swizzSetItem(key, value, callback);
    };

    const removeItem: AsyncStorageStatic['removeItem'] = async (
      key: string,
      callback: any
    ) => {
      try {
        if (ignore!.indexOf(key) < 0) {
          sendToDReaction('removeItem', { key });
        }
      } catch (e) {}
      return swizzRemoveItem(key, callback);
    };

    const mergeItem: AsyncStorageStatic['mergeItem'] = async (
      key: string,
      value: any,
      callback: any
    ) => {
      try {
        if (ignore!.indexOf(key) < 0) {
          sendToDReaction('mergeItem', { key, value });
        }
      } catch (e) {}
      return swizzMergeItem(key, value, callback);
    };

    const clear: AsyncStorageStatic['clear'] = async (callback: any) => {
      try {
        sendToDReaction('clear');
      } catch (e) {}
      return swizzClear(callback);
    };

    const multiSet: AsyncStorageStatic['multiSet'] = async (
      pairs: any,
      callback: any
    ) => {
      try {
        const shippablePairs = (pairs || []).filter(
          (pair: any) => pair && pair[0] && ignore!.indexOf(pair[0]) < 0
        );
        if (shippablePairs.length > 0) {
          sendToDReaction('multiSet', { pairs: shippablePairs });
        }
      } catch (e) {}
      return swizzMultiSet(pairs, callback);
    };

    const multiRemove: AsyncStorageStatic['multiRemove'] = async (
      keys: any,
      callback: any
    ) => {
      try {
        const shippableKeys = (keys || []).filter(
          (key: any) => ignore!.indexOf(key) < 0
        );
        if (shippableKeys.length > 0) {
          sendToDReaction('multiRemove', { keys: shippableKeys });
        }
      } catch (e) {}
      return swizzMultiRemove(keys, callback);
    };

    const multiMerge: AsyncStorageStatic['multiMerge'] = async (
      pairs: any,
      callback: any
    ) => {
      try {
        const shippablePairs = (pairs || []).filter(
          (pair: any) => pair && pair[0] && ignore!.indexOf(pair[0]) < 0
        );
        if (shippablePairs.length > 0) {
          sendToDReaction('multiMerge', { pairs: shippablePairs });
        }
      } catch (e) {}
      return swizzMultiMerge(pairs, callback);
    };

    /**
     * Hijacks the AsyncStorage API.
     */
    const trackAsyncStorage = () => {
      if (isSwizzled) return;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      swizzSetItem = dreaction.asyncStorageHandler.setItem;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.setItem = setItem;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      swizzRemoveItem = dreaction.asyncStorageHandler.removeItem;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.removeItem = removeItem;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      swizzMergeItem = dreaction.asyncStorageHandler.mergeItem;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.mergeItem = mergeItem;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      swizzClear = dreaction.asyncStorageHandler.clear;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.clear = clear;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      swizzMultiSet = dreaction.asyncStorageHandler.multiSet;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.multiSet = multiSet;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      swizzMultiRemove = dreaction.asyncStorageHandler.multiRemove;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.multiRemove = multiRemove;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      swizzMultiMerge = dreaction.asyncStorageHandler.multiMerge;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.multiMerge = multiMerge;

      isSwizzled = true;
    };

    const untrackAsyncStorage = () => {
      if (!isSwizzled) return;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.setItem = swizzSetItem;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.removeItem = swizzRemoveItem;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.mergeItem = swizzMergeItem;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.clear = swizzClear;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.multiSet = swizzMultiSet;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.multiRemove = swizzMultiRemove;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: dreaction-apis
      dreaction.asyncStorageHandler.multiMerge = swizzMultiMerge;

      isSwizzled = false;
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: dreaction-apis
    if (dreaction.asyncStorageHandler) {
      trackAsyncStorage();
    }

    return {
      features: {
        trackAsyncStorage,
        untrackAsyncStorage,
      },
    } satisfies Plugin<DReactionCore>;
  };

export default asyncStorage;
