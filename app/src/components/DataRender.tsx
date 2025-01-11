import React, { useMemo } from 'react';
import { JSONView } from './JSONView';
import { Table } from '@mantine/core';
import { flatten, uniq } from 'lodash-es';

interface DataRenderProps {
  data: unknown;
  useTableMode?: boolean;
}
export const DataRender: React.FC<DataRenderProps> = React.memo((props) => {
  const { data, useTableMode } = props;

  if (typeof data === 'string') {
    return <div className="break-words">{data}</div>;
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

  if (useTableMode && Array.isArray(data)) {
    return <TableDataRender data={data} />;
  }

  return <JSONView data={data} />;
});
DataRender.displayName = 'DataRender';

export const TableDataRender: React.FC<{ data: Record<string, unknown>[] }> =
  React.memo((props) => {
    const { data } = props;

    const keys = useMemo(
      () => uniq(flatten(data.map((item) => Object.keys(item)))),
      [data]
    );

    return (
      <Table.ScrollContainer minWidth={400} type="scrollarea">
        <Table
          highlightOnHover={true}
          withTableBorder={true}
          withColumnBorders={true}
        >
          <Table.Thead>
            <Table.Tr>
              {keys.map((k) => (
                <Table.Th key={k} className="min-w-20">
                  {k}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((item, i) => (
              <Table.Tr key={i}>
                {keys.map((k) => (
                  <Table.Td key={k}>{String(item[k] ?? '')}</Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    );
  });
TableDataRender.displayName = 'TableDataRender';
