import { PropsWithChildren } from 'react';
import { IconArrowsRightLeft, IconHome2 } from '@tabler/icons-react';
import { Avatar, Center, Stack, Tooltip, UnstyledButton } from '@mantine/core';
import clsx from 'clsx';
import { DeviceSwitcher } from './DeviceSwitcher';
import { ActivePage, menu, useLayoutStore } from '../store/layout';

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

export function Layout(props: PropsWithChildren) {
  const { activePage } = useLayoutStore();

  const handleChangeTab = (key: ActivePage) => {
    useLayoutStore.setState({ activePage: key });
  };

  const links = menu.map((link) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={link.key === activePage}
      onClick={() => handleChangeTab(link.key)}
    />
  ));

  return (
    <div className="flex h-full w-full">
      <nav className="w-20 h-full p-md flex flex-col border-r border-gray-300 dark:border-gray-700 p-4">
        <Center>
          <Avatar src="/icon.svg" />
        </Center>

        <div className="flex-1 mt-[50px]">
          <Stack justify="center" gap={0}>
            {links}
          </Stack>
        </div>

        <DeviceSwitcher>
          <NavbarLink icon={IconArrowsRightLeft} label="Switcher" />
        </DeviceSwitcher>
      </nav>

      <div className="flex-1 h-full overflow-auto">{props.children}</div>
    </div>
  );
}
