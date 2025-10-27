import type { DReactionCore, Plugin } from 'dreaction-client-core';

export interface LocalStorageOptions {
  ignore?: string[];
}

const PLUGIN_DEFAULTS: LocalStorageOptions = {
  ignore: [],
};

const localStorage =
  (options?: LocalStorageOptions) => (dreaction: DReactionCore) => {
    // setup configuration
    const config = Object.assign({}, PLUGIN_DEFAULTS, options || {});
    const ignore = config.ignore || PLUGIN_DEFAULTS.ignore;

    let originalSetItem: typeof Storage.prototype.setItem;
    let originalRemoveItem: typeof Storage.prototype.removeItem;
    let originalClear: typeof Storage.prototype.clear;
    let isIntercepted = false;

    const sendToDReaction = (action: string, data?: any) => {
      dreaction.send('asyncStorage.mutation', { action: action as any, data });
    };

    const setItem = function (this: Storage, key: string, value: string): void {
      try {
        if (ignore!.indexOf(key) < 0) {
          sendToDReaction('setItem', { key, value });
        }
      } catch (e) {
        // ignore errors
      }
      return originalSetItem.call(this, key, value);
    };

    const removeItem = function (this: Storage, key: string): void {
      try {
        if (ignore!.indexOf(key) < 0) {
          sendToDReaction('removeItem', { key });
        }
      } catch (e) {
        // ignore errors
      }
      return originalRemoveItem.call(this, key);
    };

    const clear = function (this: Storage): void {
      try {
        sendToDReaction('clear');
      } catch (e) {
        // ignore errors
      }
      return originalClear.call(this);
    };

    /**
     * Hijacks the localStorage API.
     */
    const trackLocalStorage = () => {
      if (isIntercepted) return;
      if (typeof window === 'undefined' || !window.localStorage) return;

      originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = setItem;

      originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = removeItem;

      originalClear = Storage.prototype.clear;
      Storage.prototype.clear = clear;

      isIntercepted = true;
    };

    const untrackLocalStorage = () => {
      if (!isIntercepted) return;

      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.removeItem = originalRemoveItem;
      Storage.prototype.clear = originalClear;

      isIntercepted = false;
    };

    return {
      onConnect: () => {
        trackLocalStorage();
      },
      onDisconnect: () => {
        untrackLocalStorage();
      },
      features: {
        trackLocalStorage,
        untrackLocalStorage,
      },
    } satisfies Plugin<DReactionCore>;
  };

export default localStorage;
