import { GeminiResponseManager } from "../response-managers/gemini";
import { HeygenSpeechManager } from "../speech-managers/heygen";
import { VoiceChatManager } from "./type";
import { TranscriptionSession } from "./utils/transcription-session";
import { TalkManager } from "../talk-managers/talk-manager";
import { AvatarResponse, StreamCallbacks } from "../../avatar";
import { VoiceTokenData } from "@/src/lib/types/api";
import { RNSB } from "@/src/controllers/supabase";
import { mediaDevices } from "@livekit/react-native-webrtc";

export class OpenAIVoiceChatManager implements VoiceChatManager {
  private _geminiResponseManager: GeminiResponseManager;
  private _heygenSpeechManager: HeygenSpeechManager;
  private _talkManager: TalkManager;
  private _speechIsFinal: boolean = true;
  private _transcript: string = "";
  private _pc: RTCPeerConnection | null;
  private _dc: RTCDataChannel | null;
  private _langIn: string = "en-US";
  private _userId: string;

  constructor(
    geminiResponseManager: GeminiResponseManager,
    heygenSpeechManager: HeygenSpeechManager,
    talkManager: TalkManager,
    langIn: string = "en-US",
    userId: string,
  ) {
    this._geminiResponseManager = geminiResponseManager;
    this._talkManager = talkManager;
    this._heygenSpeechManager = heygenSpeechManager;
    this._pc = null;
    this._dc = null;
    this._langIn = langIn;
    this._userId = userId;
  }

  private async _fetchAccessToken(): Promise<AvatarResponse<VoiceTokenData>> {
    try {
      const url = RNSB.getBackendUrl("/api/get-voice-token");
      const res = await RNSB.fetchWithAuth(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: this._langIn,
        }),
      });
      if (!res.ok) {
        const error = await res.text();
        console.error("Error fetching access token:", error);
        return {
          value: undefined,
          error: { message: `Failed to fetch access token: ${error}` },
        };
      }

      const data = (await res.json()).data as VoiceTokenData;
      return { value: data, error: undefined };
    } catch (error) {
      console.error("Error fetching access token:", error);
      return {
        value: undefined,
        error: { message: `Failed to start session: ${error}` },
      };
    }
  }

  async startVoiceChat(
    on: {
      inputTranscript: StreamCallbacks["inputTranscript"];
      interrupt: StreamCallbacks["interrupt"];
      avatarStartTalking: (
        taskResponse: Awaited<ReturnType<HeygenSpeechManager["_sendTask"]>>,
        text: string,
      ) => void;
    },
    sessionId: string,
  ): Promise<void> {
    console.log("starting voice chat...");
    const token = await this._fetchAccessToken();
    if (token.error) {
      console.error("error starting openai voice chat ", token.error.message);
      return;
    }
    console.log("Successfully fetched voice token:", token.value);

    const mic = await mediaDevices.getUserMedia({ audio: true });
    const session = new TranscriptionSession(token.value.token);
    // const session = new TranscriptionSession(apiKey!); // const session = new TranscriptionSession(token.value.token);

    session.onconnectionstatechange = (state) => {
      console.log("WebRTC connection state:", state);
    };

    session.onerror = (e) => {
      console.error("Session error:", e);
    };

    session.onmessage = async (msg) => {
      console.log("Voice message:", msg["type"]);
      let isChunk: boolean;
      let transcript: string;
      if (msg.type === "conversation.item.input_audio_transcription.delta") {
        isChunk = false;
        transcript = msg.delta;
      } else if (
        msg.type === "conversation.item.input_audio_transcription.completed"
      ) {
        isChunk = true;
        transcript = msg.transcript;
        console.log("CHUNK", transcript);
      } else if (msg.type === "input_audio_buffer.speech_started") {
        console.log("User started speaking");
        this._speechIsFinal = false;
        on.interrupt("", false, false);
        await this._heygenSpeechManager.interrupt(sessionId);
        return;
      } else {
        // console.log("Other event:", msg);
        return;
      }

      const allWhitespace = /^\s*$/;
      if (allWhitespace.test(transcript) || transcript.length === 0) {
        return;
      }

      this._speechIsFinal = isChunk;
      on?.inputTranscript(transcript, isChunk, false);
      // console.log(transcript, isChunk);
      if (isChunk) {
        this._transcript += `${transcript} `;
      } else {
        return await new Promise((resolve) => {
          setTimeout(async () => {
            on.interrupt(this._transcript, false, false);
            await this._heygenSpeechManager.interrupt(sessionId);
            resolve(undefined);
          }, 100);
        });
      }
      const preTalkTimestamp = Date.now();
      const speakResponse = await this._talkManager.talk(
        { text: this._transcript },
        "voice",
        sessionId,
        () => this._speechIsFinal,
        on.avatarStartTalking,
        this._userId,
      );
      if (speakResponse.state === "interrupt") {
        on.interrupt(this._transcript, true, false);
      }
      const postTalkTimestamp = Date.now();
      const talkCost = postTalkTimestamp - preTalkTimestamp;
      console.log("TIMING", {
        duration: talkCost,
      });
      if (speakResponse.state !== "final" || !this._speechIsFinal) {
        return;
      }
      if (this._transcript) {
        on?.inputTranscript(this._transcript, false, true);
        this._transcript = "";
      }
    };

    await session.startTranscription(mic);

    console.log("OpenAI transcription session started.");
  }

  async closeVoiceChat(): Promise<void> {
    this._dc?.close();
    this._pc?.close();
    this._dc = null;
    this._pc = null;
    console.log("OpenAI voice chat closed.");
  }

  async muteInputAudio(): Promise<void> {
    this._pc?.getSenders().forEach((sender) => {
      if (sender.track) sender.track.enabled = false;
    });
    console.log("Input audio muted.");
  }

  async unmuteInputAudio(): Promise<void> {
    this._pc?.getSenders().forEach((sender) => {
      if (sender.track) sender.track.enabled = true;
    });
    console.log("Input audio unmuted.");
  }
}
