import React, { Profiler as ReactProfiler, PropsWithChildren } from 'react';
import { dreaction } from '../dreaction';

export const Profiler: React.FC<PropsWithChildren<{ id: string }>> = React.memo(
  (props) => {
    return (
      <ReactProfiler
        id={props.id}
        onRender={(
          id,
          phase,
          actualDuration,
          baseDuration,
          startTime,
          commitTime
        ) => {
          dreaction.send('profiler.render', {
            id,
            phase,
            actualDuration,
            baseDuration,
            startTime,
            commitTime,
          });
        }}
      >
        {props.children}
      </ReactProfiler>
    );
  }
);
Profiler.displayName = 'Profiler';
