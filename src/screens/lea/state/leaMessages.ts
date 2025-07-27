import { create } from "zustand";
import { MessageListStore, newMessage } from "./type";

export const leaMessagesNotifier = create<MessageListStore>((set) => ({
  value: [],
  setValue: (value) => set({ value: value }),
  addValue: (message, isUser, messageId) =>
    set((s) => ({
      value: [...s.value, newMessage(message, isUser, messageId)],
    })),
  addToLastUserValue: (value, messageId) =>
    set((s) => {
      const lastUserValueIndex = s.value.findLastIndex(
        (m) => m.isUser && m.messageId === messageId
      );
      if (lastUserValueIndex != -1) {
        const lastUserMessage = s.value.at(lastUserValueIndex)!.message;
        s.value[lastUserValueIndex] = {
          ...s.value[lastUserValueIndex],
          message: `${lastUserMessage}${value}`,
        };
        return {
          value: [...s.value],
        };
      } else {
        return {
          value: [...s.value, newMessage(value, true, messageId)],
        };
      }
    }),
  addToLastRemoteValue: (value, messageId) =>
    set((s) => {
      const lastRemoteValueIndex = s.value.findLastIndex(
        (m) => !m.isUser && m.messageId === messageId
      );
      if (lastRemoteValueIndex != -1) {
        const lastRemoteMessage = s.value.at(lastRemoteValueIndex)!.message;
        s.value[lastRemoteValueIndex] = {
          ...s.value[lastRemoteValueIndex],
          message: `${lastRemoteMessage}${value}`,
        };
        return {
          value: [...s.value],
        };
      } else {
        return {
          value: [...s.value, newMessage(value, false, messageId)],
        };
      }
    }),
  updateLastOrAddRemoteValue: (
    newVal: string,
    messageId: string,
    predicate: (prevVal: string, messageId: string) => boolean
  ) =>
    set((s) => {
      const lastRemoteValueIndex = s.value.findLastIndex((m) => !m.isUser);
      if (lastRemoteValueIndex === -1) {
        return {
          value: [...s.value, newMessage(newVal, false, messageId)],
        };
      }

      const current = s.value[lastRemoteValueIndex];
      if (predicate(current.message, current.messageId)) {
        s.value[lastRemoteValueIndex] = {
          ...current,
          message: newVal,
          messageId,
        };
        return { value: [...s.value] };
      }

      return {
        value: [...s.value, newMessage(newVal, false, messageId)],
      };
    }),
  resetValue: () => set({ value: [] }),
}));
