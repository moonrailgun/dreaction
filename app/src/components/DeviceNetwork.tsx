import React, { useEffect, useMemo, useState } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { useDReactionServer } from '../context/DReaction/useDReactionServer';
import { useLayoutStore } from '../store/layout';
import { ActionIcon, Badge, Text, Tooltip } from '@mantine/core';
import {
  IconNetwork,
  IconTrash,
  IconAlertTriangle,
  IconX,
} from '@tabler/icons-react';
import { Waterfall, type WaterfallItem } from 'react-waterfall-timeline';
import 'react-waterfall-timeline/style.css';
import type {
  NetworkRequestPayload,
  NetworkResponsePayload,
} from 'dreaction-protocol';
import { getPayloadSize } from '../utils/utils';
import { repairSerialization } from '../utils/repairSerialization';
import { NetworkRequestDetail } from './NetworkRequestDetail';

const SLOW_REQUEST_THRESHOLD = 5000; // 5000ms
const LARGE_PAYLOAD_THRESHOLD = 500 * 1024; // 500 KiB

interface NetworkItem extends WaterfallItem {
  requestId: string;
  url: string;
  method: string;
  status?: number;
  duration?: number;
  request?: NetworkRequestPayload['request'];
  response?: NetworkResponsePayload['response'];
  requestDate?: Date;
  responseDate?: Date;
}

