import { Blockquote, Code } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { getIp } from '../utils/ip';
import { useDReactionServerContext } from '../context/DReaction';
import { omit, upperFirst } from 'lodash-es';
import { getConnectionName, getIcon } from '../utils/connection';
import { JSONView } from './JSONView';
import { config } from '../utils/config';
import { NgrokTunnel } from './NgrokTunnel';
import { IconPlugConnected, IconX } from '@tabler/icons-react';

export const Home: React.FC = React.memo(() => {
  const [ip, setIp] = useState('');
  const [isNgrokPanelOpen, setIsNgrokPanelOpen] = useState(false);

  useEffect(() => {
    getIp().then((ip) => {
      setIp(ip);
    });
  }, []);

  const { serverStatus, connections, selectedConnection } =
    useDReactionServerContext();

  return (
    <div className="h-full flex">
      {/* Left side: Main content area */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* DReaction Server Status */}
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

        {/* Connection details */}
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

      {/* Right side: Collapsible Ngrok panel */}
      <div className="relative">
        {/* Toggle button */}
        {!isNgrokPanelOpen && (
          <button
            onClick={() => setIsNgrokPanelOpen(true)}
            className="absolute right-0 top-4 bg-gold-600 hover:bg-gold-700 text-white px-3 py-2 rounded-l-lg shadow-lg transition-all duration-200 z-10"
            title="Open Ngrok Tunnel"
          >
            <IconPlugConnected />
          </button>
        )}

        {/* Ngrok panel */}
        <div
          className={`h-full transition-all duration-300 ease-in-out ${
            isNgrokPanelOpen ? 'w-96' : 'w-0'
          } overflow-hidden`}
        >
          <div className="h-full w-96 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 pt-8 flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setIsNgrokPanelOpen(false)}
              className="absolute top-6 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Close Ngrok Tunnel"
            >
              <IconX />
            </button>

            <NgrokTunnel />
          </div>
        </div>
      </div>
    </div>
  );
});
Home.displayName = 'Home';
