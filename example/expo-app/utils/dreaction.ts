import { dreaction } from 'dreaction-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

dreaction
  .configure({})
  .setAsyncStorageHandler(AsyncStorage)
  .useReactNative()
  .connect();

export const { useDebugDataWatch: useDebugCounter } =
  dreaction.registerDataWatcher('counter', 'text');

export const { useDebugDataWatch: useDebugList } =
  dreaction.registerDataWatcher('list', 'list');

export const { useDebugDataWatch: useDebugObject } =
  dreaction.registerDataWatcher('object', 'json');
