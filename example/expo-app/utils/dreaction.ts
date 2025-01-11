import { dreaction } from 'dreaction-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

dreaction
  .configure({
    info: {
      demo: 'demo info',
    },
  })
  .setAsyncStorageHandler(AsyncStorage)
  .useReactNative()
  .connect();

export const { useDebugDataWatch: useDebugCounter } =
  dreaction.registerDataWatcher('counter', 'text');

export const { useDebugDataWatch: useDebugList } =
  dreaction.registerDataWatcher('list', 'list');

export const { useDebugDataWatch: useDebugObject } =
  dreaction.registerDataWatcher('object', 'json');

dreaction.registerCustomCommand({
  title: 'Foo',
  command: 'foo',
  description: 'Some foo infomation',
  args: [
    {
      name: 'bar' as const,
      type: 'string',
    },
  ],
  handler: (args) => {
    console.log('print foo', args);
  },
});

dreaction.registerCustomCommand({
  title: 'Foo2',
  command: 'foo2',
  description: 'Should **support** `markdown`',
  handler: (args) => {
    console.log('print foo', args);
  },
});
