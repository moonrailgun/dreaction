import type {
  StateActionCompletePayload,
  StateBackupResponsePayload,
  StateKeysResponsePayload,
  StateValuesChangePayload,
  StateValuesResponsePayload,
} from 'dreaction-protocol';
import type { DReactionCore, Plugin, InferFeatures } from '../types';
import { createPluginGuard } from '../utils/plugin-guard';

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

      stateBackupResponse: (state: StateBackupResponsePayload['state']) =>
        dreaction.send('state.backup.response', { state }),
    },
  } satisfies Plugin<DReactionCore>;
};

export default stateResponse;

export type StateResponsePlugin = ReturnType<typeof stateResponse>;
export type StateResponseFeatures = InferFeatures<
  ReturnType<typeof stateResponse>
>;

const stateResponseGuard = createPluginGuard<StateResponseFeatures>(
  [
    'stateActionComplete',
    'stateValuesResponse',
    'stateKeysResponse',
    'stateValuesChange',
    'stateBackupResponse',
  ],
  'state responses'
);

export const hasStateResponsePlugin = stateResponseGuard.has;
export const assertHasStateResponsePlugin = stateResponseGuard.assert;
