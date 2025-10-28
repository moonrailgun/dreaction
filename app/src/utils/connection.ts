import {
  FaQuestion as IconDefault,
  FaApple as IconPhoneApple,
  FaAndroid as IconPhoneAndroid,
  FaFirefox as IconBrowserFirefox,
  FaSafari as IconBrowserSafari,
  FaEdge as IconBrowserEdge,
  FaChrome as IconBrowserChrome,
} from 'react-icons/fa';

import { Connection } from '../context/DReaction/index';

const RX_FIREFOX = /Firefox\//;
const RX_SAFARI = /Safari\//;
const RX_EDGE = /Edge\//;
const RX_CHROME = /Chrome\//;

export function getBrowserApp(connection: Connection) {
  const ua = (connection && connection.userAgent) || '';
  if (RX_FIREFOX.test(ua)) return 'Firefox';
  if (RX_CHROME.test(ua)) return 'Chrome'; // has to go before safari
  if (RX_SAFARI.test(ua)) return 'Safari';
  if (RX_EDGE.test(ua)) return 'Edge';

  return 'Edge';
}

export function getPlatformName(connection: Connection) {
  switch (connection.platform) {
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    case 'web':
      return getBrowserApp(connection) || 'Web';
    default:
      return connection.platform || 'Unknown platform';
  }
}

export function getPlatformDetails(connection: Connection) {
  const { platformVersion, osRelease, platform } = connection;

  switch (platform) {
    case 'ios': {
      return `${platformVersion}`;
    }

    case 'android': {
      if (osRelease) {
        return `${osRelease || ''} (sdk ${platformVersion})`;
      } else {
        return `sdk ${platformVersion}`;
      }
    }

    case 'web': {
      if (platformVersion === 'MacIntel') {
        return 'macOS';
      } else {
        return `${platformVersion}`;
      }
    }

    default:
      return '';
  }
}

export function getConnectionName(connection: Connection) {
  if (!connection.name) {
    return 'Name unknown';
  }
  return connection.name;
}

export function getScreen(connection: Connection) {
  const { windowWidth, windowHeight, screenScale } = connection as any;

  if (windowWidth && windowHeight && screenScale) {
    return `${windowWidth} x ${windowHeight} @ ${screenScale}x`;
  }

  return '';
}

const PHONE_ICONS = {
  ios: IconPhoneApple,
  android: IconPhoneAndroid,
};
const BROWSER_ICONS = {
  Firefox: IconBrowserFirefox,
  Chrome: IconBrowserChrome,
  Safari: IconBrowserSafari,
  Edge: IconBrowserEdge,
};

export function getIcon(connection: Connection) {
  if (connection.platform === 'web') {
    return BROWSER_ICONS[getBrowserApp(connection)] || IconDefault;
  } else {
    return PHONE_ICONS[connection.platform] || IconDefault;
  }
}
