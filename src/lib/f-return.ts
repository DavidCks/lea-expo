export type FReturn<T> =
  | {
      value: null;
      error: string;
    }
  | {
      value: T;
      error: null;
    };
