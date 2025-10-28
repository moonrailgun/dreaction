import React from 'react';
import { JSONTree } from 'react-json-tree';
import { repairSerialization } from '../utils/repairSerialization';
import { useThemeStore } from '../store/theme';

// Light mode theme
const lightTheme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633',
};

// Dark mode theme with black-gold palette
const darkTheme = {
  scheme: 'dark-gold',
  author: 'custom dark gold theme',
  base00: '#0A0A0A', // darkest background
  base01: '#1A1A1A', // dark background
  base02: '#2A2A2A', // medium dark
  base03: '#5A5A5A', // comment gray
  base04: '#8A8A8A', // dark foreground
  base05: '#C9C9C9', // light foreground
  base06: '#E0E0E0', // lighter foreground
  base07: '#F5F5F5', // lightest foreground
  base08: '#FF6B6B', // red - error
  base09: '#FFB86C', // orange - number
  base0A: '#FFD700', // gold - key/function (primary accent)
  base0B: '#98C379', // green - string
  base0C: '#56B6C2', // cyan - constant
  base0D: '#FFC107', // amber gold - variable
  base0E: '#C678DD', // purple - keyword
  base0F: '#B8860B', // dark gold - special
};

export const JSONView: React.FC<{ data: unknown; hideRoot?: boolean }> =
  React.memo((props) => {
    const colorScheme = useThemeStore((state) => state.colorScheme);
    const isDark = colorScheme === 'dark';

    return (
      <JSONTree
        theme={isDark ? darkTheme : lightTheme}
        data={repairSerialization(props.data)}
        invertTheme={!isDark}
        shouldExpandNodeInitially={(_keyPath, _data, level) => {
          return level < 2;
        }}
        hideRoot={props.hideRoot ?? false}
      />
    );
  });
JSONView.displayName = 'JSONView';
