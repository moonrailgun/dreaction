import React from 'react';
import {
  MantineProvider,
  createTheme,
  MantineColorsTuple,
} from '@mantine/core';
import { Layout } from './components/Layout';
import { DReactionServerProvider } from './context/DReaction';
import { useLayoutStore } from './store/layout';
import { useThemeStore } from './store/theme';
import { Notifications } from '@mantine/notifications';
import clsx from 'clsx';
import { menu } from './utils/menu';
import {
  GOLD_GRADIENT,
  GOLD_GRADIENT_HOVER,
  GOLD_SHADOW,
} from './constants/theme';

import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';

// Define custom gold color palette
const gold: MantineColorsTuple = [
  '#FFF9E6', // 0: lightest gold
  '#FFECB3', // 1: very light gold
  '#FFE082', // 2: light gold
  '#FFD54F', // 3: gold
  '#FFD700', // 4: pure gold (light end of gradient)
  '#FFC107', // 5: amber gold
  '#FFB300', // 6: medium gold
  '#C8A600', // 7: dark gold
  '#B8860B', // 8: darkest gold (dark end of gradient)
  '#8B6914', // 9: bronze gold
];

// Define custom dark color palette for backgrounds
const darkColors: MantineColorsTuple = [
  '#C9C9C9', // 0: lightest (text)
  '#B8B8B8', // 1
  '#828282', // 2
  '#696969', // 3
  '#424242', // 4
  '#3B3B3B', // 5
  '#2A2A2A', // 6: medium dark
  '#1A1A1A', // 7: dark
  '#0A0A0A', // 8: darkest
  '#000000', // 9: pure black
];

const theme = createTheme({
  primaryColor: 'gold',
  colors: {
    gold,
    dark: darkColors,
  },
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  components: {
    Button: {
      styles: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _theme: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _props: any,
        ctx?: { colorScheme?: 'light' | 'dark' }
      ) => {
        const isDark = ctx?.colorScheme === 'dark';
        if (!isDark) return {}; // Use default styles in light mode

        return {
          root: {
            background: GOLD_GRADIENT,
            color: '#000000',
            fontWeight: 600,
            '&:hover': {
              background: GOLD_GRADIENT_HOVER,
            },
          },
        };
      },
    },
    Blockquote: {
      styles: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        theme: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _props: any,
        ctx?: { colorScheme?: 'light' | 'dark' }
      ) => {
        const isDark = ctx?.colorScheme === 'dark';
        if (!isDark) return {}; // Use default styles in light mode

        return {
          root: {
            borderLeftColor: theme.colors.gold[4],
          },
        };
      },
    },
    Code: {
      styles: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        theme: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _props: any,
        ctx?: { colorScheme?: 'light' | 'dark' }
      ) => {
        const isDark = ctx?.colorScheme === 'dark';
        if (!isDark) return {}; // Use default styles in light mode

        return {
          root: {
            backgroundColor: theme.colors.gold[8],
            color: theme.colors.gold[0],
          },
        };
      },
    },
    Tabs: {
      styles: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        theme: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _props: any,
        ctx?: { colorScheme?: 'light' | 'dark' }
      ) => {
        const isDark = ctx?.colorScheme === 'dark';
        if (!isDark) return {}; // Use default styles in light mode

        return {
          tab: {
            color: theme.colors.dark[0],
            '&:hover': {
              backgroundColor: theme.colors.dark[6],
            },
            '&[data-active]': {
              color: '#000000',
              background: GOLD_GRADIENT,
              fontWeight: 600,
              borderColor: 'transparent',
            },
          },
          tabsList: {
            borderBottomColor: theme.colors.dark[6],
          },
        };
      },
    },
    SegmentedControl: {
      styles: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        theme: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _props: any,
        ctx?: { colorScheme?: 'light' | 'dark' }
      ) => {
        const isDark = ctx?.colorScheme === 'dark';
        if (!isDark) return {}; // Use default Mantine styles in light mode

        return {
          root: {
            backgroundColor: `${theme.colors.dark[8]} !important`,
            padding: '0 !important',
          },
          indicator: {
            background: `${GOLD_GRADIENT} !important`,
            boxShadow: GOLD_SHADOW,
          },
        };
      },
    },
  },
});

export const App: React.FC = () => {
  const activePage = useLayoutStore((state) => state.activePage);
  const colorScheme = useThemeStore((state) => state.colorScheme);

  // Sync Tailwind dark mode with Mantine color scheme
  React.useEffect(() => {
    const root = document.documentElement;
    if (colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [colorScheme]);

  return (
    <DReactionServerProvider>
      <MantineProvider theme={theme} forceColorScheme={colorScheme}>
        <Notifications />
        <Layout>
          {menu.map((item) => (
            <div
              key={item.key}
              className={clsx(
                'h-full w-full',
                item.key !== activePage && 'hidden'
              )}
            >
              {item.component}
            </div>
          ))}
        </Layout>
      </MantineProvider>
    </DReactionServerProvider>
  );
};
