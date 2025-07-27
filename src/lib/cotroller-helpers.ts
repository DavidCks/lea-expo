/* eslint-disable @typescript-eslint/no-explicit-any */
import { controllerRaw } from "./controller-helpers/controller-raw";
import { controllerUse } from "./controller-helpers/controller-use";

export function withControllerHelpers<T extends Record<string, any>>(
  controller: T,
) {
  return Object.assign(controller, {
    ...controllerUse(controller),
    ...controllerRaw(controller),
  });
}
