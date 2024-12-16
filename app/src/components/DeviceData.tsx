import React, { useMemo, useState } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { entries, groupBy, last } from 'lodash-es';
import { JSONView } from './JSONView';
import { ActionIcon } from '@mantine/core';
import { DataRender } from './DataRender';
import { repairSerialization } from '../utils/repairSerialization';
import clsx from 'clsx';
import { IconMaximize, IconMaximizeOff } from '@tabler/icons-react';
import AutoScrollContainer from './AutoScrollContainer';

export const DeviceData: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();
  const [maximizeName, setMaximizeName] = useState<string | null>(null);

  const dataList = useMemo(() => {
    const list = selectedConnection?.commands
      .filter((command) => command.type === 'dataWatch')
      .reverse();

    return entries(groupBy(list, (item) => item.payload.name));
  }, [selectedConnection?.commands]);

  return (
    <div className="h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-2 gap-2">
      {dataList.length === 0 && <div>No any data has been register</div>}

      {dataList.map(([name, list]) => {
        const isMaximize = maximizeName === name;
        const payload = repairSerialization(last(list)?.payload);

        return (
          <div
            key={name}
            className={clsx(
              'p-2 rounded-lg border border-black border-opacity-20 overflow-auto flex flex-col',
              isMaximize
                ? 'w-full h-full col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5'
                : 'max-h-96',
              !isMaximize && maximizeName !== null && 'hidden'
            )}
          >
            <div className="text-lg font-semibold flex">
              <div className="flex-1">{name}</div>

              <div>
                <ActionIcon
                  color="gray"
                  variant="subtle"
                  onClick={() =>
                    isMaximize ? setMaximizeName(null) : setMaximizeName(name)
                  }
                >
                  {isMaximize ? <IconMaximizeOff /> : <IconMaximize />}
                </ActionIcon>
              </div>
            </div>

            {payload && (
              <div className="overflow-auto flex-1">
                {payload.type === 'text' && <div>{String(payload.data)}</div>}

                {payload.type === 'list' &&
                  (Array.isArray(payload.data) ? (
                    <AutoScrollContainer className="w-full h-full overflow-auto">
                      {payload.data.map((item, index) => (
                        <div
                          key={index}
                          className="odd:bg-neutral-100 hover:bg-neutral-200 transition-all px-2 py-1 rounded opacity-80 text-sm"
                        >
                          <DataRender data={item} />
                        </div>
                      ))}
                    </AutoScrollContainer>
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
