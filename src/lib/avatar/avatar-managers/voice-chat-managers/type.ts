/* eslint-disable @typescript-eslint/no-unused-vars */
import { StreamCallbacks, TaskType } from "@/src/lib/avatar/avatar";
import { HeygenSpeechManager } from "../speech-managers/heygen";

export abstract class VoiceChatManager {
  async startVoiceChat(
    on: {
      inputTranscript: StreamCallbacks["inputTranscript"];
      avatarStartTalking: (
        taskResponse: Awaited<ReturnType<HeygenSpeechManager["_sendTask"]>>,
        text: string,
      ) => void;
    },
    sessionId: string,
    task_type: TaskType,
  ): Promise<void> {
    throw new Error("unimplemented 'startVoiceChat'");
  }

  async closeVoiceChat(): Promise<void> {
    throw new Error("unimplemented 'closeVoiceChat'");
  }

  async muteInputAudio(): Promise<void> {
    throw new Error("unimplemented 'closeVoiceChat'");
  }

  async unmuteInputAudio(): Promise<void> {
    throw new Error("unimplemented 'closeVoiceChat'");
  }
}
