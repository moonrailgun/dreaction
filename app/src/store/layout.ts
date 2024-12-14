import { create } from 'zustand';

export interface LayoutState {
  activePage: string;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  activePage: 'home',
}));
