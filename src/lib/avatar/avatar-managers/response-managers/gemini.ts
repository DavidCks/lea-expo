import { GeminiRequest } from "@/src/lib/types/api";
import { TaskType } from "@/src/lib/avatar/avatar";
import { RNSB } from "@/src/controllers/supabase";

export class GeminiResponseManager {
  private _langOut: string;
  constructor(langOut: string) {
    this._langOut = langOut;
  }

  async _getResponse(
    text: string,
    source: "text" | "voice",
    task_type: TaskType,
    speechIsFinal: () => boolean,
  ) {
    const request: GeminiRequest = {
      message: text,
      language: this._langOut,
      task_type: task_type,
    };
    const url = RNSB.getBackendUrl("/api/get-response");
    const response = await RNSB.fetchWithAuth(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      return {
        value:
          "There's something wrong with the Gemini API. Hang tight! We'll fix it soon!",
        source: source,
        state: "error",
      };
    }
    const data = await response.text();
    console.log(data);
    if (source === "voice" && !speechIsFinal()) {
      return {
        value: "",
        source: source,
        state: "interrupt",
      };
    } else {
      return {
        value: data,
        source: source,
        state: "final",
      };
    }
  }
}
