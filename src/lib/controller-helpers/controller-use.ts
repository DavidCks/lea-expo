/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObservablePrimitive } from "@legendapp/state";
import { PropertyWhere } from "../ts-property-where";
import { UnwrapObservable } from "../ts-unwrap-observable";
import { use$ } from "@legendapp/state/react";

export function controllerUse<T extends Record<string, any>>(target: T) {
  return {
    use<
      K extends
        | PropertyWhere<T, ObservablePrimitive<any>>
        | PropertyWhere<T["state"], ObservablePrimitive<any>>,
    >(
      key: K,
    ): K extends PropertyWhere<T, ObservablePrimitive<any>>
      ? UnwrapObservable<T[K]>
      : K extends PropertyWhere<T["state"], ObservablePrimitive<any>>
        ? UnwrapObservable<T["state"][K]>
        : never {
      if (key in target && typeof target[key as keyof T] === "object") {
        return use$(target[key as keyof T]);
      }

      if (
        "state" in target &&
        target.state &&
        key in target.state &&
        typeof target.state[key as keyof T["state"]] === "object"
      ) {
        return use$(target.state[key as keyof T["state"]]) as any;
      }

      throw new Error(
        `Property "${String(key)}" not found in controller or controller.state`,
      );
    },
  };
}
