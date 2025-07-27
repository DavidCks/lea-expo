import { TalkRequest } from "@/src/lib/types/api";
import { HeygenSpeechManager } from "../speech-managers/heygen";
import { RNSB } from "@/src/controllers/supabase";

export class TalkManager {
  private _langOut: string;
  private _heygenSpeechManager: HeygenSpeechManager;
  constructor(langOut: string, heygenSpeechManager: HeygenSpeechManager) {
    this._langOut = langOut;
    this._heygenSpeechManager = heygenSpeechManager;
  }

  private isTalking: boolean = false;
  private lastTalkTime: number = 0;
  private talkTimer: NodeJS.Timeout | null = null;
  private pendingTalkArgs: Parameters<TalkManager["talk"]> | null = null;
  private resolvePendingTalk:
    | ((result: Awaited<ReturnType<TalkManager["talk"]>>) => void)
    | null = null;

  async talk(
    args: Parameters<TalkManager["_performTalk"]>[0],
    source: "text" | "voice",
    sessionId: string,
    speechIsFinal: () => boolean,
    onSpeakStart: (
      taskResponse: Awaited<ReturnType<HeygenSpeechManager["_sendTask"]>>,
      text: string,
    ) => void,
    userId: string,
  ): ReturnType<TalkManager["_performTalk"]> {
    const now = Date.now();
    const sinceLast = now - this.lastTalkTime;

    console.log(`[talk] Called at ${now}, sinceLast = ${sinceLast}ms`);

    // Store the latest args
    this.pendingTalkArgs = [
      args,
      source,
      sessionId,
      speechIsFinal,
      onSpeakStart,
      userId,
    ];

    return await new Promise((resolve) => {
      this.resolvePendingTalk = resolve;

      if (this.isTalking || sinceLast < 200) {
        console.log(`[talk] In cooldown or in-flight. Will debounce.`);

        if (this.talkTimer) {
          clearTimeout(this.talkTimer);
          console.log(`[talk] Cleared existing debounce timers`);
        }

        this.talkTimer = setTimeout(() => {
          this.talkTimer = null;
          const latestArgs = this.pendingTalkArgs!;
          console.log(`[talk] Executing debounced call`);
          this._performTalk(...latestArgs).then(this.resolvePendingTalk!);
        }, 200);
      } else {
        console.log(`[talk] Executing immediately`);
        this._performTalk(
          args,
          source,
          sessionId,
          speechIsFinal,
          onSpeakStart,
          userId,
        ).then(resolve);
      }
    });
  }

  async _performTalk(
    { text }: { text: string },
    source: "text" | "voice",
    sessionId: string,
    speechIsFinal: () => boolean,
    onSpeakStart: (
      taskResponse: Awaited<ReturnType<HeygenSpeechManager["_sendTask"]>>,
      text: string,
    ) => void,
    userId: string,
  ): ReturnType<HeygenSpeechManager["_speak"]> {
    this.isTalking = true;
    this.lastTalkTime = Date.now();
    console.log(
      `[talk] Performing talk at ${this.lastTalkTime} with text:`,
      text,
    );
    const request: TalkRequest = {
      message: text,
      language: this._langOut,
      session_id: sessionId,
      task_mode: "sync",
      user_id: userId,
    };
    const url = RNSB.getBackendUrl("/api/talk");
    let response: Response;

    try {
      response = await RNSB.fetchWithAuth(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
    } catch (err) {
      console.error(`[talk] Fetch error:`, err);
      this.isTalking = false;
      return {
        duration_ms: -1,
        task_id: "-1",
        source,
        value: text,
        state: "error",
      };
    }

    const final = speechIsFinal();
    let body: {
      duration_ms: number;
      task_id: string;
      text: string;
    } = {
      duration_ms: -1,
      task_id: "-1",
      text: "",
    };

    const resData = await response.json();
    if (speechIsFinal() && response.ok) {
      const taskBody = resData.data as {
        duration_ms: number;
        task_id: string;
      };
      body = {
        ...taskBody,
        text: resData.text,
      };
      console.log(`[talk] Final speech, invoking onSpeakStart in 100ms`);
      setTimeout(() => {
        onSpeakStart({ value: body, error: undefined }, body.text);
      }, 100);
    } else {
      console.warn(`[talk] Not final or not ok, sending interrupt`);
      this._heygenSpeechManager.interrupt(sessionId);
    }
    this.isTalking = false;

    console.log(
      `[talk] Completed with state: ${!response.ok ? "error" : final ? "final" : "interrupt"}`,
    );

    return {
      ...body,
      source: source,
      value: text,
      state: !response.ok ? "error" : final ? "final" : "interrupt",
    };
  }
}
