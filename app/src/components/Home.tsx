import { Blockquote, Code } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { getIp } from '../utils/ip';
import { useDReactionServerContext } from '../context/DReaction';
import { omit, upperFirst } from 'lodash-es';
import { getConnectionName, getIcon } from '../utils/connection';
import { JSONView } from './JSONView';
import { config } from '../utils/config';

export const Home: React.FC = React.memo(() => {
  const [ip, setIp] = useState('');
  useEffect(() => {
    getIp().then((ip) => {
      setIp(ip);
    });
  }, []);

  const { serverStatus, connections, selectedConnection } =
    useDReactionServerContext();

  return (
    <div className="h-full flex flex-col p-4">
      <div>
        <Blockquote
          color="gold"
          mt="xl"
          className="border-l-4 border-gold-400 dark:border-gold-600"
        >
          <div className="mb-2">
            Connect to{' '}
            <Code className="bg-gold-800 text-gold-50 px-2 py-1 rounded font-mono">
              {ip}:{config.serverPort}
            </Code>{' '}
            to start debugging.
          </div>
          <div className="mb-2">
            Server Status:{' '}
            <span className="font-bold text-gold-600 dark:text-gold-400">
              {upperFirst(serverStatus)}
            </span>
          </div>
          <div>
            Connections:{' '}
            <span className="font-bold text-gold-600 dark:text-gold-400">
              {connections.length}
            </span>
          </div>
        </Blockquote>
      </div>

      {selectedConnection && (
        <div className="flex flex-col flex-1 overflow-hidden mt-4">
          <div className="pl-4 font-semibold text-gold-700 dark:text-gold-400 flex items-center gap-2 mb-2">
            Current Connnection:
            {React.createElement(getIcon(selectedConnection))}
            {getConnectionName(selectedConnection)}
          </div>

          <div className="flex-1 overflow-auto">
            <JSONView
              data={omit(selectedConnection, ['commands'])}
              hideRoot={true}
            />
          </div>
        </div>
      )}
    </div>
  );
});
Home.displayName = 'Home';
