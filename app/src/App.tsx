import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Layout } from './components/Layout';
import { DReactionServerProvider } from './context/DReaction';
import { useLayoutStore } from './store/layout';
import { Notifications } from '@mantine/notifications';
import clsx from 'clsx';
import { menu } from './utils/menu';

import '@mantine/core/styles.css';

export const App: React.FC = () => {
  const activePage = useLayoutStore((state) => state.activePage);

  return (
    <DReactionServerProvider>
      <MantineProvider>
        <Notifications />
        <Layout>
          {menu.map((item) => (
            <div className={clsx(item.key !== activePage && 'hidden')}>
              {item.component}
            </div>
          ))}
        </Layout>
      </MantineProvider>
    </DReactionServerProvider>
  );
};
