import type { DReactionCore, Plugin } from '../';

/**
 * Clears the reactotron server.
 */
const clear = () => (reactotron: DReactionCore) => {
  return {
    features: {
      clear: () => reactotron.send('clear'),
    },
  } satisfies Plugin<DReactionCore>;
};

export default clear;
