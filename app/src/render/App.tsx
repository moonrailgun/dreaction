import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Layout } from './components/Layout';
import { Home } from './components/Home';

import '@mantine/core/styles.css';

export const App: React.FC = () => {
  return (
    <MantineProvider>
      <Layout>
        <Home />
      </Layout>
    </MantineProvider>
  );
};
