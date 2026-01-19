import {
  IconBinaryTree,
  IconGauge,
  IconHome2,
  IconCommand,
  IconList,
  IconPhoto,
  IconAlertTriangle,
  IconNetwork,
} from '@tabler/icons-react';
import { Home } from '../components/Home';
import { DeviceLogs } from '../components/DeviceLogs';
import { DeviceData } from '../components/DeviceData';
import { DeviceCommand } from '../components/DeviceCommand';
import { DevicePerformance } from '../components/DevicePerformance';
import { DeviceOverlay } from '../components/DeviceOverlay';
import { DeviceIssues } from '../components/DeviceIssues';
import { DeviceNetwork } from '../components/DeviceNetwork';

export const menu = [
  { key: 'home', icon: IconHome2, label: 'Home', component: <Home /> },
  {
    key: 'dashboard',
    icon: IconList,
    label: 'Dashboard',
    component: <DeviceLogs />,
  },
  {
    key: 'network',
    icon: IconNetwork,
    label: 'Network',
    component: <DeviceNetwork />,
  },
  {
    key: 'issues',
    icon: IconAlertTriangle,
    label: 'Issues',
    component: <DeviceIssues />,
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
  {
    key: 'overlay',
    icon: IconPhoto,
    label: 'Overlay',
    component: <DeviceOverlay />,
  },
] as const;
