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
