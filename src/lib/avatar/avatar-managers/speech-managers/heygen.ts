import { RNSB } from "@/src/controllers/supabase";
import { AvatarResponse } from "../../avatar";
import { HeygenRequest } from "./type";

export class HeygenSpeechManager {
  private _langOut: string;
  constructor(langOut: string) {
    this._langOut = langOut;
  }
  async _sendTask({
    sessionId,
    text,
    taskMode = "sync",
    taskType = "repeat",
  }: {
    sessionId: HeygenRequest["session_id"];
    text: HeygenRequest["text"];
    taskMode: HeygenRequest["task_mode"];
    taskType: HeygenRequest["task_type"];
  }) {
    try {
      await this.interrupt(sessionId);
      const url = RNSB.getBackendUrl("/api/send-task");
      const res = await RNSB.fetchWithAuth(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          text: text,
          task_mode: taskMode,
          task_type: taskType,
        }),
      });
      if (!res.ok) {
        const error = await res.text();
        console.error("Error sending task:", error);
        return {
          value: undefined,
          error: { message: `Failed to send task: ${error}` },
        };
      }

      const data = await res.json();
      return {
        value: data as { duration_ms: number; task_id: string },
        error: undefined,
      };
    } catch (error) {
      console.error("Error sending task:", error);
      return {
        value: undefined,
        error: { message: `Failed to send task: ${error}` },
      };
    }
  }

  async _speak(
    { text }: { text: string },
    source: "text" | "voice",
    sessionId: string,
    speechIsFinal: () => boolean,
    onSpeakStart: (
      taskResponse: Awaited<ReturnType<HeygenSpeechManager["_sendTask"]>>,
      text: string,
    ) => void,
  ): Promise<{
    value: string;
    source: "text" | "voice";
    state: "error" | "interrupt" | "final";
    duration_ms?: number;
    task_id?: string;
  }> {
    return await new Promise<{
      value: string;
      source: "text" | "voice";
      state: "interrupt" | "final" | "error";
      duration_ms?: number;
      task_id?: string;
    }>((resolve) => {
      setTimeout(async () => {
        console.log("[HeygenSpeechManager] Sending interrupt from _speak");
        await this.interrupt(sessionId);
        if (source === "voice" && !speechIsFinal()) {
          resolve({
            value: "",
            source: source,
            state: "interrupt",
          });
        } else {
          const taskResponse = await this._sendTask({
            sessionId: sessionId,
            text: text,
            taskMode: "sync",
            taskType: "repeat",
          });
          if (taskResponse.error) {
            resolve({
              value: taskResponse.error.message,
              source: source,
              state: "error",
            });
            return;
          }
          setTimeout(() => {
            onSpeakStart(taskResponse, text);
          }, 500);
          resolve({
            value: text,
            source: source,
            state: "final",
            duration_ms: taskResponse.value.duration_ms,
            task_id: taskResponse.value.task_id,
          });
          return;
        }
      }, 100);
    });
  }

  private static isInterrupting: boolean = false;
  private static lastInterruptTime: number = 0;
  private static interruptTimer: NodeJS.Timeout | null = null;
  private static pendingSessionId: string | null = null;

  async interrupt(sessionId: string): Promise<AvatarResponse<string>> {
    const now = Date.now();
    const sinceLast = now - HeygenSpeechManager.lastInterruptTime;
    HeygenSpeechManager.pendingSessionId = sessionId;

    // If we're in cooldown or in-flight, defer the call
    if (HeygenSpeechManager.isInterrupting || sinceLast < 500) {
      console.log("[HeygenSpeechManager] Interrupt in flight. debouncing...");
      if (HeygenSpeechManager.interruptTimer) {
        console.log("[HeygenSpeechManager] Clearing interrupt timer...");
        clearTimeout(HeygenSpeechManager.interruptTimer);
      }

      console.log("[HeygenSpeechManager] Creating new interrupt timer...");
      HeygenSpeechManager.interruptTimer = setTimeout(async () => {
        console.log("[HeygenSpeechManager] Performing debounced interrupt...");
        const latestSessionId = HeygenSpeechManager.pendingSessionId;
        HeygenSpeechManager.interruptTimer = null;
        if (latestSessionId) {
          await this._performInterrupt(latestSessionId);
        } else {
          console.log(
            "[HeygenSpeechManager] Cancelling debounced interrupt because there is no pending session id...",
          );
        }
      }, 500);

      return {
        value: undefined,
        error: { message: "Interrupt deferred" },
      };
    }

    // Otherwise perform immediately
    console.log("[HeygenSpeechManager] Performing interrupt...");
    const interruptResult = await this._performInterrupt(sessionId);
    return interruptResult;
  }

  private async _performInterrupt(
    sessionId: string,
  ): Promise<AvatarResponse<string>> {
    HeygenSpeechManager.isInterrupting = true;
    HeygenSpeechManager.lastInterruptTime = Date.now();
    console.log(
      "[HeygenSpeechManager] [interrupt] performing interrupt at ",
      Date.now(),
    );
    try {
      const url = RNSB.getBackendUrl("/api/interrupt");
      const res = await RNSB.fetchWithAuth(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        const error = await res.text();
        console.error("Error interrupting session:", error);
        return {
          value: undefined,
          error: { message: `Failed to interrupt session: ${error}` },
        };
      }

      const data = await res.json();
      return {
        value: data.status as string,
        error: undefined,
      };
    } catch (error) {
      console.error("Error interrupting session:", error);
      return {
        value: undefined,
        error: { message: `Failed to interrupt session: ${error}` },
      };
    } finally {
      HeygenSpeechManager.isInterrupting = false;
    }
  }
}
