export type NetworkMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS';

export interface NetworkRequest {
  url: string;
  method: NetworkMethod;
  data: any;
  headers: Record<string, string>;
  params: any;
}

export interface NetworkResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export interface NetworkRequestPayload {
  requestId: string;
  request: NetworkRequest;
}

export interface NetworkResponsePayload {
  requestId: string;
  request: NetworkRequest;
  response: NetworkResponse;
  duration: number;
}

/**
 * @deprecated Use NetworkResponsePayload instead
 */
export interface NetworkPayload {
  request: NetworkRequest;
  response: NetworkResponse;
  duration: number;
}
