import { Tooltip } from '@mantine/core';
import { IconHelp } from '@tabler/icons-react';
import clsx from 'clsx';
import React from 'react';

export const TipIcon: React.FC<{
  text: React.ReactNode;
  className?: string;
}> = React.memo((props) => {
  return (
    <Tooltip label={props.text} multiline={true}>
      <IconHelp
        className={clsx(
          'inline-block opacity-60 hover:opacity-100 cursor-pointer',
          props.className
        )}
        size="1em"
      />
    </Tooltip>
  );
});
TipIcon.displayName = 'TipIcon';
