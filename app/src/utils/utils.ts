/**
 * Try to parse input to json object.
 * if not a valid json string, will return input
 */
export function tryToParseJSON(input: unknown) {
  if (typeof input !== 'string') {
    return input;
  }

  try {
    return JSON.parse(input);
  } catch (e) {
    return input;
  }
}

export function getPayloadSize(body: unknown): number {
  if (typeof body === 'string') {
    return new Blob([body]).size;
  }
  if (body === null || body === undefined) {
    return 0;
  }
  return new Blob([JSON.stringify(body)]).size;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
