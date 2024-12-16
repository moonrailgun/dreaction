import React from 'react';
import { JSONView } from './JSONView';

export const DataRender: React.FC<{ data: unknown }> = React.memo((props) => {
  const { data } = props;

  if (typeof data === 'string') {
    return <div>{data}</div>;
  }

  if (typeof data === 'number') {
    return <div>{data}</div>;
  }

  if (typeof data === 'undefined') {
    return <div className="text-neutral-500">undefined</div>;
  }

  if (typeof data === 'symbol') {
    return <div>{String(data)}</div>;
  }

  if (data === null) {
    return <div className="text-neutral-500">null</div>;
  }

  return <JSONView data={data} />;
});
DataRender.displayName = 'DataRender';
