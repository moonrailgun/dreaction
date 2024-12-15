import React, { useMemo, useState } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { Command } from 'dreaction-server-core';
import { Accordion, Badge, SegmentedControl } from '@mantine/core';
import { JSONView } from './JsonView';
import { renderDeviceLogsDate } from '../utils/date';

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

    return commands;
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
