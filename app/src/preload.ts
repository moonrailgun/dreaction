// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ipcRenderer, contextBridge } from 'electron';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
        send(channel: string, ...args: unknown[]): void;
        on(channel: string, func: (...args: unknown[]) => void): void;
      };
    };
  }
}

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
      return ipcRenderer.invoke(channel, ...args);
    },
    send(channel: string, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: string, func: (...args: unknown[]) => void) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
  },
});
