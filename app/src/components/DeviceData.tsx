import React, { useMemo, useState } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { entries, groupBy, last } from 'lodash-es';
import { JSONView } from './JSONView';
import { ActionIcon, ScrollArea } from '@mantine/core';
import { DataRender } from './DataRender';
import { repairSerialization } from '../utils/repairSerialization';
import clsx from 'clsx';
import {
  IconMaximize,
  IconMaximizeOff,
  IconChevronRight,
} from '@tabler/icons-react';
import AutoScrollContainer from './AutoScrollContainer';

export const DeviceData: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();
  const [selectedDataName, setSelectedDataName] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const dataList = useMemo(() => {
    const list = [...(selectedConnection?.commands ?? [])]
      .filter((command) => command.type === 'dataWatch')
      .reverse();

    return entries(groupBy(list, (item) => item.payload.name));
  }, [selectedConnection?.commands]);

  React.useEffect(() => {
    if (dataList.length > 0 && !selectedDataName && dataList[0]) {
      setSelectedDataName(dataList[0][0]);
    }
  }, [dataList, selectedDataName]);

  const currentData = dataList.find(([name]) => name === selectedDataName);
  const currentPayload = currentData
    ? repairSerialization(last(currentData[1])?.payload)
    : null;

  if (dataList.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          No any data has been register
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div
        className={clsx(
          'border-r border-gray-200 flex flex-col transition-all duration-300',
          isMaximized ? 'w-16' : 'w-80'
        )}
      >
        <div className="p-4 border-b border-gray-200">
          {!isMaximized ? (
            <>
              <h3 className="text-lg font-semibold">Data Sources</h3>
              <p className="text-sm text-gray-500">
                {dataList.length} data source(s) available
              </p>
            </>
          ) : (
            <div className="text-center">
              <h3 className="text-xs font-semibold">Data</h3>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {dataList.map(([name, list]) => {
              const isSelected = selectedDataName === name;
              const payload = repairSerialization(last(list)?.payload);

              return (
                <div
                  key={name}
                  className={clsx(
                    'p-3 rounded-lg mb-2 cursor-pointer transition-colors',
                    'border border-transparent hover:bg-gray-50',
                    isSelected && 'bg-blue-50 border-blue-200'
                  )}
                  onClick={() => setSelectedDataName(name)}
                  title={isMaximized ? name : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div
                        className={clsx(
                          'font-medium',
                          isMaximized ? 'text-xs truncate' : 'text-sm'
                        )}
                      >
                        {name}
                      </div>
                      {!isMaximized && payload && (
                        <div className="text-xs text-gray-500 mt-1">
                          Type: {payload.type}
                        </div>
                      )}
                    </div>
                    {!isMaximized && (
                      <IconChevronRight
                        className={clsx(
                          'w-4 h-4 text-gray-400 transition-colors',
                          isSelected && 'text-blue-500'
                        )}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {currentData && currentPayload ? (
          <DeviceDataDetail
            name={currentData[0]}
            payload={currentPayload}
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized(!isMaximized)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              Select a data source to view details
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
DeviceData.displayName = 'DeviceData';

export const DeviceDataDetail: React.FC<{
  name: string;
  payload: {
    type: string;
    data: unknown;
  };
  isMaximized: boolean;
  onToggleMaximize: () => void;
}> = React.memo((props) => {
  const { name, payload, isMaximized, onToggleMaximize } = props;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{name}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {payload.type}
            </span>
            <ActionIcon
              color="gray"
              variant="subtle"
              onClick={onToggleMaximize}
              title={isMaximized ? 'Show sidebar' : 'Hide sidebar'}
            >
              {isMaximized ? <IconMaximizeOff /> : <IconMaximize />}
            </ActionIcon>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {payload.type === 'text' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {String(payload.data)}
                </pre>
              </div>
            )}

            {payload.type === 'list' &&
              (Array.isArray(payload.data) ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 mb-3">
                    {payload.data.length} item(s)
                  </div>
                  <AutoScrollContainer className="w-full max-h-96 overflow-auto">
                    {(payload.data as unknown[]).map(
                      (item: unknown, index: number) => (
                        <div
                          key={index}
                          className="odd:bg-neutral-100 hover:bg-neutral-200 transition-all px-4 py-3 rounded border-l-4 border-blue-200 mb-2"
                        >
                          <div className="text-xs text-gray-500 mb-1">
                            Item #{index + 1}
                          </div>
                          <DataRender data={item} />
                        </div>
                      )
                    )}
                  </AutoScrollContainer>
                </div>
              ) : (
                <JSONView data={payload.data} />
              ))}

            {payload.type === 'json' && (
              <div>
                <div className="text-sm text-gray-600 mb-3">JSON Data</div>
                <JSONView data={payload.data} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});
DeviceDataDetail.displayName = 'DeviceDataDetail';
