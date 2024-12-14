import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { DReactionServerProvider } from './context/DReaction';

import '@mantine/core/styles.css';

export const App: React.FC = () => {
  return (
    <DReactionServerProvider>
      <MantineProvider>
        <Layout>
          <Home />
        </Layout>
      </MantineProvider>
    </DReactionServerProvider>
  );
};
