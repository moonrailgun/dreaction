import { rpc } from './rpc';

export const getIp = async (): Promise<string> => {
  return rpc.request.getLocalIP({});
};
