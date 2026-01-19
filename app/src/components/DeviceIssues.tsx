import React, { useMemo } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { useDReactionServer } from '../context/DReaction/useDReactionServer';
import {
  ActionIcon,
  Badge,
  Card,
  Text,
  Stack,
  Group,
  Tooltip,
} from '@mantine/core';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { renderDeviceLogsDate } from '../utils/date';
import type { ReportIssuePayload } from 'dreaction-protocol';

interface IssueItem extends ReportIssuePayload {
  date: Date;
  count: number;
}

export const DeviceIssues: React.FC = React.memo(() => {
  const { selectedConnection } = useDReactionServerContext();
  const { clearSelectedConnectionIssues } = useDReactionServer();

  const issues: IssueItem[] = useMemo(() => {
    const commands = selectedConnection?.commands ?? [];
    const issueCommands = commands.filter(
      (command) => command.type === 'report.issue'
    );

    // Deduplicate by id, keeping the first occurrence and counting duplicates
    const issueMap = new Map<string, IssueItem>();
    for (const command of issueCommands) {
      const payload = command.payload as ReportIssuePayload;
      const existing = issueMap.get(payload.id);
      if (existing) {
        existing.count += 1;
      } else {
        issueMap.set(payload.id, {
          ...payload,
          date: command.date,
          count: 1,
        });
      }
    }

    return Array.from(issueMap.values());
  }, [selectedConnection?.commands]);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <IconAlertTriangle className="text-yellow-500" size={24} />
        <Text size="lg" fw={600} className="dark:text-gray-200">
          Issues ({issues.length})
        </Text>
        {issues.length > 0 && (
          <Tooltip label="Clear all issues">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={clearSelectedConnectionIssues}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        )}
      </div>

      {issues.length === 0 && (
        <div className="text-center opacity-60 dark:text-gray-600 py-8">
          <div>No issues reported yet.</div>
          <div className="text-sm mt-2">
            Call{' '}
            <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">
              dreaction.reportIssue(id, name?, description?)
            </code>{' '}
            to report an issue.
          </div>
        </div>
      )}

      <Stack gap="md">
        {issues.map((issue) => (
          <Card
            key={issue.id}
            shadow="sm"
            padding="md"
            radius="md"
            withBorder
            className="dark:bg-gray-900 dark:border-gray-800"
          >
            <Group justify="space-between" mb="xs">
              <Group gap="sm">
                {issue.name ? (
                  <Text fw={500} className="dark:text-gray-200">
                    {issue.name}
                  </Text>
                ) : (
                  <Badge color="yellow" variant="light">
                    {issue.id}
                  </Badge>
                )}
                {issue.count > 1 && (
                  <Badge color="gray" variant="outline">
                    x{issue.count}
                  </Badge>
                )}
              </Group>
              <Text size="xs" c="dimmed">
                {renderDeviceLogsDate(issue.date)}
              </Text>
            </Group>

            {issue.description && (
              <Text size="sm" c="dimmed" className="dark:text-gray-400">
                {issue.description}
              </Text>
            )}
          </Card>
        ))}
      </Stack>
    </div>
  );
});
DeviceIssues.displayName = 'DeviceIssues';
