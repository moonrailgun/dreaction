export interface CustomCommandArg {
  name: string;
  type: 'string';
  options?: ({ label: string; value: string } | string)[];
}

export interface CustomCommandRegisterPayload {
  id: number;
  command: string;
  title?: string;
  description?: string;
  responseViewType?: 'auto' | 'table';
  args?: CustomCommandArg[];
}

export interface CustomCommandResponsePayload {
  command: string;
  payload: any;
}
