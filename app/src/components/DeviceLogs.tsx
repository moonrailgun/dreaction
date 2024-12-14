import React from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { Command } from 'dreaction-server-core';
import { Accordion, Badge } from '@mantine/core';
import { JSONView } from './JsonView';

export const DeviceLogs: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();

  const commands = selectedConnection?.commands ?? [];

  return (
    <Accordion multiple={true}>
      {commands.map((command) => (
        <div key={command.messageId}>
          <Item command={command} />
        </div>
      ))}
    </Accordion>
  );
});
DeviceLogs.displayName = 'DeviceLogs';

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
      <Accordion.Item key={command.messageId} value={String(command.messageId)}>
        <Accordion.Control>
          <div className="flex gap-2 items-center">
            <div>{command.date.toISOString()}</div>

            <Badge color={color}>{command.payload.level}</Badge>

            <div className="flex-1 overflow-hidden">
              {JSON.stringify(command.payload.message)}
            </div>
          </div>
        </Accordion.Control>
        <Accordion.Panel>
          <div className="overflow-auto">{body}</div>
        </Accordion.Panel>
      </Accordion.Item>
    );
  }

  if (command.type === 'client.intro') {
    return (
      <Accordion.Item key={command.messageId} value={String(command.messageId)}>
        <Accordion.Control>
          <div className="flex gap-2 items-center">
            <div>{command.date.toISOString()}</div>

            <Badge color="indigo">Connect</Badge>

            <div className="flex-1 overflow-hidden">
              {command.payload.clientId}
            </div>
          </div>
        </Accordion.Control>
        <Accordion.Panel>
          <div className="overflow-auto">
            <JSONView data={command.payload} />
          </div>
        </Accordion.Panel>
      </Accordion.Item>
    );
  }

  return (
    <Accordion.Item key={command.messageId} value={String(command.messageId)}>
      <Accordion.Control>{String(command)}</Accordion.Control>
      <Accordion.Panel>
        <div>{JSON.stringify(command)}</div>
      </Accordion.Panel>
    </Accordion.Item>
  );
});
Item.displayName = 'Item';
