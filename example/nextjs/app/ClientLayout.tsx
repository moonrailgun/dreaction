'use client';

import { ConfigPanel } from 'dreaction-react';
import '../utils/dreaction'; // Import to initialize dreaction

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ConfigPanel />
    </>
  );
}
