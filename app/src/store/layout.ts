import {
  IconBinaryTree,
  IconGauge,
  IconHome2,
  IconCommand,
} from '@tabler/icons-react';
import { create } from 'zustand';

export const menu = [
  { key: 'home', icon: IconHome2, label: 'Home' },
  { key: 'dashboard', icon: IconGauge, label: 'Dashboard' },
  { key: 'dataWatch', icon: IconBinaryTree, label: 'DataWatch' },
  { key: 'command', icon: IconCommand, label: 'Command' },
] as const;

export type ActivePage = (typeof menu)[number]['key'];

export interface LayoutState {
  activePage: ActivePage;
}

export const useLayoutStore = create<LayoutState>(() => ({
  activePage: 'home',
}));
