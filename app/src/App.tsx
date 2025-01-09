import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { DReactionServerProvider } from './context/DReaction';
import { useLayoutStore } from './store/layout';
import { DeviceLogs } from './components/DeviceLogs';
import { DeviceData } from './components/DeviceData';
import { DeviceCommand } from './components/DeviceCommand';

import '@mantine/core/styles.css';

export const App: React.FC = () => {
  const activePage = useLayoutStore((state) => state.activePage);

  return (
    <DReactionServerProvider>
      <MantineProvider>
        <Layout>
          {activePage === 'home' && <Home />}

          {activePage === 'dashboard' && <DeviceLogs />}

          {activePage === 'dataWatch' && <DeviceData />}

          {activePage === 'command' && <DeviceCommand />}
        </Layout>
      </MantineProvider>
    </DReactionServerProvider>
  );
};
