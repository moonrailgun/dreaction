export interface DataWatchPayload {
  name: string;
  type: 'text' | 'list' | 'json';
  data: unknown;
}
