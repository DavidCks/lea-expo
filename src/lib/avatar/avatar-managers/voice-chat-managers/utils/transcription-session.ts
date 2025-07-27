import {
  RTCPeerConnection,
  RTCIceCandidate,
  MediaStream,
  MediaStreamTrack,
} from "@livekit/react-native-webrtc";
import RTCSessionDescription, {
  RTCSessionDescriptionInit,
} from "@livekit/react-native-webrtc/lib/typescript/RTCSessionDescription";

import {
  CustomRTCDataChannel,
  CustomRTCPeerConnection,
  RTCEventCallbackParam as CustomRTCEventCallbackParam,
} from "./transcript-session-type-ext";

export type SessionConfig = {
  input_audio_format?: string;
  input_audio_transcription?: {
    model: string;
    prompt?: string;
    language?: string;
  };
  turn_detection?: {
    type: "server_vad" | "client_vad";
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  input_audio_noise_reduction?: {
    type: "near_field" | "far_field";
  };
  include?: string[];
};

export type TranscriptionEvent =
  | {
      type: "transcription_session.created";
      session: { id: string };
    }
  | {
      type: "input_audio_buffer.speech_started";
    }
  | {
      type: "input_audio_buffer.speech_stopped";
    }
  | {
      type: "conversation.item.input_audio_transcription.delta";
      delta: string;
    }
  | {
      type: "conversation.item.input_audio_transcription.completed";
      transcript: string;
    }
  | any; // fallback for untyped messages

export class TranscriptionSession {
  private apiKey: string;
  private useSessionToken: boolean = true;
  private ms: MediaStream | null = null;
  private pc: CustomRTCPeerConnection | null = null;
  private dc: CustomRTCDataChannel | null = null;
  private muted: boolean = false;

  // Optional event handlers (assign externally)
  ontrack?: (e: CustomRTCEventCallbackParam<"track">) => void;
  onconnectionstatechange?: (
    state: RTCPeerConnection["connectionState"],
  ) => void;
  onopen?: () => void;
  onmessage?: (msg: TranscriptionEvent) => void;
  onerror?: (e: any) => void;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async start(stream: MediaStream) {
    await this.startInternal(stream);
  }

  async startTranscription(stream: MediaStream) {
    await this.startInternal(stream);
  }

  stop() {
    this.dc?.close();
    this.dc = null;

    this.pc?.close();
    this.pc = null;

    this.ms?.getTracks().forEach((t) => t.stop());
    this.ms = null;

    this.muted = false;
  }

  mute(muted: boolean) {
    this.muted = muted;
    this.pc?.getSenders().forEach((sender) => {
      if (sender.track) sender.track.enabled = !muted;
    });
  }

  async startInternal(stream: MediaStream) {
    this.ms = stream;
    this.pc = new RTCPeerConnection() as CustomRTCPeerConnection;

    this.pc.addEventListener("track", (e) =>
      this.ontrack?.(e as CustomRTCEventCallbackParam<"track">),
    );
    this.pc.addEventListener("connectionstatechange", (e) =>
      this.onconnectionstatechange?.(this.pc!.connectionState),
    );
    this.pc.addEventListener("iceconnectionstatechange", () => {
      console.log("[DEBUG] ICE connection state:", this.pc!.iceConnectionState);
    });

    this.pc.addEventListener("signalingstatechange", () => {
      console.log("[DEBUG] Signaling state:", this.pc!.signalingState);
    });

    const audioTrack = stream.getTracks()[0];
    this.pc.addTrack(audioTrack);
    console.log(
      "[DEBUG] Adding audio track:",
      audioTrack.id,
      audioTrack.enabled,
    );

    this.dc = this.pc.createDataChannel("oai-events") as CustomRTCDataChannel;
    this.dc.addEventListener("open", (e) => this.onopen?.());
    this.dc.addEventListener("message", (event) => {
      const e = event as CustomRTCEventCallbackParam<"message">;

      if (typeof e.data === "string") {
        try {
          const parsed: TranscriptionEvent = JSON.parse(e.data);
          this.onmessage?.(parsed);
        } catch (err) {
          console.error("Failed to parse message:", e.data);
        }
      } else {
        console.error("Received non-string message:", e.data);
      }
    });

    const offer = await this.pc.createOffer({});
    await this.pc.setLocalDescription(offer);

    try {
      const answer = await this.signal(offer);
      await this.pc.setRemoteDescription(answer);
    } catch (e) {
      this.onerror?.(e);
    }

    console.log("[DEBUG] Audio track state:");
    console.log("  ID:", audioTrack.id);
    console.log("  Enabled:", audioTrack.enabled);
    console.log("  Muted:", audioTrack.muted);
    console.log("  Ready state:", audioTrack.readyState);
  }

  private async signal(offer: RTCSessionDescriptionInit): Promise<{
    type: "answer";
    sdp: string;
  }> {
    const urlRoot = "https://api.openai.com";
    const realtimeUrl = `${urlRoot}/v1/realtime`;
    let sdpResponse: Response;

    sdpResponse = await fetch(realtimeUrl, {
      method: "POST",
      body: offer.sdp!,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/sdp",
      },
    });

    if (!sdpResponse.ok) {
      throw new Error("Failed to signal");
    }

    return {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
  }

  sendMessage(message: object) {
    if (this.dc?.readyState === "open") {
      this.dc.send(JSON.stringify(message));
    }
  }
}