export const DeviceNetwork: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();
  const { clearSelectedConnectionCommands } = useDReactionServer();
  const activePage = useLayoutStore((state) => state.activePage);
  const [selectedItem, setSelectedItem] = useState<NetworkItem | null>(null);

  // Close sidebar on ESC key (only when network page is active)
  useEffect(() => {
    if (activePage !== 'network') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedItem) {
        setSelectedItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, activePage]);

  const { items } = useMemo(() => {
    const commands = selectedConnection?.commands ?? [];

    const requestCommands = commands.filter(
      (command) => command.type === 'api.request'
    );
    const responseCommands = commands.filter(
      (command) => command.type === 'api.response'
    );

    const networkMap = new Map<string, NetworkItem>();

    // Find the earliest timestamp for base time
    let baseTime = Infinity;
    for (const cmd of [...requestCommands, ...responseCommands]) {
      const time = new Date(cmd.date).getTime();
      if (time < baseTime) {
        baseTime = time;
      }
    }

    if (baseTime === Infinity) {
      baseTime = Date.now();
    }

    // Process request events
    for (const command of requestCommands) {
      const payload = repairSerialization(
        command.payload as NetworkRequestPayload
      );
      const { requestId, request } = payload;
      if (!requestId) continue;

      const requestTime = new Date(command.date).getTime();

      networkMap.set(requestId, {
        id: requestId,
        requestId,
        name: request.url,
        url: request.url,
        method: request.method,
        startTime: requestTime - baseTime,
        request,
        requestDate: command.date,
        color: '#3b82f6', // blue for pending
      });
    }

    // Process response events and pair with requests
    for (const command of responseCommands) {
      const payload = repairSerialization(
        command.payload as NetworkResponsePayload
      );
      const { requestId, request, response, duration } = payload;
      const responseTime = new Date(command.date).getTime();

      // Generate a fallback ID for legacy events without requestId
      const id = requestId || `legacy-${command.messageId}`;

      const existing = requestId ? networkMap.get(requestId) : undefined;
      if (existing) {
        // Update existing item with response info
        const statusCode = response.status;
        let color = '#22c55e'; // green
        if (statusCode >= 400 && statusCode < 500) {
          color = '#eab308'; // yellow
        } else if (statusCode >= 500) {
          color = '#ef4444'; // red
        } else if (statusCode >= 300 && statusCode < 400) {
          color = '#3b82f6'; // blue
        }

        existing.endTime = responseTime - baseTime;
        existing.status = statusCode;
        existing.duration = duration;
        existing.response = response;
        existing.responseDate = command.date;
        existing.color = color;
      } else {
        // No matching request found, create a new item
        const statusCode = response.status;
        let color = '#22c55e';
        if (statusCode >= 400 && statusCode < 500) {
          color = '#eab308';
        } else if (statusCode >= 500) {
          color = '#ef4444';
        } else if (statusCode >= 300 && statusCode < 400) {
          color = '#3b82f6';
        }

        networkMap.set(id, {
          id,
          requestId: id,
          name: request.url,
          url: request.url,
          method: request.method,
          startTime: duration ? responseTime - duration - baseTime : undefined,
          endTime: responseTime - baseTime,
          status: statusCode,
          duration,
          request,
          response,
          responseDate: command.date,
          color,
        });
      }
    }

    const items = Array.from(networkMap.values()).sort((a, b) => {
      const aTime = a.startTime ?? a.endTime ?? 0;
      const bTime = b.startTime ?? b.endTime ?? 0;
      return aTime - bTime;
    });

    return { items, baseTime };
  }, [selectedConnection?.commands]);

  const handleClear = () => {
    clearSelectedConnectionCommands();
  };

  const handleItemClick = (item: WaterfallItem) => {
    const networkItem = items.find((i) => i.id === item.id);
    if (networkItem) {
      setSelectedItem(networkItem);
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center h-10 sticky top-0 z-10 bg-white dark:bg-[#0A0A0A] border-b border-gray-300 dark:border-gray-800 px-4">
          <div className="flex items-center gap-2 flex-1">
            <IconNetwork className="text-blue-500" size={20} />
            <Text size="sm" fw={600} className="dark:text-gray-200">
              Network ({items.length})
            </Text>
          </div>

          <ActionIcon
            color="gray"
            variant="subtle"
            size="md"
            onClick={handleClear}
            className="dark:text-gold-500 dark:hover:bg-gray-800"
          >
            <IconTrash size={18} />
          </ActionIcon>
        </div>

        <div className="flex-1 overflow-hidden">
          {items.length === 0 ? (
            <div className="text-center opacity-60 dark:text-gray-600 py-8">
              <div>No network requests yet.</div>
              <div className="text-sm mt-2">
                Network requests will appear here when detected.
              </div>
            </div>
          ) : (
            <div className="h-full box-border overflow-hidden">
              <Waterfall
                items={items}
                onLabelClick={handleItemClick}
                labelWidth={300}
                rowHeight={36}
                renderTooltip={(item) => {
                  const networkItem = items.find((i) => i.id === item.id);
                  if (!networkItem) return null;

                  return (
                    <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 max-w-md">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {networkItem.name}
                      </div>
                      <div className="flex gap-2 mt-1 text-xs">
                        <Badge size="xs" color="violet">
                          {networkItem.method}
                        </Badge>
                        {networkItem.status && (
                          <Badge
                            size="xs"
                            color={
                              networkItem.status < 300
                                ? 'green'
                                : networkItem.status < 400
                                ? 'blue'
                                : networkItem.status < 500
                                ? 'yellow'
                                : 'red'
                            }
                          >
                            {networkItem.status}
                          </Badge>
                        )}
                        {networkItem.duration !== undefined && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {Math.round(networkItem.duration)}ms
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {selectedItem && (
        <div className="w-[450px] h-full border-l border-gray-300 dark:border-gray-800 bg-white dark:bg-[#0A0A0A] flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-300 dark:border-gray-800 shrink-0">
            <Badge color="violet">{selectedItem.method}</Badge>
            {selectedItem.status && (
              <Badge
                color={
                  selectedItem.status < 300
                    ? 'green'
                    : selectedItem.status < 400
                    ? 'blue'
                    : selectedItem.status < 500
                    ? 'yellow'
                    : 'red'
                }
              >
                {selectedItem.status}
              </Badge>
            )}
            {selectedItem.duration !== undefined &&
              selectedItem.duration > SLOW_REQUEST_THRESHOLD && (
                <Tooltip label="Slow request">
                  <IconAlertTriangle size={16} className="text-orange-500" />
                </Tooltip>
              )}
            {selectedItem.response &&
              getPayloadSize(selectedItem.response.body) >
                LARGE_PAYLOAD_THRESHOLD && (
                <Tooltip label="Large payload">
                  <IconAlertTriangle size={16} className="text-yellow-500" />
                </Tooltip>
              )}
            <div className="flex-1" />
            <ActionIcon
              color="gray"
              variant="subtle"
              size="sm"
              onClick={() => setSelectedItem(null)}
              className="dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <IconX size={16} />
            </ActionIcon>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-auto p-4">
            {selectedItem.request && (
              <NetworkRequestDetail
                request={selectedItem.request}
                response={selectedItem.response}
                duration={selectedItem.duration}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
});
DeviceNetwork.displayName = 'DeviceNetwork';
