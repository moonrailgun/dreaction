import os from 'os';
import path from 'path';
import fs from 'fs';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { useThemeStore } from '../store/theme';
import { Command } from 'dreaction-server-core';
import { GOLD_GRADIENT, GOLD_SHADOW } from '../constants/theme';
import {
  Accordion,
  ActionIcon,
  Badge,
  Input,
  SegmentedControl,
  Tooltip,
} from '@mantine/core';
import { JSONView } from './JSONView';
import { renderDeviceLogsDate } from '../utils/date';
import { NetworkRequestDetail } from './NetworkRequestDetail';
import {
  IconTrash,
  IconDownload,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useDReactionServer } from '../context/DReaction/useDReactionServer';
import { repairSerialization } from '../utils/repairSerialization';
import { useDebounce } from 'ahooks';
import { CommandTypeKey } from 'dreaction-protocol';
import { get } from 'lodash-es';
import { getPayloadSize } from '../utils/utils';
import {
  useVirtualizer,
  type Virtualizer as TanstackVirtualizer,
} from '@tanstack/react-virtual';

const LARGE_PAYLOAD_THRESHOLD = 500 * 1024; // 500 KiB
const SLOW_REQUEST_THRESHOLD = 5000; // 5000ms

const blacklistType: CommandTypeKey[] = [
  'dataWatch',
  'profiler.render',
  'profiler.fps',
  'report.issue',
  'customCommand.register',
  'customCommand.unregister',
  'customCommand.response',
];

type DeviceLogsCommand = Command & {
  title: string;
};

export const DeviceLogs: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();
  const { clearSelectedConnectionCommands } = useDReactionServer();
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const isDark = colorScheme === 'dark';
  const [filterType, setFilterType] = useState('all');
  const [filterText, setFilterText] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  const debouncedFilterText = useDebounce(filterText, {
    wait: 300,
    maxWait: 4000,
  });

  const commands: DeviceLogsCommand[] = useMemo(() => {
    const commands = selectedConnection?.commands ?? [];
    let filteredCommands: DeviceLogsCommand[] = commands
      .filter((command) => !blacklistType.includes(command.type))
      .map((command) => {
        let title = JSON.stringify(command.payload);

        if (command.type === 'log' && command.payload.message) {
          title = command.payload.message;
        }

        if (command.type === 'api.response' && command.payload.request.url) {
          title = command.payload.request.url;
        }

        if (
          command.type === 'asyncStorage.mutation' &&
          command.payload.action
        ) {
          title =
            command.payload.action + ': ' + get(command, 'payload.data.key');
        }

        return {
          ...command,
          title,
        };
      });

    if (filterType === 'logs') {
      filteredCommands = filteredCommands.filter(
        (command) => command.type === 'log'
      );
    } else if (filterType === 'network') {
      filteredCommands = filteredCommands.filter(
        (command) => command.type === 'api.response'
      );
    } else if (filterType === 'storage') {
      filteredCommands = filteredCommands.filter(
        (command) => command.type === 'asyncStorage.mutation'
      );
    }

    return filteredCommands.filter((command) => {
      return String(command.title).includes(debouncedFilterText);
    });
  }, [selectedConnection, filterType, debouncedFilterText]);

  const virtualizer = useVirtualizer({
    count: commands.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  const handleDowload = () => {
    const homeDir = os.homedir();
    const downloadDir = path.join(homeDir, 'Downloads');
    fs.writeFileSync(
      path.resolve(downloadDir, `dreaction-timeline-log-${Date.now()}.json`),
      JSON.stringify(commands || []),
      'utf8'
    );
    console.log(`Exported timeline log to ${downloadDir}`);
  };

  const handleClear = () => {
    clearSelectedConnectionCommands();
  };

  return (
    <div>
      <div className="flex items-center h-10 sticky top-0 z-10 bg-white dark:bg-[#0A0A0A]">
        <SegmentedControl
          className="rounded-none border-b border-[#ced4da] dark:border-gray-800"
          value={filterType}
          onChange={setFilterType}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Logs', value: 'logs' },
            { label: 'Network', value: 'network' },
            { label: 'Storage', value: 'storage' },
          ]}
          styles={
            isDark
              ? {
                  root: {
                    backgroundColor: '#0A0A0A',
                  },
                  indicator: {
                    background: GOLD_GRADIENT,
                    boxShadow: GOLD_SHADOW,
                  },
                }
              : undefined
          }
        />

        <div className="flex-1 h-full">
          <Input
            className="w-full h-full"
            placeholder="Input somthing to filter logs"
            classNames={{
              input:
                'h-full rounded-none border-r-0 border-l-0 dark:border-gray-800 dark:bg-[#0A0A0A]',
            }}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <ActionIcon
          color={'gray'}
          variant="default"
          size="md"
          classNames={{
            root: 'w-10 h-10 rounded-none text-gray-500 dark:text-gold-500 dark:hover:bg-gray-800',
          }}
          onClick={handleDowload}
        >
          <IconDownload />
        </ActionIcon>
        <ActionIcon
          color={'gray'}
          variant="default"
          size="md"
          classNames={{
            root: 'w-10 h-10 rounded-none text-gray-500 dark:text-gold-500 dark:hover:bg-gray-800',
          }}
          onClick={handleClear}
        >
          <IconTrash />
        </ActionIcon>
      </div>

      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: 'calc(100vh - 40px)' }}
      >
        {commands.length === 0 && (
          <div className="text-center opacity-60 dark:text-gray-600 py-4">
            No any logs yet.
          </div>
        )}

        {commands.length > 0 && (
          <Accordion multiple={true}>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const command = commands[virtualItem.index];
                return (
                  <VirtualRow
                    key={command.messageId}
                    virtualItem={virtualItem}
                    virtualizer={virtualizer}
                  >
                    <Item command={command} />
                  </VirtualRow>
                );
              })}
            </div>
          </Accordion>
        )}
      </div>
    </div>
  );
});
DeviceLogs.displayName = 'DeviceLogs';

