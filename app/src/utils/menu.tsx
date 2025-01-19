import {
  IconBinaryTree,
  IconGauge,
  IconHome2,
  IconCommand,
} from '@tabler/icons-react';
import { Home } from '../components/Home';
import { DeviceLogs } from '../components/DeviceLogs';
import { DeviceData } from '../components/DeviceData';
import { DeviceCommand } from '../components/DeviceCommand';

export const menu = [
  { key: 'home', icon: IconHome2, label: 'Home', component: <Home /> },
  {
    key: 'dashboard',
    icon: IconGauge,
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
] as const;
