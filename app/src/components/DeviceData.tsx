import React, { useMemo } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { entries, groupBy, last } from 'lodash-es';
import { JSONView } from './JsonView';
import { List } from '@mantine/core';
import { DataRender } from './DataRender';

export const DeviceData: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();

  const dataList = useMemo(() => {
    const list = selectedConnection?.commands
      .filter((command) => command.type === 'dataWatch')
      .reverse();

    return entries(groupBy(list, (item) => item.payload.name));
  }, [selectedConnection?.commands]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-2 gap-2">
      {dataList.length === 0 && <div>No any data has been register</div>}

      {dataList.map(([name, list]) => {
        const payload = last(list)?.payload;

        return (
          <div
            key={name}
            className="p-2 rounded-lg border border-black border-opacity-20 max-h-96 overflow-auto flex flex-col"
          >
            <div className="text-lg font-semibold">{name}</div>

            {payload && (
              <div className="overflow-auto flex-1">
                {payload.type === 'text' && <div>{String(payload.data)}</div>}

                {payload.type === 'list' &&
                  (Array.isArray(payload.data) ? (
                    <List>
                      {payload.data.map((item, index) => (
                        <List.Item key={index}>
                          <DataRender data={item} />
                        </List.Item>
                      ))}
                    </List>
                  ) : (
                    <JSONView data={payload.data} />
                  ))}

                {payload.type === 'json' && <JSONView data={payload.data} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
DeviceData.displayName = 'DeviceData';