const ItemContainer: React.FC<{
  command: DeviceLogsCommand;
  tag?: React.ReactNode;
  title?: React.ReactNode;
  body: React.ReactNode;
}> = React.memo((props) => {
  const { command, tag, title = command.title, body } = props;
  const { messageId, date } = command;

  return (
    <Accordion.Item key={messageId} value={String(messageId)}>
      <Accordion.Control className="dark:hover:bg-gray-900">
        <div className="flex gap-2 items-center">
          <ItemDate date={date} />
          {tag}
          <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis dark:text-gray-300">
            {title}
          </div>
        </div>
      </Accordion.Control>
      <Accordion.Panel className="dark:bg-gray-950">
        <div className="overflow-auto">{body}</div>
      </Accordion.Panel>
    </Accordion.Item>
  );
});
ItemContainer.displayName = 'ItemContainer';

const ItemDate: React.FC<{
  date: Date;
}> = React.memo((props) => {
  const { date } = props;

  return (
    <div className="text-xs text-gray-500 dark:text-gray-600">
      {renderDeviceLogsDate(date)}
    </div>
  );
});

const Item: React.FC<{
  command: DeviceLogsCommand;
}> = React.memo((props) => {
  const command = { ...props.command };
  command.payload = repairSerialization(command.payload);

  if (command.type === 'log') {
    let color = 'blue';
    if (command.payload.level === 'warn') {
      color = 'orange';
    } else if (command.payload.level === 'error') {
      color = 'red';
    }

    const tag = <Badge color={color}>{command.payload.level}</Badge>;

    const message = command.payload.message;
    let body = (
      <pre className="dark:text-gray-300">
        {JSON.stringify(message, null, 4)}
      </pre>
    );
    if (typeof message === 'string') {
      body = (
        <div className="text-neutral-600 dark:text-gray-300">{message}</div>
      );
    } else if (typeof message === 'number' || typeof message === 'boolean') {
      body = (
        <div className="text-yellow-800 dark:text-yellow-400">{message}</div>
      );
    } else if (typeof message === 'undefined' || message === null) {
      body = <div className="text-red-400 dark:text-red-500">{message}</div>;
    } else if (typeof message === 'object') {
      body = <JSONView data={message} />;
    }

    return (
      <ItemContainer
        command={command}
        tag={tag}
        title={JSON.stringify(command.payload.message)}
        body={body}
      />
    );
  }

  if (command.type === 'client.intro') {
    return (
      <ItemContainer
        command={command}
        tag={<Badge color="indigo">Connect</Badge>}
        title={command.payload.clientId ?? command.payload.name}
        body={<JSONView data={command.payload} hideRoot={true} />}
      />
    );
  }

  if (command.type === 'api.response') {
    const statusCode = command.payload.response.status;
    const statusColor =
      statusCode < 300
        ? 'green'
        : statusCode < 400
        ? 'blue'
        : statusCode < 500
        ? 'yellow'
        : 'red';
    const responseSize = getPayloadSize(command.payload.response.body);
    const isLargePayload = responseSize > LARGE_PAYLOAD_THRESHOLD;
    const isSlowRequest = command.payload.duration > SLOW_REQUEST_THRESHOLD;

    return (
      <ItemContainer
        command={command}
        tag={
          <div className="space-x-2 flex items-center">
            <Badge color="violet">{command.payload.request.method}</Badge>

            {statusColor !== 'green' && (
              <Badge color={statusColor}>{statusCode}</Badge>
            )}

            {isSlowRequest && (
              <Tooltip label="Slow request, may indicate API performance issues">
                <IconAlertTriangle size={16} className="text-orange-500" />
              </Tooltip>
            )}

            {isLargePayload && (
              <Tooltip label="Payload too large, may cause performance issues">
                <IconAlertTriangle size={16} className="text-yellow-500" />
              </Tooltip>
            )}
          </div>
        }
        title={String(command.payload.request.url)}
        body={
          <NetworkRequestDetail
            request={command.payload.request}
            response={command.payload.response}
            duration={command.payload.duration}
          />
        }
      />
    );
  }

  if (command.type === 'asyncStorage.mutation') {
    return (
      <ItemContainer
        command={command}
        tag={<Badge color="teal">AsyncStorage</Badge>}
        body={<JSONView data={command.payload.data} />}
      />
    );
  }

  return (
    <ItemContainer
      command={command}
      tag={<Badge color="gray">Unknown</Badge>}
      title={String(command.type)}
      body={<JSONView data={command} />}
    />
  );
});
Item.displayName = 'Item';

type VirtualizerInstance = TanstackVirtualizer<HTMLDivElement, Element>;
type VirtualItemInstance = ReturnType<
  VirtualizerInstance['getVirtualItems']
>[number];

const VirtualRow: React.FC<{
  virtualizer: VirtualizerInstance;
  virtualItem: VirtualItemInstance;
  children: React.ReactNode;
}> = React.memo((props) => {
  const { virtualizer, virtualItem, children } = props;
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = rowRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      virtualizer.measureElement(element);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [virtualizer, virtualItem.index]);

  return (
    <div
      data-index={virtualItem.index}
      ref={(element) => {
        rowRef.current = element;
        if (element) {
          virtualizer.measureElement(element);
        }
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${virtualItem.start}px)`,
      }}
    >
      {children}
    </div>
  );
});
VirtualRow.displayName = 'VirtualRow';
