import React, { PropsWithChildren } from 'react';
import { Menu, rem, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useDReactionServerContext } from '../context/DReaction';
import { getConnectionName, getIcon } from '../utils/connection';

export const DeviceSwitcher: React.FC<PropsWithChildren> = React.memo(
  (props) => {
    const { connections, selectConnection, selectedConnection } =
      useDReactionServerContext();

    return (
      <Menu shadow="md" width={200} position="right-end">
        <Menu.Target>
          <div>{props.children}</div>
        </Menu.Target>

        <Menu.Dropdown className="dark:bg-[#1A1A1A] dark:border-gray-800">
          <Menu.Label className="dark:text-gold-400">Devices</Menu.Label>

          {connections.length === 0 && (
            <Menu.Item disabled={true}>
              <Text className="dark:text-gray-500">
                No any devices connected
              </Text>
            </Menu.Item>
          )}

          {connections.map((connection, index) => {
            const isSelected =
              connection.clientId === selectedConnection?.clientId;
            return (
              <Menu.Item
                key={index}
                className={
                  isSelected
                    ? 'dark:bg-gold-900/20 dark:text-gold-400 dark:hover:bg-gold-900/30'
                    : 'dark:text-gray-300 dark:hover:bg-gray-800'
                }
                leftSection={
                  <div className={isSelected ? 'text-gold-500' : ''}>
                    {React.createElement(getIcon(connection))}
                  </div>
                }
                rightSection={
                  isSelected && (
                    <IconCheck
                      style={{ width: rem(14), height: rem(14) }}
                      className="text-gold-500"
                    />
                  )
                }
                onClick={() => {
                  selectConnection(connection.clientId);
                }}
              >
                {getConnectionName(connection)}
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>
    );
  }
);
DeviceSwitcher.displayName = 'DeviceSwitcher';
