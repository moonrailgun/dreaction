import type { DReactionCore } from '../types';

type AnyFunction = (...args: any[]) => any;

/**
 * Create type guard functions for plugin features.
 * Reduces boilerplate for hasXxxPlugin and assertHasXxxPlugin patterns.
 */
export function createPluginGuard<T extends Record<string, AnyFunction>>(
  featureNames: (keyof T)[],
  pluginName: string
) {
  const has = (client: DReactionCore): client is DReactionCore & T => {
    return featureNames.every(
      (name) => name in client && typeof (client as any)[name] === 'function'
    );
  };

  const assert = (
    client: DReactionCore
  ): asserts client is DReactionCore & T => {
    if (!has(client)) {
      throw new Error(
        `This DReaction client has not had the ${pluginName} plugin applied to it. ` +
          `Make sure that you add the plugin before using these features.`
      );
    }
  };

  return { has, assert };
}
