import { Platform } from 'react-native';
import type { DReactionCore, Plugin } from 'dreaction-client-core';
import { isDev } from '../helpers/common';

let DevMenu = { show: () => {}, reload: () => {} };
if (Platform.OS === 'ios' && isDev()) {
  // this will be crash in ios release mode
  // so add is dev check
  DevMenu = require('react-native/Libraries/NativeModules/specs/NativeDevMenu');
}

const devTools: any = () => () => {
  return {
    onCommand: (command) => {
      if (
        command.type !== 'devtools.open' &&
        command.type !== 'devtools.reload'
      ) {
        return;
      }

      if (command.type === 'devtools.open') {
        DevMenu.show();
      }

      if (command.type === 'devtools.reload') {
        DevMenu.reload();
      }
    },
  } satisfies Plugin<DReactionCore>;
};

export default devTools;
