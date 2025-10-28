import React, { useMemo, useState } from 'react';
import { useSelectedConnectionCommmands } from '../context/DReaction';
import { groupBy, orderBy, takeRight } from 'lodash-es';
import {
  Accordion,
  Code,
  ScrollArea,
  Timeline,
  Text,
  Tooltip,
  Divider,
  Button,
  Slider,
} from '@mantine/core';
import {
  IconLoader2,
  IconLoader3,
  IconPlayerPause,
  IconPlayerPlay,
  IconSquareRoundedPlus,
} from '@tabler/icons-react';
import { CommandInferType, ProfilerRenderPayload } from 'dreaction-protocol';
import { TipIcon } from './TipIcon';
import { LineChart } from '@mantine/charts';
import dayjs from 'dayjs';

export const DevicePerformance: React.FC = React.memo(() => {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1">
        <DevicePerformanceFPS />
      </div>
      <Divider orientation="vertical" />
      <div className="flex-1">
        <DevicePerformanceRender />
      </div>
    </div>
  );
});
DevicePerformance.displayName = 'DevicePerformance';

const DevicePerformanceFPS: React.FC = React.memo(() => {
  const commands = useSelectedConnectionCommmands(['profiler.fps']);
  const [lock, setLock] = useState<{ date: string; fps: number }[] | null>(
    null
  );
  const [range, setRange] = useState(20);

  const data = takeRight(
    commands
      .map((c: CommandInferType<'profiler.fps'>) => ({
        date: dayjs(c.date).format('mm:ss'),
        fps: c.payload?.fps ?? 0,
      }))
      .reverse(),
    range
  );

  return (
    <ScrollArea className="h-full">
      {commands.length === 0 && (
        <div className="w-full py-10 text-center">
          Please call{' '}
          <Code className="bg-gold-800 text-gold-50 px-2 py-1 rounded font-mono">
            watchFPS()
          </Code>{' '}
          to start meter application performance
        </div>
      )}

      {commands.length > 0 && (
        <div className="py-10 px-2">
          <h2 className="text-lg text-center font-bold mb-2 dark:text-gold-400">
            FPS Meter
          </h2>
          <p className="mb-4 text-center text-sm opacity-60 dark:text-gray-500">
            This is base on `requestAnimationFrame` to meter fps in js thread.
          </p>

          <LineChart
            h={300}
            data={lock ?? data}
            dataKey="date"
            series={[{ name: 'fps', color: 'gold.6', label: 'FPS' }]}
            xAxisProps={{ padding: { left: 10, right: 10 } }}
            curveType="monotone"
            referenceLines={[{ y: 30, label: '30fps', color: 'orange.6' }]}
          />

          <div className="pt-6 flex gap-4 items-center justify-between pl-6">
            <div>
              <div className="text-xs">Range</div>
              <Slider
                className="w-[200px]"
                value={range}
                onChange={setRange}
                restrictToMarks={true}
                min={10}
                marks={[10, 20, 30, 50, 100].map((n) => ({ value: n }))}
              />
            </div>

            {lock === null ? (
              <Button
                variant="filled"
                leftSection={<IconPlayerPause size={14} />}
                onClick={() => {
                  setLock([...data]);
                }}
              >
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                leftSection={<IconPlayerPlay size={14} />}
                onClick={() => {
                  setLock(null);
                }}
              >
                Resume
              </Button>
            )}
          </div>
        </div>
      )}
    </ScrollArea>
  );
});
DevicePerformanceFPS.displayName = 'DevicePerformanceFPS';

