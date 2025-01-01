import React, { useMemo, useState } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { Command } from 'dreaction-server-core';
import {
  Accordion,
  ActionIcon,
  Badge,
  Input,
  SegmentedControl,
  Tabs,
} from '@mantine/core';
import { JSONView } from './JSONView';
import { renderDeviceLogsDate } from '../utils/date';
import { CopyText } from './CopyText';
import { apiRequestToCurl } from '../utils/api';
import { IconTrash } from '@tabler/icons-react';
import { useDReactionServer } from '../context/DReaction/useDReactionServer';
import { repairSerialization } from '../utils/repairSerialization';
import { useDebounce } from 'ahooks';
import { CommandType, CommandTypeKey } from 'dreaction-protocol';
import { get } from 'lodash-es';

const blacklistType: CommandTypeKey[] = [
  CommandType.DataWatch,
  CommandType.CustomCommandRegister,
  CommandType.CustomCommandUnregister,
];

type DeviceLogsCommand = Command & {
  title: string;
};

export const DeviceLogs: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();
  const { clearSelectedConnectionCommands } = useDReactionServer();
  const [filterType, setFilterType] = useState('all');
  const [filterText, setFilterText] = useState('');

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

        if (command.type === 'log') {
          title = command.payload.message;
        }

        if (command.type === 'api.response') {
          title = command.payload.request.url;
        }

        if (command.type === 'asyncStorage.mutation') {
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
    } else if (filterType === 'asyncStorage') {
      filteredCommands = filteredCommands.filter(
        (command) => command.type === 'asyncStorage.mutation'
      );
    }

    return filteredCommands.filter((command) => {
      return command.title.includes(debouncedFilterText);
    });
  }, [selectedConnection, filterType, debouncedFilterText]);

  const handleClear = () => {
    clearSelectedConnectionCommands();
  };

  return (
    <div>
      <div className="flex items-center h-10">
        <SegmentedControl
          className="rounded-none border-b border-[#ced4da]"
          value={filterType}
          onChange={setFilterType}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Logs', value: 'logs' },
            { label: 'Network', value: 'network' },
            { label: 'Async Storage', value: 'asyncStorage' },
          ]}
        />

        <div className="flex-1 h-full">
          <Input
            className="w-full h-full"
            placeholder="Input somthing to filter logs"
            classNames={{
              input: 'h-full rounded-none border-r-0 border-l-0',
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
            root: 'w-10 h-10 rounded-none text-gray-500',
          }}
          onClick={handleClear}
        >
          <IconTrash />
        </ActionIcon>
      </div>

      <Accordion multiple={true}>
        {commands.length === 0 && (
          <div className="text-center opacity-60">No any logs yet.</div>
        )}

        {commands.map((command) => (
          <div key={command.messageId}>
            <Item command={command} />
          </div>
        ))}
      </Accordion>
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
      <Accordion.Control>
        <div className="flex gap-2 items-center">
          <ItemDate date={date} />
          {tag}
          <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
            {title}
          </div>
        </div>
      </Accordion.Control>
      <Accordion.Panel>
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
    <div className="text-xs text-gray-500">{renderDeviceLogsDate(date)}</div>
  );
});

const Item: React.FC<{
  command: DeviceLogsCommand;
}> = React.memo((props) => {
  const command = { ...props.command };
  command.payload = repairSerialization(command.payload);

  if (command.type === CommandType.Log) {
    let color = 'blue';
    if (command.payload.level === 'warn') {
      color = 'orange';
    } else if (command.payload.level === 'error') {
      color = 'red';
    }

    const message = command.payload.message;
    let body = <pre>{JSON.stringify(message, null, 4)}</pre>;
    if (typeof message === 'string') {
      body = <div className="text-neutral-600">{message}</div>;
    } else if (typeof message === 'number' || typeof message === 'boolean') {
      body = <div className="text-yellow-800">{message}</div>;
    } else if (typeof message === 'undefined' || message === null) {
      body = <div className="text-red-400">{message}</div>;
    } else if (typeof message === 'object') {
      body = <JSONView data={message} />;
    }

    return (
      <ItemContainer
        command={command}
        tag={<Badge color={color}>{command.payload.level}</Badge>}
        title={JSON.stringify(command.payload.message)}
        body={body}
      />
    );
  }

  if (command.type === CommandType.ClientIntro) {
    return (
      <ItemContainer
        command={command}
        tag={<Badge color="indigo">Connect</Badge>}
        title={command.payload.clientId ?? command.payload.name}
        body={<JSONView data={command.payload} hideRoot={true} />}
      />
    );
  }

  if (command.type === CommandType.ApiResponse) {
    return (
      <ItemContainer
        command={command}
        tag={<Badge color="violet">{command.payload.request.method}</Badge>}
        title={String(command.payload.request.url)}
        body={
          <Tabs defaultValue="summary">
            <Tabs.List className="items-center">
              <Tabs.Tab value="summary">Summary</Tabs.Tab>
              <Tabs.Tab value="request">Request</Tabs.Tab>
              <Tabs.Tab value="response">Response</Tabs.Tab>

              <div className="w-4" />
              <CopyText
                label="Copy as curl"
                value={apiRequestToCurl(command.payload)}
              />
            </Tabs.List>

            <Tabs.Panel value="summary">
              <div>
                <span className="opacity-60 text-xs mr-2">Url:</span>
                <span className="text-sm">{command.payload.request.url}</span>
              </div>
              <div>
                <span className="opacity-60 text-xs mr-2">Status Code:</span>
                <Badge>{command.payload.response.status}</Badge>
              </div>
              <div>
                <span className="opacity-60 text-xs mr-2">Method:</span>
                <Badge>{command.payload.request.method}</Badge>
              </div>
              <div>
                <span className="opacity-60 text-xs mr-2">Duration:</span>
                {Math.round(command.payload.duration)}
                <span className="text-gray-500 ml-1">ms</span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="opacity-60 text-xs">Request Header</span>

                <CopyText
                  value={JSON.stringify(
                    command.payload.request.headers || {},
                    null,
                    2
                  )}
                />
              </div>
              <JSONView
                data={command.payload.request.headers}
                hideRoot={true}
              />
              <div className="flex gap-1 items-center">
                <span className="opacity-60 text-xs">Response Header</span>
                <CopyText
                  value={JSON.stringify(
                    command.payload.response.headers || {},
                    null,
                    2
                  )}
                />
              </div>
              <JSONView
                data={command.payload.response.headers}
                hideRoot={true}
              />
            </Tabs.Panel>

            <Tabs.Panel value="request">
              <JSONView data={tryToParseJSON(command.payload.request.data)} />
            </Tabs.Panel>

            <Tabs.Panel value="response">
              <JSONView data={command.payload.response} />
            </Tabs.Panel>
          </Tabs>
        }
      />
    );
  }

  if (command.type === CommandType.AsyncStorageMutation) {
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
