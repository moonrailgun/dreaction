import type {
  StateActionCompletePayload,
  StateBackupResponsePayload,
  StateKeysResponsePayload,
  StateValuesChangePayload,
  StateValuesResponsePayload,
} from 'dreaction-protocol';
import type { DReactionCore, Plugin, InferFeatures } from '../';

/**
 * Provides helper functions for send state responses.
 */
const stateResponse = () => (dreaction: DReactionCore) => {
  return {
    features: {
      stateActionComplete: (
        name: StateActionCompletePayload['name'],
        action: StateActionCompletePayload['action'],
        important = false
      ) =>
        dreaction.send('state.action.complete', { name, action }, !!important),

      stateValuesResponse: (
        path: StateValuesResponsePayload['path'],
        value: StateValuesResponsePayload['value'],
        valid: StateValuesResponsePayload['value'] = true
      ) => dreaction.send('state.values.response', { path, value, valid }),

      stateKeysResponse: (
        path: StateKeysResponsePayload['path'],
        keys: StateKeysResponsePayload['keys'],
        valid: StateKeysResponsePayload['valid'] = true
      ) => dreaction.send('state.keys.response', { path, keys, valid }),

      stateValuesChange: (changes: StateValuesChangePayload['changes']) =>
        changes.length > 0 &&
        dreaction.send('state.values.change', { changes }),

      /** sends the state backup over to the server */
      stateBackupResponse: (state: StateBackupResponsePayload['state']) =>
        dreaction.send('state.backup.response', { state }),
    },
  } satisfies Plugin<DReactionCore>;
};

export type StateResponsePlugin = ReturnType<typeof stateResponse>;
export type StateResponseFeatures = InferFeatures<
  ReturnType<typeof stateResponse>
>;

export default stateResponse;

export const hasStateResponsePlugin = (
  dreaction: DReactionCore
): dreaction is DReactionCore & StateResponseFeatures =>
  dreaction &&
  'stateActionComplete' in dreaction &&
  typeof dreaction.stateActionComplete === 'function' &&
  'stateValuesResponse' in dreaction &&
  typeof dreaction.stateValuesResponse === 'function' &&
  'stateKeysResponse' in dreaction &&
  typeof dreaction.stateKeysResponse === 'function' &&
  'stateValuesChange' in dreaction &&
  typeof dreaction.stateValuesChange === 'function' &&
  'stateBackupResponse' in dreaction &&
  typeof dreaction.stateBackupResponse === 'function';

export const assertHasStateResponsePlugin = (
  dreaction: DReactionCore
): asserts dreaction is DReactionCore & StateResponseFeatures => {
  if (!hasStateResponsePlugin(dreaction)) {
    throw new Error(
      'This DReaction client has not had the state responses plugin applied to it. Make sure that you add `use(stateResponse())` before adding this plugin.'
    );
  }
};
