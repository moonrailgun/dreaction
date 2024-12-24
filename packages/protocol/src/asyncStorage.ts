export type AsyncStorageMutationState =
  | {
      action: 'setItem';
      data: {
        key: string;
        value: string;
      };
    }
  | {
      action: 'removeItem';
      data: {
        key: string;
      };
    }
  | {
      action: 'mergeItem';
      data: {
        key: string;
        value: string;
      };
    }
  | {
      action: 'clear';
      data: undefined;
    }
  | {
      action: 'multiSet';
      data: {
        pairs: any;
      };
    }
  | {
      action: 'multiRemove';
      data: {
        keys: any;
      };
    }
  | {
      action: 'multiMerge';
      data: {
        pairs: any;
      };
    };
