import React, { PropsWithChildren } from 'react';
import { Button, Menu, rem, Text } from '@mantine/core';
import {
  IconArrowsLeftRight,
  IconCheck,
  IconMessageCircle,
  IconPhoto,
  IconSearch,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react';
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

        <Menu.Dropdown>
          <Menu.Label>Devices</Menu.Label>

          {connections.length === 0 && (
            <Menu.Item disabled={true}>
              <Text>No any devices connected</Text>
            </Menu.Item>
          )}

          {connections.map((connection, index) => (
            <Menu.Item
              key={index}
              leftSection={
                <div>{React.createElement(getIcon(connection))}</div>
              }
              rightSection={
                connection.clientId === selectedConnection?.clientId && (
                  <IconCheck style={{ width: rem(14), height: rem(14) }} />
                )
              }
              onClick={() => {
                selectConnection(connection.clientId);
              }}
            >
              {getConnectionName(connection)}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  }
);
DeviceSwitcher.displayName = 'DeviceSwitcher';
