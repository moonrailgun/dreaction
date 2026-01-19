import { PropsWithChildren, useMemo } from 'react';
import {
  IconArrowsRightLeft,
  IconHome2,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import {
  Avatar,
  Center,
  Indicator,
  Stack,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import clsx from 'clsx';
import { DeviceSwitcher } from './DeviceSwitcher';
import { ActivePage, useLayoutStore } from '../store/layout';
import { useThemeStore } from '../store/theme';
import { menu } from '../utils/menu';
import { GOLD_GRADIENT } from '../constants/theme';
import logoUrl from '../assets/icon.svg';
import { useDReactionServerContext } from '../context/DReaction';
import type { ReportIssuePayload } from 'dreaction-protocol';

interface NavbarLinkProps {
  icon: typeof IconHome2;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

function NavbarLink({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
  isDark,
}: NavbarLinkProps & { isDark?: boolean }) {
  const button = (
    <UnstyledButton
      onClick={onClick}
      className={clsx(
        'w-12 h-12 rounded-md flex items-center justify-center transition-all',
        'text-gray-700 hover:bg-gray-100',
        'dark:text-gray-400 dark:hover:bg-gray-800',
        active && !isDark && 'bg-blue-100 text-blue-700',
        active && isDark && '!text-gray-900 shadow-lg shadow-gold/50'
      )}
      style={
        active && isDark
          ? {
              background: GOLD_GRADIENT,
            }
          : undefined
      }
    >
      <Icon size={20} stroke={1.5} />
    </UnstyledButton>
  );

  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      {badge && badge > 0 ? (
        <Indicator
          label={badge > 99 ? '99+' : badge}
          size={12}
          offset={6}
          color="yellow"
          className="text-[9px]"
        >
          {button}
        </Indicator>
      ) : (
        button
      )}
    </Tooltip>
  );
}

export function Layout(props: PropsWithChildren) {
  const { activePage } = useLayoutStore();
  const { colorScheme, toggleColorScheme } = useThemeStore();
  const { selectedConnection } = useDReactionServerContext();
  const isDark = colorScheme === 'dark';

  const issueCount = useMemo(() => {
    const commands = selectedConnection?.commands ?? [];
    const issueCommands = commands.filter(
      (command) => command.type === 'report.issue'
    );
    const uniqueIds = new Set(
      issueCommands.map((cmd) => (cmd.payload as ReportIssuePayload).id)
    );
    return uniqueIds.size;
  }, [selectedConnection?.commands]);

  const handleChangeTab = (key: ActivePage) => {
    useLayoutStore.setState({ activePage: key });
  };

  const links = menu.map((link) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={link.key === activePage}
      badge={link.key === 'issues' ? issueCount : undefined}
      onClick={() => handleChangeTab(link.key)}
      isDark={isDark}
    />
  ));

  return (
    <div className="flex h-full w-full">
      <nav className="w-20 h-full p-md flex flex-col border-r border-gray-300 dark:border-gray-800 p-4 bg-white dark:bg-[#0A0A0A]">
        <Center>
          <Avatar radius="md" src={logoUrl} />
        </Center>

        <div className="flex-1 mt-[50px]">
          <Stack justify="center" gap={0}>
            {links}
          </Stack>
        </div>

        <Stack gap="xs">
          <Tooltip
            label={colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            position="right"
            transitionProps={{ duration: 0 }}
          >
            <UnstyledButton
              onClick={toggleColorScheme}
              className={clsx(
                'w-12 h-12 rounded-md flex items-center justify-center transition-all',
                'text-gray-700 hover:bg-gray-100',
                'dark:text-gold-400 dark:hover:bg-gray-800'
              )}
            >
              {colorScheme === 'dark' ? (
                <IconSun size={20} stroke={1.5} />
              ) : (
                <IconMoon size={20} stroke={1.5} />
              )}
            </UnstyledButton>
          </Tooltip>

          <DeviceSwitcher>
            <NavbarLink
              icon={IconArrowsRightLeft}
              label="Switcher"
              isDark={isDark}
            />
          </DeviceSwitcher>
        </Stack>
      </nav>

      <div className="flex-1 h-full overflow-auto bg-white dark:bg-[#0A0A0A]">
        {props.children}
      </div>
    </div>
  );
}
