import { create } from 'zustand';
import { menu } from '../utils/menu';

export type ActivePage = (typeof menu)[number]['key'];

export interface LayoutState {
  activePage: ActivePage;
}

export const useLayoutStore = create<LayoutState>(() => ({
  activePage: 'home',
}));