const DevicePerformanceRender: React.FC = React.memo(() => {
  const commands = useSelectedConnectionCommmands(['profiler.render'], true);

  const groups = useMemo(
    () => groupBy(orderBy(commands, 'startTime', 'desc'), 'id'),
    [commands]
  );

  return (
    <ScrollArea className="h-full">
      {commands.length === 0 && (
        <div className="w-full py-10 text-center">
          Please use{' '}
          <Code className="bg-gold-800 text-gold-50 px-2 py-1 rounded font-mono">
            DReactionProfiler
          </Code>{' '}
          to send performance info
        </div>
      )}

      {commands.length > 0 && (
        <div className="py-10">
          <h2 className="text-lg text-center font-bold mb-2 dark:text-gold-400">
            Render Profiler
          </h2>
          <p className="mb-4 text-center text-sm opacity-60 dark:text-gray-500">
            This is base on `Profiler` feature in React which can get detail
            info in react render process.
          </p>

          <Accordion multiple={true}>
            {Object.entries(groups).map(([id, list]) => {
              return (
                <Accordion.Item key={id} value={String(id)}>
                  <Accordion.Control>
                    <span className="font-bold mr-1">{id}</span>
                    <span className="text-xs">({list.length})</span>
                  </Accordion.Control>
                  <Accordion.Panel className="flex-1">
                    <ScrollArea>
                      <Timeline
                        active={0}
                        bulletSize={24}
                        lineWidth={2}
                        className="mb-2"
                      >
                        {list.map((info: ProfilerRenderPayload, i, arr) => {
                          let bullet = <IconSquareRoundedPlus size={12} />; // mounted
                          if (info.phase === 'update') {
                            bullet = <IconLoader2 size={12} />;
                          } else if (info.phase === 'nested-update') {
                            bullet = <IconLoader3 size={12} />;
                          }

                          const prev: ProfilerRenderPayload | undefined =
                            arr[i + 1];

                          return (
                            <Timeline.Item
                              key={info.id + info.startTime}
                              bullet={bullet}
                              title={
                                <div>
                                  {info.phase}{' '}
                                  <TipIcon
                                    text={
                                      <div>
                                        "mount", "update" or "nested-update".
                                        This lets you know whether the tree has
                                        just been mounted for the first time or
                                        re-rendered due to a change in props,
                                        state, or Hooks.
                                      </div>
                                    }
                                  />
                                </div>
                              }
                              lineVariant={
                                info.startTime - (prev?.startTime ?? 0) <= 5_000
                                  ? 'solid'
                                  : 'dotted'
                              }
                            >
                              <Text size="sm">
                                Actual Duration:{' '}
                                <Tooltip label={info.actualDuration}>
                                  <span>
                                    {Number(info.actualDuration).toFixed(2)}ms
                                  </span>
                                </Tooltip>
                                <TipIcon
                                  text={
                                    <div>
                                      The number of milliseconds spent rendering
                                      the <Code>{'<Profiler>'}</Code> and its
                                      descendants for the current update. This
                                      indicates how well the subtree makes use
                                      of memoization (e.g. memo and useMemo).
                                      Ideally this value should decrease
                                      significantly after the initial mount as
                                      many of the descendants will only need to
                                      re-render if their specific props change.
                                    </div>
                                  }
                                />
                              </Text>
                              <Text size="sm">
                                Base Duration :{' '}
                                <Tooltip label={info.baseDuration}>
                                  <span>
                                    {Number(info.baseDuration).toFixed(2)}ms
                                  </span>
                                </Tooltip>
                                <TipIcon
                                  text={
                                    <div>
                                      The number of milliseconds estimating how
                                      much time it would take to re-render the
                                      entire <Code>{'<Profiler>'}</Code>
                                      subtree without any optimizations. It is
                                      calculated by summing up the most recent
                                      render durations of each component in the
                                      tree. This value estimates a worst-case
                                      cost of rendering (e.g. the initial mount
                                      or a tree with no memoization). Compare
                                      actualDuration against it to see if
                                      memoization is working.
                                    </div>
                                  }
                                />
                              </Text>
                              <Text c="dimmed" size="xs" mt={4}>
                                Start Time: {info.startTime} (Δ
                                {info.startTime - (prev?.startTime ?? 0)})
                                <TipIcon text="A numeric timestamp for when React began rendering the current update." />
                              </Text>
                              <Text c="dimmed" size="xs" mt={4}>
                                Commit Time: {info.commitTime} (Δ
                                {info.commitTime - (prev?.commitTime ?? 0)})
                                <TipIcon text="A numeric timestamp for when React committed the current update. This value is shared between all profilers in a commit, enabling them to be grouped if desirable." />
                              </Text>
                            </Timeline.Item>
                          );
                        })}
                      </Timeline>
                    </ScrollArea>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </div>
      )}
    </ScrollArea>
  );
});
DevicePerformanceRender.displayName = 'DevicePerformanceRender';
