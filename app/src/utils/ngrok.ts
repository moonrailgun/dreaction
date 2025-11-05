import ngrok from '@ngrok/ngrok';

export interface NgrokTunnelInfo {
  url: string;
  proto: string;
  publicUrl: string;
}

export type NgrokStatus = 'idle' | 'connecting' | 'connected' | 'error';

let currentListener: ngrok.Listener | null = null;

/**
 * Start ngrok tunnel
 * @param port Port to forward (default: 9600)
 * @param authtoken Optional ngrok authtoken for custom domains and features
 * @param domain Optional custom domain (requires ngrok paid plan)
 * @returns Tunnel information
 */
export async function startNgrokTunnel(
  port: number = 9600,
  authtoken?: string,
  domain?: string
): Promise<NgrokTunnelInfo> {
  try {
    // Stop existing tunnel if any
    await stopNgrokTunnel();

    // Configure ngrok with authtoken and domain if provided
    currentListener = await ngrok.forward({
      addr: port,
      authtoken: authtoken || undefined,
      domain: domain || undefined,
    });

    const url = currentListener.url();

    console.log(currentListener.metadata());

    return {
      url: url || '',
      proto: 'https',
      publicUrl: url || '',
    };
  } catch (error) {
    console.error('Failed to start ngrok tunnel:', error);
    throw error;
  }
}

/**
 * Stop current ngrok tunnel
 */
export async function stopNgrokTunnel(): Promise<void> {
  try {
    if (currentListener) {
      await currentListener.close();
      currentListener = null;
    }
  } catch (error) {
    console.error('Failed to stop ngrok tunnel:', error);
    throw error;
  }
}

/**
 * Get tunnel URL
 */
export function getTunnelUrl(): string | null {
  if (!currentListener) {
    return null;
  }
  try {
    return currentListener.url();
  } catch (error) {
    console.error('Failed to get tunnel URL:', error);
    return null;
  }
}

/**
 * Check if tunnel is active
 */
export function isTunnelActive(): boolean {
  return currentListener !== null;
}
