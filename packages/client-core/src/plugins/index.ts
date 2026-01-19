import type { DReactionCore, PluginCreator } from '../types';
import logger from './logger';
import image from './image';
import benchmark from './benchmark';
import stateResponses from './state-responses';
import apiResponse from './api-response';
import clear from './clear';
import issue from './issue';

export { default as logger } from './logger';
export { default as image } from './image';
export { default as benchmark } from './benchmark';
export { default as stateResponses } from './state-responses';
export { default as apiResponse } from './api-response';
export { default as clear } from './clear';
export { default as issue } from './issue';

export const corePlugins = [
  image(),
  logger(),
  benchmark(),
  stateResponses(),
  apiResponse(),
  clear(),
  issue(),
] satisfies PluginCreator<DReactionCore>[];
