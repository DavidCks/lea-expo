// store/useTriggerStore.ts
import { create } from "zustand";
import { BooleanStore } from "./type";

export const chatModeNotifier = create<BooleanStore>((set) => ({
  value: true,
  setValue: (value) => set({ value: value }),
  resetValue: () => set({ value: false }),
}));
