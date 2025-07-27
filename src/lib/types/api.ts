import type { UserWalletsData } from "./user_wallets";
import type { SessionData } from "./session_data";
import type { UserSettingsData } from "./user_settings";
import type { UserCreditsData } from "./user_credits";
import { TaskType } from "../avatar/avatar";

export type { UserWalletsData, SessionData, UserSettingsData, UserCreditsData };

export type LEAResponse<T> =
  | {
      value: T;
      response: undefined;
    }
  | {
      value: undefined;
      response: Response;
    };

export type VoiceTokenData = {
  token: string;
};

export type TableNames =
  | "user_credits"
  | "session_data"
  | "user_settings"
  | "user_wallets";

export type GeminiRequest = {
  message: string;
  language: string;
  task_type: TaskType;
};

export type TalkRequest = {
  message: string;
  language: string;
  session_id: string;
  task_mode: "sync" | "async";
  user_id: string;
};

export type GeminiResponse = { message: string };

// simple cache to stock convo per user
export type ConversationMessage = {
  role: "user" | "model";
  text: string;
  timestamp: number;
};
export type ConversationHistory = Array<ConversationMessage>;
