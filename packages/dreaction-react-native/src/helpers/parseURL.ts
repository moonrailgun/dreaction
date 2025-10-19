/**
 * Given a valid http(s) URL, the host for the given URL
 * is returned.
 *
 * @param url {string} URL to extract the host from
 * @returns {string} host of given URL or throws
 */
// Using a capture group to extract the hostname from a URL
export function getHostFromUrl(url: string) {
  // Group 1: http(s)://
  // Group 2: host
  // Group 3: port
  // Group 4: rest
  const host = url.match(/^(?:https?:\/\/)?(\[[^\]]+\]|[^/:\s]+)(?::\d+)?(?:[/?#]|$)/)?.[1]

  if (typeof host !== "string") throw new Error("Invalid URL - host not found")

  return host
}

/**
 * Extract host:port from URL
 * @param url URL string
 * @returns host:port string or throws if invalid
 */
export function getHostWithPortFromUrl(url: string) {
  const hostWithPort = url
    .replace(/^(?:https?:\/\/)?/, '')
    .split(/[/?#]/)[0]
    .trim();

  if (!hostWithPort) {
    throw new Error('Invalid URL - host not found');
  }

  return hostWithPort;
}

/**
 * Parse host and port separately
 */
export function parseHostAndPort(url: string): { host: string; port?: number } {
  const hostWithPort = getHostWithPortFromUrl(url);
  const lastColonIndex = hostWithPort.lastIndexOf(':');

  if (lastColonIndex === -1) {
    return { host: hostWithPort };
  }

  const host = hostWithPort.substring(0, lastColonIndex);
  const portStr = hostWithPort.substring(lastColonIndex + 1);
  const port = parseInt(portStr, 10);

  if (isNaN(port) || port <= 0 || port > 65535) {
    return { host: hostWithPort };
  }

  return { host, port };
}
