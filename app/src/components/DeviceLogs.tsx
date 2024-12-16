import React, { useMemo, useState } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { Command } from 'dreaction-server-core';
import { Accordion, Badge, SegmentedControl, Tabs } from '@mantine/core';
import { JSONView } from './JSONView';
import { renderDeviceLogsDate } from '../utils/date';
import { CopyText } from './CopyText';
import { apiRequestToCurl } from '../utils/api';

export const DeviceLogs: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();
  const [filter, setFilter] = useState('all');

  const commands = useMemo(() => {
    const commands = selectedConnection?.commands ?? [];

    if (filter === 'logs') {
      return commands.filter((command) => command.type === 'log');
    }

    if (filter === 'network') {
      return commands.filter((command) => command.type === 'api.response');
    }

    return commands.filter(
      (commands) => !['dataWatch'].includes(commands.type)
    );
  }, [selectedConnection, filter]);

  return (
    <div>
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        data={[
          { label: 'All', value: 'all' },
          { label: 'Logs', value: 'logs' },
          { label: 'Network', value: 'network' },
        ]}
      />
      <Accordion multiple={true}>
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
  command: Command;
  tag?: React.ReactNode;
  title: React.ReactNode;
  body: React.ReactNode;
}> = React.memo((props) => {
  const { command, tag, title, body } = props;
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
  command: Command;
}> = React.memo((props) => {
  const command = props.command;

  if (command.type === 'log') {
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

  if (command.type === 'client.intro') {
    return (
      <ItemContainer
        command={command}
        tag={<Badge color="indigo">Connect</Badge>}
        title={command.payload.clientId}
        body={<JSONView data={command.payload} />}
      />
    );
  }

  if (command.type === 'api.response') {
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
              <JSONView data={command.payload.request.data} />
            </Tabs.Panel>

            <Tabs.Panel value="response">
              <JSONView data={command.payload.response} />
            </Tabs.Panel>
          </Tabs>
        }
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
