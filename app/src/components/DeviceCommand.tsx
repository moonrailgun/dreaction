import React, { useMemo, useState } from 'react';
import {
  useDReactionServerContext,
  useLatestSelectedConnectionCommmand,
} from '../context/DReaction';
import { entries, get, groupBy, last } from 'lodash-es';
import {
  ActionIcon,
  ScrollArea,
  TextInput,
  Button,
  Select,
} from '@mantine/core';
import { repairSerialization } from '../utils/repairSerialization';
import clsx from 'clsx';
import { IconSend, IconChevronRight } from '@tabler/icons-react';
import { CustomCommandRegisterPayload } from 'dreaction-protocol';
import { useForm } from '@mantine/form';
import { Markdown } from './Markdown';
import { DataRender } from './DataRender';

export const DeviceCommand: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);

  const commandList = useMemo(() => {
    const list = [...(selectedConnection?.commands ?? [])]
      .filter(
        (command) =>
          command.type === 'customCommand.register' ||
          command.type === 'customCommand.unregister'
      )
      .reverse();

    return entries(groupBy(list, (item) => item.payload.command));
  }, [selectedConnection?.commands]);

  const availableCommands = useMemo(() => {
    return commandList
      .map(([, list]) => {
        const command = repairSerialization(last(list));
        if (!command || command.type === 'customCommand.unregister') {
          return null;
        }
        return command;
      })
      .filter(Boolean);
  }, [commandList]);

  React.useEffect(() => {
    if (
      availableCommands.length > 0 &&
      !selectedCommand &&
      availableCommands[0]
    ) {
      setSelectedCommand(availableCommands[0].payload.command);
    }
  }, [availableCommands, selectedCommand]);

  const currentCommand = availableCommands.find(
    (cmd) => cmd?.payload.command === selectedCommand
  );

  if (commandList.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-600">
          No any command has been register
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold dark:text-gold-400">Commands</h3>
          <p className="text-sm text-gray-500 dark:text-gray-600">
            {availableCommands.length} command(s) available
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {availableCommands.map((command) => {
              if (!command) return null;

              const payload = command.payload;
              const isSelected = selectedCommand === payload.command;

              return (
                <div
                  key={command.messageId}
                  className={clsx(
                    'p-3 rounded-lg mb-2 cursor-pointer transition-all',
                    'border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800',
                    isSelected && [
                      'bg-gradient-to-br from-gold-400/20 to-gold-800/20',
                      'border-gold-600 dark:border-gold-700',
                      'shadow-md shadow-gold/20',
                    ]
                  )}
                  onClick={() => setSelectedCommand(payload.command)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div
                        className={clsx(
                          'font-medium text-sm',
                          isSelected && 'text-gold-700 dark:text-gold-400'
                        )}
                      >
                        {payload.title ?? payload.command}
                      </div>
                      {payload.description && (
                        <div
                          className={clsx(
                            'text-xs mt-1 line-clamp-2',
                            isSelected
                              ? 'text-gold-600 dark:text-gold-500'
                              : 'text-gray-500 dark:text-gray-600'
                          )}
                        >
                          {payload.description}
                        </div>
                      )}
                    </div>
                    <IconChevronRight
                      className={clsx(
                        'w-4 h-4 transition-colors',
                        isSelected
                          ? 'text-gold-600 dark:text-gold-500'
                          : 'text-gray-400 dark:text-gray-600'
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentCommand ? (
          <DeviceCommandDetail payload={currentCommand.payload} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              Select a command to view details
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
DeviceCommand.displayName = 'DeviceCommand';

export const DeviceCommandDetail: React.FC<{
  payload: CustomCommandRegisterPayload;
}> = React.memo((props) => {
  const payload = props.payload;
  const { sendCommand } = useDReactionServerContext();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {},
  });
  const response = useLatestSelectedConnectionCommmand(
    'customCommand.response',
    (p) => p.command === payload.command
  );

  const handleSubmit = () => {
    sendCommand('custom', {
      command: payload.command,
      args: {
        ...form.getValues(),
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold dark:text-gold-400">
            {payload.title ?? payload.command}
          </h2>
          <Button
            leftSection={<IconSend size={16} />}
            onClick={handleSubmit}
            size="sm"
          >
            Execute
          </Button>
        </div>

        {payload.description && (
          <Markdown
            className="text-sm text-gray-600 dark:text-gray-500"
            raw={payload.description}
          />
        )}
      </div>

      {payload.args && payload.args.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium mb-3 dark:text-gold-400">
            Parameters
          </h3>
          <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-3">
            {payload.args.map(({ name, type, options }) => {
              if (type === 'string') {
                if (options) {
                  return (
                    <Select
                      {...form.getInputProps(name)}
                      key={form.key(name)}
                      placeholder={`Select ${name}`}
                      label={name}
                      size="sm"
                      searchable
                      clearable
                      data={options.map((option) => ({
                        label:
                          typeof option === 'string' ? option : option.label,
                        value:
                          typeof option === 'string' ? option : option.value,
                      }))}
                    />
                  );
                }

                return (
                  <TextInput
                    {...form.getInputProps(name)}
                    key={form.key(name)}
                    placeholder={`Enter ${name}`}
                    label={name}
                    size="sm"
                  />
                );
              }
              return null;
            })}
          </form>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium dark:text-gold-400">Response</h3>
        </div>

        <div className="flex-1 overflow-hidden">
          {response ? (
            <ScrollArea className="h-full">
              <div className="p-4">
                <DataRender
                  data={get(response.payload, 'payload')}
                  useTableMode={payload.responseViewType === 'table'}
                />
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-600">
                <p>No response yet</p>
                <p className="text-sm mt-1">
                  Execute the command to see results
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
DeviceCommandDetail.displayName = 'DeviceCommandDetail';

export const DeviceCommandCard: React.FC<{
  payload: CustomCommandRegisterPayload;
}> = React.memo((props) => {
  const payload = props.payload;
  const { sendCommand } = useDReactionServerContext();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {},
  });
  const response = useLatestSelectedConnectionCommmand(
    'customCommand.response',
    (p) => p.command === payload.command
  );

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

      {payload.description && (
        <Markdown className="text-xs opacity-60" raw={payload.description} />
      )}

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

      {response && (
        <DataRender
          data={get(response.payload, 'payload')}
          useTableMode={payload.responseViewType === 'table'}
        />
      )}
    </form>
  );
});
DeviceCommandCard.displayName = 'DeviceCommandCard';
