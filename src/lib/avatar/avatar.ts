//avatar.ts
import { StartAvatarResponse } from "@heygen/streaming-avatar";
import { RoomEventCallbacks } from "./types";
import { GoogleVoiceChatManager as GoogleVoiceChatManager } from "./avatar-managers/voice-chat-managers/google";
import { OpenAIVoiceChatManager as OpenAIVoiceChatManager } from "./avatar-managers/voice-chat-managers/openai";
import {
  ConnectionState,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  SubscriptionError,
  Track,
} from "livekit-client";
import { GeminiResponseManager as GeminiResponseManager } from "./avatar-managers/response-managers/gemini";
import { HeygenSpeechManager } from "./avatar-managers/speech-managers/heygen";
import { TalkManager } from "./avatar-managers/talk-managers/talk-manager";
import { RNSB } from "@/src/controllers/supabase";

export enum TaskType {
  TALK = "chat",
  REPEAT = "repeat",
}

export type AvatarResponse<T> =
  | {
      value: undefined;
      error: {
        message: string;
      };
    }
  | {
      value: T;
      error: undefined;
    };

export type AvatarEventType = "speakStart" | "inputTranscript";

export type AvatarEventSpeechStartData = {
  duration_ms: number;
  task_id: string;
  text: string;
};

export type AvatarEventSpeechEndData = {
  duration_ms: number;
  task_id: string;
};

export type InputTranscriptData = {
  text: string;
  isChunk: boolean;
  isFinal: boolean;
};

export type EventData =
  | {
      type: "speakStart";
      callback: (data: AvatarEventSpeechStartData) => void;
    }
  | {
      type: "speakEnd";
      callback: (data: AvatarEventSpeechEndData) => void;
    }
  | {
      type: "inputTranscript";
      callback: (data: InputTranscriptData) => void;
    }
  | {
      type: "interrupt";
      callback: (data: InputTranscriptData) => void;
    };

export type AvatarEventDataType = AvatarEventSpeechStartData;

