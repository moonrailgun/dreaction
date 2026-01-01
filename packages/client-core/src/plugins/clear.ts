import type { DReactionCore, Plugin } from '../types';

/**
 * Clears the dreaction server.
 */
const clear = () => (dreaction: DReactionCore) => {
  return {
    features: {
      clear: () => dreaction.send('clear'),
    },
  } satisfies Plugin<DReactionCore>;
};

export default clear;
