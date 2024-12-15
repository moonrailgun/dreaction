import { IconBinaryTree, IconGauge, IconHome2 } from '@tabler/icons-react';
import { create } from 'zustand';

export const menu = [
  { key: 'home', icon: IconHome2, label: 'Home' },
  { key: 'dashboard', icon: IconGauge, label: 'Dashboard' },
  { key: 'dataWatch', icon: IconBinaryTree, label: 'DataWatch' },
] as const;
export interface LayoutState {
  activePage: (typeof menu)[number]['key'];
}

export const useLayoutStore = create<LayoutState>((set) => ({
  activePage: 'home',
}));
