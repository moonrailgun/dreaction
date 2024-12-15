import { ActionIcon, CopyButton, rem, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import React from 'react';

interface CopyTextProps {
  label?: string;
  value: string;
}
export const CopyText: React.FC<CopyTextProps> = React.memo((props) => {
  const { label = 'Copy', value } = props;

  return (
    <CopyButton value={value} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : label} withArrow position="right">
          <ActionIcon
            color={copied ? 'teal' : 'gray'}
            variant="subtle"
            onClick={copy}
          >
            {copied ? (
              <IconCheck style={{ width: rem(16) }} />
            ) : (
              <IconCopy style={{ width: rem(16) }} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
});
CopyText.displayName = 'CopyText';
