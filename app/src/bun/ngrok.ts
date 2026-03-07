import ngrok from '@ngrok/ngrok';

let currentListener: ngrok.Listener | null = null;

export async function startNgrokTunnel(
  port: number,
  authtoken?: string,
  domain?: string
): Promise<{ url: string }> {
  await stopNgrokTunnel();

  currentListener = await ngrok.forward({
    addr: port,
    authtoken: authtoken || undefined,
    domain: domain || undefined,
  });

  const url = currentListener.url();
  return { url: url || '' };
}

export async function stopNgrokTunnel(): Promise<void> {
  if (currentListener) {
    await currentListener.close();
    currentListener = null;
  }
}
