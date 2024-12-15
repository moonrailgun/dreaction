import type { DReactionCore, Plugin } from '../';

/**
 * Sends API request/response information.
 */
const apiResponse = () => (reactotron: DReactionCore) => {
  return {
    features: {
      apiResponse: (
        request: { status: number },
        response: any,
        duration: number
      ) => {
        const ok =
          response &&
          response.status &&
          typeof response.status === 'number' &&
          response.status >= 200 &&
          response.status <= 299;
        const important = !ok;
        reactotron.send(
          'api.response',
          { request, response, duration },
          important
        );
      },
    },
  } satisfies Plugin<DReactionCore>;
};

export default apiResponse;
