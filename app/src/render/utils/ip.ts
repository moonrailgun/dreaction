export const getIp = async () => {
  const localIP = await window.electron.ipcRenderer.invoke<string>(
    'get-local-ip'
  );

  return localIP;
};
