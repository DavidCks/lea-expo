// store/useTriggerStore.ts
import { create } from "zustand";
import { BooleanStore } from "./type";

export const characterTalkingNotifier = create<BooleanStore>((set) => ({
  value: false,
  setValue: (value) => set({ value: value }),
  resetValue: () => set({ value: false }),
}));
