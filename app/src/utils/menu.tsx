import {
  IconBinaryTree,
  IconGauge,
  IconHome2,
  IconCommand,
  IconList,
} from '@tabler/icons-react';
import { Home } from '../components/Home';
import { DeviceLogs } from '../components/DeviceLogs';
import { DeviceData } from '../components/DeviceData';
import { DeviceCommand } from '../components/DeviceCommand';
import { DevicePerformance } from '../components/DevicePerformance';

export const menu = [
  { key: 'home', icon: IconHome2, label: 'Home', component: <Home /> },
  {
    key: 'dashboard',
    icon: IconList,
    label: 'Dashboard',
    component: <DeviceLogs />,
  },
  {
    key: 'dataWatch',
    icon: IconBinaryTree,
    label: 'DataWatch',
    component: <DeviceData />,
  },
  {
    key: 'command',
    icon: IconCommand,
    label: 'Command',
    component: <DeviceCommand />,
  },
  {
    key: 'performance',
    icon: IconGauge,
    label: 'Performance',
    component: <DevicePerformance />,
  },
] as const;
