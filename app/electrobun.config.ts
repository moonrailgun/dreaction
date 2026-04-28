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
      // Only `@ngrok/ngrok` must stay external because it loads a native
      // .node binary at runtime. Workspace deps and pure JS deps must be
      // bundled, otherwise the packaged app cannot resolve them inside
      // /Applications where there is no node_modules walk-up path.
      external: ['@ngrok/ngrok'],
    },
    views: {
      'main-ui': {
        entrypoint: 'src/views/main-ui/index.ts',
      },
    },
    copy: {
      'src/views/main-ui/index.html': 'views/main-ui/index.html',
      // Ship native deps that cannot be bundled (see scripts/prepare-native-deps.ts).
      // The staging dir is generated before each build/dev run.
      '.native-deps/node_modules/@ngrok': 'node_modules/@ngrok',
    },
    mac: {
      icons: 'assets/icon.iconset',
    },
    win: {
      icon: 'assets/icon.ico',
    },
    linux: {
      icon: 'assets/icon.png',
    },
  },
} satisfies ElectrobunConfig;
