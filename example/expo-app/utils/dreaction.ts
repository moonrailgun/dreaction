import { dreaction, watchFPS } from 'dreaction-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

watchFPS();

dreaction
  .configure({
    info: {
      demo: 'demo info',
    },
  })
  .setAsyncStorageHandler(AsyncStorage)
  .useReactNative({
    overlay: true,
  })
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
    const res = Math.random();

    console.log('res', res, args);

    return String(res);
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

dreaction.registerCustomCommand({
  title: 'Render Table response',
  command: 'returnTable',
  description: 'This command will return ',
  responseViewType: 'table',
  handler: (args) => {
    return [
      {
        a: 1,
        b: 2,
        c: 2,
        d: 2,
        eeeeeeeeee: 2,
        f: 2,
        g: 2,
      },
      {
        a: 2,
        b: 3,
      },
      {
        a: 4,
        b: 5,
      },
    ];
  },
});
