import { ObservablePrimitive } from "@legendapp/state";

export type UnwrapObservable<T> =
  T extends ObservablePrimitive<infer V> ? V : never;
