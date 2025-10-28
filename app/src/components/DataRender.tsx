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
    return <div className="break-words dark:text-gray-300">{data}</div>;
  }

  if (typeof data === 'number') {
    return <div className="dark:text-gray-300">{data}</div>;
  }

  if (typeof data === 'undefined') {
    return <div className="text-neutral-500 dark:text-gray-600">undefined</div>;
  }

  if (typeof data === 'symbol') {
    return <div className="dark:text-gray-300">{String(data)}</div>;
  }

  if (data === null) {
    return <div className="text-neutral-500 dark:text-gray-600">null</div>;
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
          className="dark:border-gray-800"
        >
          <Table.Thead className="dark:bg-gray-900">
            <Table.Tr>
              {keys.map((k) => (
                <Table.Th
                  key={k}
                  className="min-w-20 dark:border-gray-800 dark:text-gold-400"
                >
                  {k}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((item, i) => (
              <Table.Tr
                key={i}
                className="dark:border-gray-800 dark:hover:bg-gray-900"
              >
                {keys.map((k) => (
                  <Table.Td
                    key={k}
                    className="dark:border-gray-800 dark:text-gray-300"
                  >
                    {String(item[k] ?? '')}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    );
  });
TableDataRender.displayName = 'TableDataRender';
