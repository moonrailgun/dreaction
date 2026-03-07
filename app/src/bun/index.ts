import os from 'os';
import {
  BrowserWindow,
  BrowserView,
  ApplicationMenu,
  Screen,
} from 'electrobun/bun';
import type { MainUIRPCType } from '../shared/rpc-types';
import {
  startDReactionServer,
  sendCommandToClient,
  getServerPort,
} from './server';
import { startNgrokTunnel, stopNgrokTunnel } from './ngrok';

function getLocalIPAddress(): string {
  const interfaces = os.networkInterfaces();
  if (interfaces['en0']) {
    for (const iface of interfaces['en0']) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

ApplicationMenu.setApplicationMenu([
  {
    label: 'DReaction',
    submenu: [
      { label: 'About DReaction', role: 'about' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'showAll' },
      { type: 'separator' },
      { label: 'Quit DReaction', role: 'quit' },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteAndMatchStyle' },
      { role: 'delete' },
      { role: 'selectAll' },
    ],
  },
  {
    label: 'View',
    submenu: [{ role: 'toggleFullScreen' }],
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      { role: 'close' },
      { type: 'separator' },
      { role: 'bringAllToFront' },
    ],
  },
]);

const mainUIRPC = BrowserView.defineRPC<MainUIRPCType>({
  maxRequestTime: 30000,
  handlers: {
    requests: {
      sendCommand: ({ type, payload, clientId }) => {
        return sendCommandToClient(type, payload, clientId);
      },
      startNgrokTunnel: async ({ port, authtoken, domain }) => {
        try {
          const result = await startNgrokTunnel(
            port || getServerPort(),
            authtoken,
            domain
          );
          return { url: result.url };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to start tunnel';
          return { error: message };
        }
      },
      stopNgrokTunnel: async () => {
        await stopNgrokTunnel();
        return true;
      },
      openExternal: ({ url }) => {
        Bun.spawn(['open', url]);
        return true;
      },
      getLocalIP: () => {
        return getLocalIPAddress();
      },
    },
    messages: {},
  },
});

const windowWidth = 1280;
const windowHeight = 768;
const { workArea } = Screen.getPrimaryDisplay();
const win = new BrowserWindow({
  title: 'DReaction',
  url: 'views://main-ui/index.html',
  frame: {
    x: Math.round(workArea.x + (workArea.width - windowWidth) / 2),
    y: Math.round(workArea.y + (workArea.height - windowHeight) / 2),
    width: windowWidth,
    height: windowHeight,
  },
  rpc: mainUIRPC,
});

// Start the WebSocket server and wire up RPC message sending
const rpcSend = {
  serverStatusChanged: (data: { status: string }) =>
    mainUIRPC.send.serverStatusChanged(data as any),
  connectionEstablished: (data: any) =>
    mainUIRPC.send.connectionEstablished(data),
  connectionDisconnected: (data: any) =>
    mainUIRPC.send.connectionDisconnected(data),
  commandReceived: (data: any) => mainUIRPC.send.commandReceived(data),
  portUnavailable: (data: any) => mainUIRPC.send.portUnavailable(data),
};

startDReactionServer(rpcSend);
