import { GeminiResponseManager } from "../response-managers/gemini";
import { HeygenSpeechManager } from "../speech-managers/heygen";
import { VoiceChatManager } from "./type";
import { TalkManager } from "../talk-managers/talk-manager";
import { StreamCallbacks, TaskType } from "../../avatar";

export class GoogleVoiceChatManager implements VoiceChatManager {
  private _ws?: WebSocket | null = null;
  private _audioContext: AudioContext | null = null;
  private _processor: AudioWorkletNode | null = null;
  private _stream: MediaStream | null = null;
  private _speechIsFinal: boolean = false;
  private _transcript: string = "";
  private _geminiResponseManager: GeminiResponseManager;
  private _heygenSpeechManager: HeygenSpeechManager;
  private _talkManager: TalkManager;
  private _langIn: string = "en-US";
  constructor(
    geminiResponseManager: GeminiResponseManager,
    heygenSpeechManager: HeygenSpeechManager,
    talkManager: TalkManager,
    langIn: string = "en-US",
  ) {
    this._geminiResponseManager = geminiResponseManager;
    this._heygenSpeechManager = heygenSpeechManager;
    this._talkManager = talkManager;
    this._langIn = langIn;
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
    task_type: TaskType,
  ) {
    console.log("[Google voice chat] starting voice chat...");
    const host = window.location.hostname;
    const portNumber = window.location.port;
    const port = portNumber ? `:${portNumber}` : "";
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    this._ws = new WebSocket(`${protocol}://${host}${port}/ws`);

    this._ws.onmessage = async (event) => {
      const { transcript: transcriptRes, isFinal: isChunkRes } = JSON.parse(
        event.data,
      );
      const transcript = transcriptRes as string;
      const isChunk = isChunkRes as boolean;
      //strip all whitespace and return if the string is empty with regex
      const allWhitespace = /^\s*$/;
      if (allWhitespace.test(transcript) || transcript.length === 0) {
        return;
      }
      this._speechIsFinal = isChunk;
      on?.inputTranscript(this._transcript, isChunk, false);
      console.log("[Google voice chat]", transcript, isChunk);
      if (isChunk) {
        this._transcript += transcript;
      } else {
        return await new Promise((resolve) => {
          setTimeout(async () => {
            on.interrupt("", false, false);
            await this._heygenSpeechManager.interrupt(sessionId);
            resolve(undefined);
          }, 100);
        });
      }
      const llmResponse = await this._geminiResponseManager._getResponse(
        this._transcript,
        "voice",
        task_type,
        () => this._speechIsFinal,
      );
      if (llmResponse.state !== "final") {
        return;
      }

      const speakResponse = await this._heygenSpeechManager._speak(
        { text: llmResponse.value },
        "voice",
        sessionId,
        () => this._speechIsFinal,
        on.avatarStartTalking,
      );
      if (speakResponse.state !== "final") {
        return;
      }

      if (this._transcript) {
        on?.inputTranscript(this._transcript, false, true);
      }
      this._transcript = "";
    };

    this._stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this._audioContext = new AudioContext({ sampleRate: 16000 });

    await this._audioContext.audioWorklet.addModule("/worklet.js");

    const source = this._audioContext.createMediaStreamSource(this._stream);
    this._processor = new AudioWorkletNode(this._audioContext, "pcm-processor");

    this._processor.port.onmessage = (e) => {
      if (this._ws?.readyState === WebSocket.OPEN) {
        this._ws.send(e.data);
      }
    };

    source.connect(this._processor);
  }

  async closeVoiceChat() {
    console.log("[Google voice chat] closing voice chat...");
    this._ws?.close();
    this._processor?.disconnect();
    this._audioContext?.close();
    this._stream?.getTracks().forEach((track) => track.stop());

    this._ws = null;
    this._processor = null;
    this._audioContext = null;
    this._stream = null;
  }

  async muteInputAudio() {
    console.log("[Google voice chat] Muting microphone...");
    if (!this._stream) return;
    this._stream.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    console.log("[Google voice chat] Microphone muted");
  }

  async unmuteInputAudio() {
    console.log("[Google voice chat] Enabling microphone...");
    if (!this._stream) return;
    this._stream.getAudioTracks().forEach((track) => (track.enabled = true));
    console.log("Microphone enabled");
  }
}
