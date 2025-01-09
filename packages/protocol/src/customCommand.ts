export interface CustomCommandArg {
  name: string;
  type: 'string';
}

export interface CustomCommandPayload {
  id: number;
  command: string;
  title: string | undefined;
  description: string | undefined;
  args: CustomCommandArg[] | undefined;
}
