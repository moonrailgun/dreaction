import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();

  if (interfaces['en0']) {
    // en0 first
    for (const iface of interfaces.en0) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  for (const name of Object.keys(interfaces)) {
    for (const iface of (interfaces as any)[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export const getIp = async () => {
  return getLocalIP();
};