export type StreamCallbacks = {
  connect: () => void;
  connectionStateChanged: (state: ConnectionState) => void;
  disconnect: (
    reason: "disconnected" | "trackUnsubscribed" | "trackUnpublished",
    track?: RemoteTrack,
    publication?: RemoteTrackPublication,
    participant?: RemoteParticipant,
  ) => void;
  streamStart: (
    track: RemoteTrack<Track.Kind>,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => void;
  failed: (
    trackSid: string,
    participant: RemoteParticipant,
    reason?: SubscriptionError,
  ) => void;
  speechStart: () => void;
  reconnecting: (source: "signal" | "stream") => void;
  event: (eventType: keyof RoomEventCallbacks) => void;
  inputTranscript: (text: string, isChunk: boolean, isFinal: boolean) => void;
  interrupt: (text: string, isChunk: boolean, isFinal: boolean) => void;
};

export class Avatar {
  private _avatarId: string;
  private _sessionId?: string;
  private _room?: Room;
  private _googleVoiceChatManager: GoogleVoiceChatManager;
  private _openAIVoiceChatManager: OpenAIVoiceChatManager;
  private _geminiResponseManager: GeminiResponseManager;
  private _heygenSpeechManager: HeygenSpeechManager;
  private _talkManager: TalkManager;
  private _userId: string;

  constructor(
    avatarId: string,
    langIn: string,
    langOut: string,
    langCodeIn: string,
    userId: string,
  ) {
    console.log("AVATAR", "Constructing managers...");
    this._avatarId = avatarId;
    console.log("AVATAR", "Constructing GeminiResponseManager...");
    this._geminiResponseManager = new GeminiResponseManager(langOut);
    console.log("AVATAR", "Constructing HeygenSpeechManager...");

    this._heygenSpeechManager = new HeygenSpeechManager(langOut);
    console.log("AVATAR", "Constructing TalkManager...");
    this._talkManager = new TalkManager(langOut, this._heygenSpeechManager);
    console.log("AVATAR", "Constructing OpenAIVoiceChatManager...");
    this._openAIVoiceChatManager = new OpenAIVoiceChatManager(
      this._geminiResponseManager,
      this._heygenSpeechManager,
      this._talkManager,
      langCodeIn,
      userId,
    );
    console.log("AVATAR", "Constructing GoogleVoiceChatManager...");
    this._googleVoiceChatManager = new GoogleVoiceChatManager(
      this._geminiResponseManager,
      this._heygenSpeechManager,
      this._talkManager,
      langIn,
    );
    this._userId = userId;
    console.log("AVATAR", "Finished constructing managers.");
  }

  private async _fetchAccessToken(): Promise<
    AvatarResponse<StartAvatarResponse>
  > {
    try {
      const url = RNSB.getBackendUrl("/api/get-access-token");
      const res = await RNSB.fetchWithAuth(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar_id: this._avatarId }),
      });
      if (!res.ok) {
        const error = await res.text();
        console.error(
          `Failed to fetch avatar access token: ${error}, (${res.status}) | ${res.statusText}`,
        );
        return {
          value: undefined,
          error: {
            message: `Failed to fetch access token: ${error}, (${res.status}) | ${res.statusText}`,
          },
        };
      }

      const data = (await res.json()).avatarResponse as StartAvatarResponse;
      return { value: data, error: undefined };
    } catch (error) {
      console.error("Error fetching access token:", error);
      return {
        value: undefined,
        error: { message: `Failed to start session: ${error}` },
      };
    }
  }

  private async _startHeygenSession(
    sessionId: string,
  ): Promise<AvatarResponse<string>> {
    try {
      const url = RNSB.getBackendUrl("/api/start-session");
      const res = await RNSB.fetchWithAuth(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        const error = await res.text();
        console.error("Error starting session:", error);
        return {
          value: undefined,
          error: { message: `Failed to start session: ${error}` },
        };
      }

      const data = await res.json();
      return {
        value: data.status as string,
        error: undefined,
      };
    } catch (error) {
      console.error("Error starting session:", error);
      return {
        value: undefined,
        error: { message: `Failed to start session: ${error}` },
      };
    }
  }

  private async _endHeygenSession(
    sessionId: string,
  ): Promise<AvatarResponse<string>> {
    try {
      const url = RNSB.getBackendUrl("/api/end-session");
      const res = await RNSB.fetchWithAuth(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        const error = await res.text();
        console.error("Error ending session:", error);
        return {
          value: undefined,
          error: { message: `Failed to end session: ${error}` },
        };
      }

      const data = await res.json();
      return {
        value: data.status as string,
        error: undefined,
      };
    } catch (error) {
      console.error("Error ending session:", error);
      return {
        value: undefined,
        error: { message: `Failed to start session: ${error}` },
      };
    }
  }

  private async _connectToHeygenStream(
    url: string,
    accessToken: string,
    sessionId: string,
    on: StreamCallbacks,
  ) {
    this._room = new Room();

    this._room.on("trackSubscribed", (track, publication, participant) => {
      on.event("trackSubscribed");

      track.start();
      on.streamStart(track, publication, participant);
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this._room.on("trackPublished", (publication, participant) => {
      on.event("trackPublished");

      // console.log("publication: ", publication, "participant: ", participant);
    });

    this._room.on(
      "trackSubscriptionFailed",
      (trackSid, participant, reason) => {
        on.event("trackSubscriptionFailed");

        console.error("Stream subscription failed", reason);
        on.failed(trackSid, participant, reason);
      },
    );

    this._room.on("connected", () => {
      on.event("connected");

      console.log("Connected to LiveKit room");
      on.connect();
    });

    this._room.on("reconnecting", () => {
      on.event("reconnecting");

      console.log("Reconnecting to LiveKit room");
      on.reconnecting("stream");
    });

    this._room.on("connectionStateChanged", (state) => {
      on.event("connectionStateChanged");
      if (state === "disconnected") {
        on.disconnect("disconnected");
      }
      console.log("Connection to LiveKit room changed");
      on.connectionStateChanged(state);
    });

    this._room.on("signalReconnecting", () => {
      on.event("signalReconnecting");

      console.log("Reconnecting to LiveKit room");
      on.reconnecting("signal");
    });

    this._room.on("reconnected", () => {
      on.event("reconnected");

      console.log("Reconnected to LiveKit room");
      on.connect();
    });

    this._room.on("trackUnsubscribed", (track, publication, participant) => {
      on.event("trackUnsubscribed");

      console.log("Stream track unsubscribed", track.source);
      this._endHeygenSession(sessionId);
      on.disconnect("trackUnsubscribed", track, publication, participant);
    });

    this._room.on("trackUnpublished", (publication, participant) => {
      on.event("trackUnpublished");

      console.log(
        "Stream unpublished: ",
        publication,
        "for participant: ",
        participant,
      );
      this._endHeygenSession(sessionId);
      on.disconnect("trackUnpublished", undefined, publication, participant);
    });

    this._room.on("disconnected", () => {
      on.event("disconnected");

      console.log("Stream disconnected");
      this._endHeygenSession(sessionId);
      on.disconnect("disconnected");
    });

    this._room.on("mediaDevicesChanged", () => {
      on.event("mediaDevicesChanged");

      console.log("Media device changed");
    });

    this._room.on("participantConnected", (p) => {
      on.event("participantConnected");

      console.log("Participant connected", p);
    });

    this._room.on("participantDisconnected", (p) => {
      on.event("participantDisconnected");

      console.log("Participant disconnected", p);
    });

    this._room.on("trackMuted", (p) => {
      on.event("trackMuted");

      console.log("Track muted", p.source);
    });

    this._room.on("trackUnmuted", (p) => {
      on.event("trackUnmuted");

      console.log("Track unmuted", p.source);
    });

    this._room.on("localTrackPublished", (p) => {
      on.event("localTrackPublished");

      console.log("local Track Published", p);
    });

    this._room.on("localTrackUnpublished", (p) => {
      on.event("localTrackUnpublished");

      console.log("local Track Unpublished", p);
    });

    this._room.on("localAudioSilenceDetected", (p) => {
      on.event("localAudioSilenceDetected");

      console.log("local Audio Silence Detected", p);
    });

    this._room.on("participantMetadataChanged", (meta, p) => {
      on.event("participantMetadataChanged");

      console.log("Metadata changed for: ", p);
      console.log("Metadata: ", meta);
    });

    this._room.on("participantMetadataChanged", (meta, p) => {
      on.event("participantMetadataChanged");

      console.log("Metadata changed for: ", p);
      console.log("Metadata: ", meta);
    });

    this._room.on("participantNameChanged", (name, p) => {
      on.event("participantNameChanged");

      console.log("Name changed for: ", p);
      console.log("Name: ", name);
    });

    this._room.on("participantAttributesChanged", (attr, p) => {
      on.event("participantAttributesChanged");

      console.log("Attribute changed for: ", p);
      console.log("Attribute: ", attr);
    });

    this._room.on("participantAttributesChanged", (attr, p) => {
      on.event("participantAttributesChanged");

      console.log("Attribute changed for: ", p);
      console.log("Attribute: ", attr);
    });

    this._room.on("activeSpeakersChanged", (speakers) => {
      on.event("activeSpeakersChanged");

      console.log("Active speakers changed:", speakers);
    });

    this._room.on("roomMetadataChanged", (metadata) => {
      on.event("roomMetadataChanged");

      console.log("Room metadata changed:", metadata);
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this._room.on("dataReceived", (payload, participant, kind, topic) => {
      on.event("dataReceived");
      const decoder = new TextDecoder("utf-8");
      const decodedString = decoder.decode(payload);
      const decodedPayload = JSON.parse(decodedString);
      if (decodedPayload.type === "avatar_talking_message") {
        on.speechStart();
      } else if (decodedPayload.type === "avatar_stop_message") {
        const endL = this._listeners.find((l) => {
          l.eventData.type === "speakEnd";
        });
        const endLCallback = endL?.eventData.callback as
          | ((data: AvatarEventSpeechEndData) => void)
          | undefined;
        endLCallback?.({
          task_id: decodedPayload.task_id as string,
          duration_ms: decodedPayload.duration_ms as number,
        });
      }
      console.log("DATA RECEIVED", "Payload:", decodedString);
    });

    this._room.on(
      "transcriptionReceived",
      (transcription, participant, publication) => {
        console.log("Transcription received:", transcription);
        console.log("From participant:", participant);
        console.log("Track publication:", publication);
      },
    );

    this._room.on("connectionQualityChanged", (quality, participant) => {
      on.event("connectionQualityChanged");

      console.log("Connection quality changed for:", participant.identity);
      console.log("New quality:", quality);
    });

    this._room.on("mediaDevicesError", (error) => {
      on.event("mediaDevicesError");

      console.error("Media devices error:", error);
    });

    this._room.on(
      "trackStreamStateChanged",
      (publication, streamState, participant) => {
        console.log("Track stream state changed:", streamState);
        console.log("For publication:", publication);
        console.log("Participant:", participant);
      },
    );

    this._room.on(
      "trackSubscriptionPermissionChanged",
      (publication, status, participant) => {
        console.log("Track subscription permission changed:", status);
        console.log("Publication:", publication.source);
        console.log("Participant:", participant.identity);
      },
    );

    this._room.on(
      "trackSubscriptionStatusChanged",
      (publication, status, participant) => {
        console.log("Track subscription status changed:", status);
        console.log("Publication:", publication.source);
        console.log("Participant:", participant.identity);
      },
    );

    this._room.on("audioPlaybackChanged", (playing) => {
      on.event("audioPlaybackChanged");

      console.log("Audio playback changed. Playing:", playing);
    });

    this._room.on("videoPlaybackChanged", (playing) => {
      on.event("videoPlaybackChanged");

      console.log("Video playback changed. Playing:", playing);
    });

    this._room.on("signalConnected", () => {
      on.event("signalConnected");

      console.log("Signal connected.");
    });

    this._room.on("recordingStatusChanged", (recording) => {
      on.event("recordingStatusChanged");

      console.log("Recording status changed. Recording:", recording);
    });

    this._room.on(
      "participantEncryptionStatusChanged",
      (encrypted, participant) => {
        console.log(
          "Participant encryption status changed. Encrypted:",
          encrypted,
        );
        console.log("Participant:", participant);
      },
    );

    this._room.on("encryptionError", (error) => {
      on.event("encryptionError");

      console.error("Encryption error:", error);
    });

    this._room.on("dcBufferStatusChanged", (isLow, kind) => {
      on.event("dcBufferStatusChanged");

      console.log("DataChannel buffer status changed. Is low:", isLow);
      console.log("Kind:", kind);
    });

    this._room.on("activeDeviceChanged", (kind, deviceId) => {
      on.event("activeDeviceChanged");

      console.log("Active device changed. Kind:", kind, "Device ID:", deviceId);
    });

    this._room.on("chatMessage", (message, participant) => {
      on.event("chatMessage");

      console.log("Chat message received:", message);
      console.log("From participant:", participant);
    });

    this._room.on("localTrackSubscribed", (publication, participant) => {
      on.event("localTrackSubscribed");

      console.log("Local track subscribed:", publication);
      console.log("Participant:", participant);
    });

    await this._room.connect(url, accessToken);
  }

  async init(
    withVoiceChat: boolean,
    voiceChatProvider: "openai" | "google",
    on: StreamCallbacks,
  ) {
    const accessData = await this._fetchAccessToken();
    if (accessData.error) {
      return accessData;
    }
    this._sessionId = accessData.value.session_id;

    const startStatus = await this._startHeygenSession(
      accessData.value.session_id,
    );
    if (startStatus.error) {
      return startStatus;
    }

    await this._connectToHeygenStream(
      accessData.value.url,
      accessData.value.access_token,
      accessData.value.session_id,
      on,
    );
    if (withVoiceChat) {
      this.startVoiceChat(
        { inputTranscript: on.inputTranscript, interrupt: on.interrupt },
        voiceChatProvider,
      );
    } else {
      this.on("initialOnInputTranscipt", {
        type: "inputTranscript",
        callback: (data) =>
          on.inputTranscript(data.text, data.isChunk, data.isFinal),
      });
      this.on("initialOnInterrupt", {
        type: "interrupt",
        callback: (data) => on.interrupt(data.text, data.isChunk, data.isFinal),
      });
    }
  }

  async destroy() {
    if (this._sessionId) {
      await this._endHeygenSession(this._sessionId);
    }

    if (this._room) {
      await this._room?.disconnect();
    }
    this._googleVoiceChatManager.closeVoiceChat();
    this._openAIVoiceChatManager.closeVoiceChat();
    this._listeners = [];
  }

  private _listeners: {
    id: string;
    eventData: EventData;
  }[] = [];

  hasListener(id: string) {
    const l = this._listeners.find((l) => l.id === id);
    return !!l;
  }

  on(id: string, eventData: EventData) {
    this._listeners.push({ id: id, eventData: eventData });
    this._room?.on("dataReceived", (payload, participant, kind, topic) => {
      const decoder = new TextDecoder("utf-8");
      const decodedString = decoder.decode(payload);
      const decodedPayload = JSON.parse(decodedString);
      if (
        decodedPayload.type === "avatar_stop_talking" ||
        (decodedPayload.type === "avatar_stop_message" &&
          eventData.type === "speakEnd")
      ) {
        (eventData.callback as (data: AvatarEventSpeechEndData) => void)({
          task_id: decodedPayload.task_id as string,
          duration_ms: decodedPayload.duration_ms as number,
        });
      }
    });
  }

  off(id: string) {
    this._listeners = this._listeners.filter((e) => e.id !== id);
  }

  async getResponse(text: string, task_type: TaskType = TaskType.REPEAT) {
    return (
      await this._geminiResponseManager._getResponse(
        text,
        "text",
        task_type,
        () => true,
      )
    ).value;
  }

  /**
   * Handles speech tasks by either repeating the given text or generating a response to it.
   *
   * @param text - The input text to speak or respond to.
   * @param task_type - TaskType.REPEAT to repeat the text, or TaskType.SPEAK to generate a spoken response.
   * @returns The result of the speech task.
   */
  async speak({
    text,
    taskType = TaskType.REPEAT,
  }: {
    text: string;
    taskType?: TaskType;
  }) {
    const onSpeakStart = (
      taskResponse: Awaited<
        ReturnType<typeof this._heygenSpeechManager._sendTask>
      >,
      text: string,
    ) => {
      this._listeners.forEach((listener) => {
        if (listener.eventData.type === "speakStart") {
          listener.eventData.callback({
            duration_ms: taskResponse.value!.duration_ms,
            task_id: taskResponse.value!.task_id,
            text: text,
          });
        }
      });
    };
    let talkResponse;
    if (taskType === TaskType.TALK) {
      talkResponse = await this._talkManager.talk(
        { text: text },
        "text",
        this._sessionId!,
        () => true,
        onSpeakStart,
        this._userId,
      );
      return {
        ...talkResponse,
        state: "final",
        source: "text",
        value: text,
      };
    }

    const response = await this._heygenSpeechManager._speak(
      { text: text },
      "text",
      this._sessionId!,
      () => true,
      onSpeakStart,
    );
    return response;
  }

  async startVoiceChat(
    on?: {
      inputTranscript?: StreamCallbacks["inputTranscript"];
      interrupt?: StreamCallbacks["interrupt"];
    },
    provider: "google" | "openai" = "google",
    task_type: TaskType = TaskType.REPEAT,
  ) {
    const onInputTranscript = (
      text: string,
      isChunk: boolean,
      isFinal: boolean,
    ) => {
      this._listeners.forEach((listener) => {
        if (listener.eventData.type === "inputTranscript") {
          listener.eventData.callback({
            text: text,
            isChunk: isChunk,
            isFinal: isFinal,
          });
        }
      });
      on?.inputTranscript?.(text, isChunk, isFinal);
    };
    const onInterrupt = (text: string, isChunk: boolean, isFinal: boolean) => {
      this._listeners.forEach((listener) => {
        if (listener.eventData.type === "interrupt") {
          listener.eventData.callback({
            text: text,
            isChunk: isChunk,
            isFinal: isFinal,
          });
        }
      });
      on?.interrupt?.(text, isChunk, isFinal);
    };

    const onSpeakStart = (
      taskResponse: Awaited<ReturnType<HeygenSpeechManager["_sendTask"]>>,
      text: string,
    ) => {
      this._listeners.forEach((listener) => {
        if (listener.eventData.type === "speakStart") {
          listener.eventData.callback({
            duration_ms: taskResponse.value!.duration_ms,
            task_id: taskResponse.value!.task_id,
            text: text,
          });
        }
      });
    };
    if (provider === "google") {
      this._googleVoiceChatManager.startVoiceChat(
        {
          inputTranscript: onInputTranscript,
          interrupt: onInterrupt,
          avatarStartTalking: onSpeakStart,
        },
        this._sessionId!,
        task_type,
      );
    } else {
      this._openAIVoiceChatManager.startVoiceChat(
        {
          inputTranscript: onInputTranscript,
          interrupt: onInterrupt,
          avatarStartTalking: onSpeakStart,
        },
        this._sessionId!,
      );
    }
  }

  async closeVoiceChat(provider: "google" | "openai" = "google") {
    if (provider === "google") {
      await this._googleVoiceChatManager.closeVoiceChat();
    } else {
      await this._openAIVoiceChatManager.closeVoiceChat();
    }
  }

  async muteInputAudio(provider: "google" | "openai" = "google") {
    if (provider === "google") {
      await this._googleVoiceChatManager.muteInputAudio();
    } else {
      await this._openAIVoiceChatManager.muteInputAudio();
    }
  }

  async unmuteInputAudio(provider: "google" | "openai" = "google") {
    if (provider === "google") {
      await this._googleVoiceChatManager.unmuteInputAudio();
    } else {
      await this._openAIVoiceChatManager.unmuteInputAudio();
    }
  }

  async interrupt(): Promise<AvatarResponse<string>> {
    return await this._heygenSpeechManager.interrupt(this._sessionId!);
  }
}
