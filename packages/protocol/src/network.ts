export interface NetworkPayload {
  request: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
    data: any;
    headers: Record<string, string>;
    params: any;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
  duration: number;
}
