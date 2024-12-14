import { Blockquote, Code } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { getIp } from '../utils/ip';
import { port } from '../service/server';
import { useDReactionServerContext } from '../context/DReaction';

export const Home: React.FC = React.memo(() => {
  const [ip, setIp] = useState('');
  useEffect(() => {
    getIp().then((ip) => {
      setIp(ip);
    });
  }, []);

  const context = useDReactionServerContext();

  return (
    <div>
      <div>
        <Blockquote color="blue" mt="xl">
          Connect to{' '}
          <Code color="blue.9" c="white">
            {ip}:{port}
          </Code>{' '}
          to start debugging.
        </Blockquote>
      </div>

      <div>
        <pre>{JSON.stringify(context, null, 4)}</pre>
      </div>
    </div>
  );
});
Home.displayName = 'Home';
