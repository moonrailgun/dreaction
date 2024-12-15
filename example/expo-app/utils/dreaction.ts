import { dreaction } from 'dreaction-react-native';

dreaction.configure({}).useReactNative().connect();

export const { useDebugDataWatch: useDebugCounter } =
  dreaction.registerDataWatcher('counter', 'text');

export const { useDebugDataWatch: useDebugList } =
  dreaction.registerDataWatcher('list', 'list');

export const { useDebugDataWatch: useDebugObject } =
  dreaction.registerDataWatcher('object', 'json');
