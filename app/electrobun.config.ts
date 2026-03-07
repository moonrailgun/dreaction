import type { ElectrobunConfig } from 'electrobun';

export default {
  app: {
    name: 'DReaction',
    identifier: 'com.moonrailgun.dreaction',
    version: '1.10.0',
  },
  runtime: {
    exitOnLastWindowClosed: true,
  },
  build: {
    bun: {
      entrypoint: 'src/bun/index.ts',
      external: ['@ngrok/ngrok', 'ws', 'dreaction-server-core', 'dreaction-protocol', 'eventemitter-strict'],
    },
    views: {
      'main-ui': {
        entrypoint: 'src/views/main-ui/index.ts',
      },
    },
    copy: {
      'src/views/main-ui/index.html': 'views/main-ui/index.html',
    },
  },
} satisfies ElectrobunConfig;
