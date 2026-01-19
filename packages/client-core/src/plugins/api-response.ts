import type {
  NetworkRequest,
  NetworkResponse,
} from 'dreaction-protocol';
import type { DReactionCore, Plugin } from '../types';

let requestCounter = 0;

/**
 * Generates a unique request ID for pairing api.request and api.response events.
 */
export function generateRequestId(): string {
  requestCounter++;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${requestCounter}-${random}`;
}

export interface ApiResponseFeatures {
  apiRequest: (requestId: string, request: NetworkRequest) => void;
  apiResponse: (
    requestId: string,
    request: NetworkRequest,
    response: NetworkResponse,
    duration: number
  ) => void;
}

export type ApiResponsePlugin = Plugin<DReactionCore> & {
  features: ApiResponseFeatures;
};

/**
 * Sends API request/response information.
 */
const apiResponse = () => (dreaction: DReactionCore) => {
  return {
    features: {
      apiRequest: (requestId: string, request: NetworkRequest) => {
        dreaction.send('api.request', { requestId, request });
      },
      apiResponse: (
        requestId: string,
        request: NetworkRequest,
        response: NetworkResponse,
        duration: number
      ) => {
        const ok =
          response &&
          response.status &&
          typeof response.status === 'number' &&
          response.status >= 200 &&
          response.status <= 299;
        const important = !ok;
        dreaction.send(
          'api.response',
          { requestId, request, response, duration },
          important
        );
      },
    },
  } satisfies ApiResponsePlugin;
};

export default apiResponse;
