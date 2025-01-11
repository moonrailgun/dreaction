export interface CustomCommandArg {
  name: string;
  type: 'string';
}

export interface CustomCommandRegisterPayload {
  id: number;
  command: string;
  title: string | undefined;
  description: string | undefined;
  args: CustomCommandArg[] | undefined;
}

export interface CustomCommandResponsePayload {
  command: string;
  payload: any;
}
