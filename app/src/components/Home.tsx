import { Blockquote, Code } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { getIp } from '../utils/ip';
import { port } from '../service/server';
import { useDReactionServerContext } from '../context/DReaction';
import { omit } from 'lodash-es';
import { getConnectionName, getIcon } from '../utils/connection';
import { JSONView } from './JSONView';

export const Home: React.FC = React.memo(() => {
  const [ip, setIp] = useState('');
  useEffect(() => {
    getIp().then((ip) => {
      setIp(ip);
    });
  }, []);

  const { selectedConnection } = useDReactionServerContext();

  return (
    <div className="h-full flex flex-col">
      <div>
        <Blockquote color="blue" mt="xl">
          Connect to{' '}
          <Code color="blue.9" c="white">
            {ip}:{port}
          </Code>{' '}
          to start debugging.
        </Blockquote>
      </div>

      {selectedConnection && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="pl-4 font-semibold opacity-60 flex items-center gap-2">
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
