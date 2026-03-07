import { Electroview } from 'electrobun/view';
import type { MainUIRPCType } from '../shared/rpc-types';

const viewRPC = Electroview.defineRPC<MainUIRPCType>({
  handlers: {
    requests: {},
    messages: {},
  },
});

export const electrobun = new Electroview<typeof viewRPC>({ rpc: viewRPC });

export const rpc = viewRPC;
