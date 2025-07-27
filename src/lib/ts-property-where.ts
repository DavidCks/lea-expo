export type PropertyWhere<T, Match> = {
  [K in keyof T]: T[K] extends Match ? K : never;
}[keyof T];
