import React, { useMemo } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { entries, groupBy, last } from 'lodash-es';
import { ActionIcon, TextInput } from '@mantine/core';
import { repairSerialization } from '../utils/repairSerialization';
import clsx from 'clsx';
import { IconSend } from '@tabler/icons-react';
import { CustomCommandPayload } from 'dreaction-protocol';
import { useForm } from '@mantine/form';

export const DeviceCommand: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();

  const commandList = useMemo(() => {
    const list = selectedConnection?.commands
      .filter(
        (command) =>
          command.type === 'customCommand.register' ||
          command.type === 'customCommand.unregister'
      )
      .reverse();

    return entries(groupBy(list, (item) => item.payload.command));

    // return entries(groupBy(list, (item) => item.payload.name));
  }, [selectedConnection?.commands]);

  return (
    <div className="h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-2 gap-2">
      {commandList.length === 0 && <div>No any command has been register</div>}

      <div>
        {commandList.map(([, list]) => {
          const command = repairSerialization(last(list));

          if (!command || command.type === 'customCommand.unregister') {
            return null;
          }

          const payload = command.payload;

          return <DeviceCommandCard payload={payload} />;
        })}
      </div>
    </div>
  );
});
DeviceCommand.displayName = 'DeviceCommand';

export const DeviceCommandCard: React.FC<{ payload: CustomCommandPayload }> =
  React.memo((props) => {
    const payload = props.payload;
    const { sendCommand } = useDReactionServerContext();
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {},
    });

    const handleSubmit = () => {
      sendCommand('custom', {
        command: payload.command,
        args: {
          ...form.getValues(),
        },
      });
    };

    return (
      <form
        className={clsx(
          'p-2 rounded-lg border border-black border-opacity-20 overflow-auto flex flex-col gap-1'
        )}
        onSubmit={form.onSubmit(handleSubmit)}
      >
        <div className="text-lg font-semibold flex">
          <div className="flex-1">{payload.title ?? payload.command}</div>

          <ActionIcon color="gray" variant="subtle" type="submit">
            <IconSend />
          </ActionIcon>
        </div>

        <div className="text-xs opacity-60">{payload.description}</div>

        <div>
          {payload.args &&
            payload.args.map(({ name, type }) => {
              if (type === 'string') {
                return (
                  <TextInput
                    {...form.getInputProps(name)}
                    key={form.key(name)}
                    placeholder={name}
                    label={name}
                  />
                );
              }
            })}
        </div>
      </form>
    );
  });
DeviceCommandCard.displayName = 'DeviceCommandCard';
