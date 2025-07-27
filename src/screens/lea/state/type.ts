export type BooleanStore = {
  value: boolean;
  setValue: (value: boolean) => void;
  resetValue: () => void;
};

export type Message = {
  message: string;
  isUser: boolean;
  timestampMs: number;
  messageId: string;
};

export const newMessage = (
  message: string,
  isUser: boolean,
  messageId: string
) =>
  ({
    message: message,
    timestampMs: Date.now(),
    isUser: isUser,
    messageId: messageId,
  } as Message);

export type MessageListStore = {
  value: Message[];
  setValue: (value: Message[]) => void;
  addValue: (
    message: Message["message"],
    isUser: Message["isUser"],
    messageId: Message["messageId"]
  ) => void;
  resetValue: () => void;
  addToLastUserValue: (value: string, messageId: string) => void;
  addToLastRemoteValue: (value: string, messageId: string) => void;
  updateLastOrAddRemoteValue: (
    newVal: string,
    messageId: string,
    predicate: (prevVal: string, prevMessageId: string) => boolean
  ) => void;
};
