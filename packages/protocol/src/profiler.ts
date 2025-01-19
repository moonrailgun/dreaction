/**
 * Reference: https://react.dev/reference/react/Profiler#onrender-callback
 */
export interface ProfilerRenderPayload {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}
