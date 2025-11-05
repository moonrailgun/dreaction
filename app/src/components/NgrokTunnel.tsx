import {
  Blockquote,
  Code,
  Button,
  TextInput,
  Loader,
  Alert,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import React from 'react';
import { config } from '../utils/config';
import { useNgrokStore } from '../store/ngrok';
import { CopyText } from './CopyText';
import {
  IconAlertCircle,
  IconPlugConnected,
  IconQuestionMark,
} from '@tabler/icons-react';

// Import Electron shell API for opening external links
// eslint-disable-next-line @typescript-eslint/no-var-requires
const electron = window.require ? window.require('electron') : null;

export const NgrokTunnel: React.FC = React.memo(() => {
  // Ngrok state and actions
  const {
    status: ngrokStatus,
    tunnelUrl,
    authtoken,
    domain,
    error: ngrokError,
    isLoading: ngrokLoading,
    setAuthtoken,
    setDomain,
    startTunnel,
    stopTunnel,
    clearError,
  } = useNgrokStore();

  const handleStartTunnel = async () => {
    await startTunnel(config.serverPort);
  };

  const handleStopTunnel = async () => {
    await stopTunnel();
  };

  const handleOpenWebsite = () => {
    // Use Electron's shell to open external browser
    if (electron?.shell) {
      electron.shell.openExternal('https://ngrok.com');
    } else {
      // Fallback to window.open if not in Electron environment
      window.open('https://ngrok.com', '_blank');
    }
  };

  return (
    <Blockquote
      color="blue"
      icon={<IconPlugConnected />}
      mt="md"
      className="border-l-4 ml-2 border-blue-400 dark:border-blue-600"
    >
      <div>
        {/* Header with expand/collapse button */}
        <Group justify="space-between" className="mb-2">
          <div className="font-semibold flex items-center gap-2">
            Ngrok HTTPS Tunnel
            <Tooltip label="Visit ngrok website" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="blue"
                onClick={handleOpenWebsite}
                className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <IconQuestionMark size={16} />
              </ActionIcon>
            </Tooltip>
            {ngrokStatus === 'connected' && (
              <Badge color="green" size="sm">
                Connected
              </Badge>
            )}
            {ngrokStatus === 'connecting' && (
              <Badge color="blue" size="sm">
                Connecting
              </Badge>
            )}
          </div>
        </Group>

        {/* Collapsible content */}
        <div className="mt-3">
          {/* Auth Token Input */}
          <TextInput
            label="Auth Token"
            placeholder="Enter your ngrok authtoken for custom features"
            value={authtoken}
            onChange={(e) => setAuthtoken(e.currentTarget.value)}
            disabled={ngrokStatus === 'connected' || ngrokLoading}
            className="mb-3"
            size="sm"
          />

          {/* Custom Domain Input */}
          <TextInput
            label="Custom Domain (Optional)"
            placeholder="e.g., your-app.ngrok.io or custom.domain.com"
            value={domain}
            onChange={(e) => setDomain(e.currentTarget.value)}
            disabled={ngrokStatus === 'connected' || ngrokLoading}
            className="mb-3"
            size="sm"
            description="Requires ngrok paid plan with reserved domain"
          />

          {/* Tunnel URL Display */}
          {tunnelUrl && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium mb-2">Public URL:</div>
              <div className="flex items-center gap-2 mb-3">
                <Code className="flex-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-mono text-sm text-nowrap">
                  {tunnelUrl}
                </Code>
                <CopyText value={tunnelUrl} label="Copy URL" />
              </div>

              {/* Connection hint */}
              <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Connection Config:
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      host:
                    </span>
                    <Code className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-mono text-xs">
                      {tunnelUrl.replace(/^https?:\/\//, '')}
                    </Code>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      port:
                    </span>
                    <Code className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-mono text-xs">
                      443
                    </Code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {ngrokError && (
            <Alert
              icon={<IconAlertCircle />}
              title="Error"
              color="red"
              className="mb-3"
              withCloseButton
              onClose={clearError}
            >
              {ngrokError}
            </Alert>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            {ngrokStatus !== 'connected' ? (
              <Button
                onClick={handleStartTunnel}
                disabled={ngrokLoading}
                leftSection={ngrokLoading ? <Loader size="xs" /> : null}
              >
                {ngrokLoading ? 'Starting...' : 'Start Tunnel'}
              </Button>
            ) : (
              <Button
                onClick={handleStopTunnel}
                color="red"
                disabled={ngrokLoading}
                leftSection={ngrokLoading ? <Loader size="xs" /> : null}
              >
                {ngrokLoading ? 'Stopping...' : 'Stop Tunnel'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Blockquote>
  );
});

NgrokTunnel.displayName = 'NgrokTunnel';
