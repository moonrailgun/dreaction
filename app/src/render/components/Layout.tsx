import { PropsWithChildren, useState } from 'react';
import {
  IconCalendarStats,
  IconDeviceDesktopAnalytics,
  IconFingerprint,
  IconGauge,
  IconHome2,
  IconSettings,
  IconUser,
} from '@tabler/icons-react';
import { Center, Stack, Tooltip, UnstyledButton } from '@mantine/core';
import { MantineLogo } from '@mantinex/mantine-logo';
import clsx from 'clsx';

interface NavbarLinkProps {
  icon: typeof IconHome2;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        onClick={onClick}
        className={clsx(
          'w-12 h-12 rounded-md flex items-center justify-center text-gray-700  hover:bg-gray-100',
          'dark:text-gray-200 dark:hover:bg-gray-600',
          active &&
            'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100'
        )}
      >
        <Icon size={20} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const mockdata = [
  { icon: IconHome2, label: 'Home' },
  { icon: IconGauge, label: 'Dashboard' },
  { icon: IconDeviceDesktopAnalytics, label: 'Analytics' },
  { icon: IconCalendarStats, label: 'Releases' },
  { icon: IconUser, label: 'Account' },
  { icon: IconFingerprint, label: 'Security' },
  { icon: IconSettings, label: 'Settings' },
];

export function Layout(props: PropsWithChildren) {
  const [active, setActive] = useState(0);

  const links = mockdata.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => setActive(index)}
    />
  ));

  return (
    <div className="flex h-full w-full">
      <nav className="w-20 h-full p-md flex flex-col border-r border-gray-300 dark:border-gray-700 p-4">
        <Center>
          <MantineLogo type="mark" size={30} />
        </Center>

        <div className="flex-1 mt-[50px]">
          <Stack justify="center" gap={0}>
            {links}
          </Stack>
        </div>
      </nav>

      <div className="flex-1">{props.children}</div>
    </div>
  );
}
