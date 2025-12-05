import mitt from 'mitt';
import type { DReactionCore, Plugin } from 'dreaction-client-core';

export const emitter = mitt();

export default function OverlayCreator() {
  return function overlay() {
    return {
      /**
       * Fires when any Reactotron message arrives.
       */
      onCommand: (command) => {
        if (command.type !== 'overlay') {
          return;
        }

        // relay this payload on to the emitter
        emitter.emit('overlay', command.payload);
      },
      onDisconnect() {
        emitter.emit('overlay', { uri: '' });
      },
    } satisfies Plugin<DReactionCore>;
  };
}
