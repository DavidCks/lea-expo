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
  private static singletons: {
    _avatarId: string;
    _sessionId?: string;
    _room?: Room;
    _googleVoiceChatManager: GoogleVoiceChatManager;
    _openAIVoiceChatManager: OpenAIVoiceChatManager;
    _geminiResponseManager: GeminiResponseManager;
    _heygenSpeechManager: HeygenSpeechManager;
    _talkManager: TalkManager;
    _userId: string;
    _listeners: {
      id: string;
      eventData: EventData;
    }[];
  } = {
    _avatarId: "", // set in constructor
    _room: undefined,
    _sessionId: undefined,
    _userId: "", // set in constructor
    _googleVoiceChatManager: {} as GoogleVoiceChatManager, // set in constructor
    _openAIVoiceChatManager: {} as OpenAIVoiceChatManager, // set in constructor
    _geminiResponseManager: {} as GeminiResponseManager, // set in constructor
    _heygenSpeechManager: {} as HeygenSpeechManager, // set in constructor
    _talkManager: {} as TalkManager, // set in constructor
    _listeners: [],
  };
  // _avatarId
  private get _avatarId() {
    return Avatar.singletons._avatarId;
  }
  private set _avatarId(newId: string) {
    Avatar.singletons._avatarId = newId;
  }

  // _sessionId
  private get _sessionId() {
    return Avatar.singletons._sessionId;
  }
  private set _sessionId(newSessionId: string | undefined) {
    Avatar.singletons._sessionId = newSessionId;
  }

  // _room
  private get _room() {
    return Avatar.singletons._room;
  }
  private set _room(newRoom: Room | undefined) {
    Avatar.singletons._room = newRoom;
  }

  // _googleVoiceChatManager
  private get _googleVoiceChatManager() {
    return Avatar.singletons._googleVoiceChatManager;
  }
  private set _googleVoiceChatManager(manager: GoogleVoiceChatManager) {
    Avatar.singletons._googleVoiceChatManager = manager;
  }

  // _openAIVoiceChatManager
  private get _openAIVoiceChatManager() {
    return Avatar.singletons._openAIVoiceChatManager;
  }
  private set _openAIVoiceChatManager(manager: OpenAIVoiceChatManager) {
    Avatar.singletons._openAIVoiceChatManager = manager;
  }

  // _geminiResponseManager
  private get _geminiResponseManager() {
    return Avatar.singletons._geminiResponseManager;
  }
  private set _geminiResponseManager(manager: GeminiResponseManager) {
    Avatar.singletons._geminiResponseManager = manager;
  }

  // _heygenSpeechManager
  private get _heygenSpeechManager() {
    return Avatar.singletons._heygenSpeechManager;
  }
  private set _heygenSpeechManager(manager: HeygenSpeechManager) {
    Avatar.singletons._heygenSpeechManager = manager;
  }

  // _talkManager
  private get _talkManager() {
    return Avatar.singletons._talkManager;
  }
  private set _talkManager(manager: TalkManager) {
    Avatar.singletons._talkManager = manager;
  }

  // _userId
  private get _userId() {
    return Avatar.singletons._userId;
  }
  private set _userId(newUserId: string) {
    Avatar.singletons._userId = newUserId;
  }

  // _listeners getter
  private get _listeners() {
    return Avatar.singletons._listeners;
  }

  // _listeners setter
  private set _listeners(newListeners: { id: string; eventData: EventData }[]) {
    Avatar.singletons._listeners = newListeners;
  }

  constructor(
    avatarId: string,
    langIn: string,
    langOut: string,
    langCodeIn: string,
    userId: string,
  ) {
    console.log("[avatar] AVATAR", "Constructing managers...");
    Avatar.singletons._avatarId = avatarId;
    console.log("[avatar]", "Constructing GeminiResponseManager...");
    Avatar.singletons._geminiResponseManager = new GeminiResponseManager(
      langOut,
    );
    console.log("[avatar]", "Constructing HeygenSpeechManager...");

    Avatar.singletons._heygenSpeechManager = new HeygenSpeechManager(langOut);
    console.log("[avatar]", "Constructing TalkManager...");
    Avatar.singletons._talkManager = new TalkManager(
      langOut,
      Avatar.singletons._heygenSpeechManager,
    );
    console.log("[avatar]", "Constructing OpenAIVoiceChatManager...");
    Avatar.singletons._openAIVoiceChatManager = new OpenAIVoiceChatManager(
      Avatar.singletons._geminiResponseManager,
      Avatar.singletons._heygenSpeechManager,
      Avatar.singletons._talkManager,
      langCodeIn,
      userId,
    );
    console.log("[avatar]", "Constructing GoogleVoiceChatManager...");
    Avatar.singletons._googleVoiceChatManager = new GoogleVoiceChatManager(
      Avatar.singletons._geminiResponseManager,
      Avatar.singletons._heygenSpeechManager,
      Avatar.singletons._talkManager,
      langIn,
    );
    Avatar.singletons._userId = userId;
    console.log("[avatar]", "Finished constructing managers.");
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

  private static async _endHeygenSession(
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

  private async _endHeygenSession(
    sessionId: string,
  ): Promise<AvatarResponse<string>> {
    return await Avatar._endHeygenSession(sessionId);
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

      // console.log("[avatar] publication: ", publication, "participant: ", participant);
    });

    this._room.on(
      "trackSubscriptionFailed",
      (trackSid, participant, reason) => {
        on.event("trackSubscriptionFailed");

        console.error("[avatar] Stream subscription failed", reason);
        on.failed(trackSid, participant, reason);
      },
    );

    this._room.on("connected", () => {
      on.event("connected");

      console.log("[avatar] Connected to LiveKit room");
      on.connect();
    });

    this._room.on("reconnecting", () => {
      on.event("reconnecting");

      console.log("[avatar] Reconnecting to LiveKit room");
      on.reconnecting("stream");
    });

    this._room.on("connectionStateChanged", (state) => {
      on.event("connectionStateChanged");
      if (state === "disconnected") {
        on.disconnect("disconnected");
      }
      console.log("[avatar] Connection to LiveKit room changed");
      on.connectionStateChanged(state);
    });

    this._room.on("signalReconnecting", () => {
      on.event("signalReconnecting");

      console.log("[avatar] Reconnecting to LiveKit room");
      on.reconnecting("signal");
    });

    this._room.on("reconnected", () => {
      on.event("reconnected");

      console.log("[avatar] Reconnected to LiveKit room");
      on.connect();
    });

    this._room.on("trackUnsubscribed", (track, publication, participant) => {
      on.event("trackUnsubscribed");

      console.log("[avatar] Stream track unsubscribed", track.source);
      this._endHeygenSession(sessionId);
      on.disconnect("trackUnsubscribed", track, publication, participant);
    });

    this._room.on("trackUnpublished", (publication, participant) => {
      on.event("trackUnpublished");

      console.log(
        "[avatar] Stream unpublished: ",
        publication,
        "for participant: ",
        participant,
      );
      this._endHeygenSession(sessionId);
      on.disconnect("trackUnpublished", undefined, publication, participant);
    });

    this._room.on("disconnected", () => {
      on.event("disconnected");

      console.log("[avatar] Stream disconnected");
      this._endHeygenSession(sessionId);
      on.disconnect("disconnected");
    });

    this._room.on("mediaDevicesChanged", () => {
      on.event("mediaDevicesChanged");

      console.log("[avatar] Media device changed");
    });

    this._room.on("participantConnected", (p) => {
      on.event("participantConnected");

      console.log("[avatar] Participant connected", p.identity);
    });

    this._room.on("participantDisconnected", (p) => {
      on.event("participantDisconnected");

      console.log("[avatar] Participant disconnected", p.identity);
    });

    this._room.on("trackMuted", (p) => {
      on.event("trackMuted");

      console.log("[avatar] Track muted", p.source);
    });

    this._room.on("trackUnmuted", (p) => {
      on.event("trackUnmuted");

      console.log("[avatar] Track unmuted", p.source);
    });

    this._room.on("localTrackPublished", (p) => {
      on.event("localTrackPublished");

      console.log("[avatar] local Track Published", p);
    });

    this._room.on("localTrackUnpublished", (p) => {
      on.event("localTrackUnpublished");

      console.log("[avatar] local Track Unpublished", p);
    });

    this._room.on("localAudioSilenceDetected", (p) => {
      on.event("localAudioSilenceDetected");

      console.log("[avatar] local Audio Silence Detected", p);
    });

    this._room.on("participantMetadataChanged", (meta, p) => {
      on.event("participantMetadataChanged");

      console.log("[avatar] Metadata changed for: ", p);
      console.log("[avatar] Metadata: ", meta);
    });

    this._room.on("participantMetadataChanged", (meta, p) => {
      on.event("participantMetadataChanged");

      console.log("[avatar] Metadata changed for: ", p);
      console.log("[avatar] Metadata: ", meta);
    });

    this._room.on("participantNameChanged", (name, p) => {
      on.event("participantNameChanged");

      console.log("[avatar] Name changed for: ", p);
      console.log("[avatar] Name: ", name);
    });

    this._room.on("participantAttributesChanged", (attr, p) => {
      on.event("participantAttributesChanged");

      console.log("[avatar] Attribute changed for: ", p);
      console.log("[avatar] Attribute: ", attr);
    });

    this._room.on("participantAttributesChanged", (attr, p) => {
      on.event("participantAttributesChanged");

      console.log("[avatar] Attribute changed for: ", p);
      console.log("[avatar] Attribute: ", attr);
    });

    this._room.on("activeSpeakersChanged", (speakers) => {
      on.event("activeSpeakersChanged");

      console.log(
        "[avatar] Active speakers changed:",
        speakers.length,
        speakers.map((s) => s.sid),
      );
    });

    this._room.on("roomMetadataChanged", (metadata) => {
      on.event("roomMetadataChanged");

      console.log("[avatar] Room metadata changed:", metadata);
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
      console.log("[avatar] DATA RECEIVED", "Payload:", decodedString);
    });

    this._room.on(
      "transcriptionReceived",
      (transcription, participant, publication) => {
        console.log("[avatar] Transcription received:", transcription);
        console.log("[avatar] From participant:", participant);
        console.log("[avatar] Track publication:", publication);
      },
    );

    this._room.on("connectionQualityChanged", (quality, participant) => {
      on.event("connectionQualityChanged");

      console.log(
        "[avatar] Connection quality changed for:",
        participant.identity,
      );
      console.log("[avatar] New quality:", quality);
    });

    this._room.on("mediaDevicesError", (error) => {
      on.event("mediaDevicesError");

      console.error("Media devices error:", error);
    });

    this._room.on(
      "trackStreamStateChanged",
      (publication, streamState, participant) => {
        console.log("[avatar] Track stream state changed:", streamState);
        console.log("[avatar] For publication:", publication);
        console.log("[avatar] Participant:", participant);
      },
    );

    this._room.on(
      "trackSubscriptionPermissionChanged",
      (publication, status, participant) => {
        console.log("[avatar] Track subscription permission changed:", status);
        console.log("[avatar] Publication:", publication.source);
        console.log("[avatar] Participant:", participant.identity);
      },
    );

    this._room.on(
      "trackSubscriptionStatusChanged",
      (publication, status, participant) => {
        console.log("[avatar] Track subscription status changed:", status);
        console.log("[avatar] Publication:", publication.source);
        console.log("[avatar] Participant:", participant.identity);
      },
    );

    this._room.on("audioPlaybackChanged", (playing) => {
      on.event("audioPlaybackChanged");

      console.log("[avatar] Audio playback changed. Playing:", playing);
    });

    this._room.on("videoPlaybackChanged", (playing) => {
      on.event("videoPlaybackChanged");

      console.log("[avatar] Video playback changed. Playing:", playing);
    });

    this._room.on("signalConnected", () => {
      on.event("signalConnected");

      console.log("[avatar] Signal connected.");
    });

    this._room.on("recordingStatusChanged", (recording) => {
      on.event("recordingStatusChanged");

      console.log("[avatar] Recording status changed. Recording:", recording);
    });

    this._room.on(
      "participantEncryptionStatusChanged",
      (encrypted, participant) => {
        console.log(
          "Participant encryption status changed. Encrypted:",
          encrypted,
        );
        console.log("[avatar] Participant:", participant);
      },
    );

    this._room.on("encryptionError", (error) => {
      on.event("encryptionError");

      console.error("Encryption error:", error);
    });

    this._room.on("dcBufferStatusChanged", (isLow, kind) => {
      on.event("dcBufferStatusChanged");

      console.log("[avatar] DataChannel buffer status changed. Is low:", isLow);
      console.log("[avatar] Kind:", kind);
    });

    this._room.on("activeDeviceChanged", (kind, deviceId) => {
      on.event("activeDeviceChanged");

      console.log(
        "[avatar] Active device changed. Kind:",
        kind,
        "Device ID:",
        deviceId,
      );
    });

    this._room.on("chatMessage", (message, participant) => {
      on.event("chatMessage");

      console.log("[avatar] Chat message received:", message);
      console.log("[avatar] From participant:", participant);
    });

    this._room.on("localTrackSubscribed", (publication, participant) => {
      on.event("localTrackSubscribed");

      console.log("[avatar] Local track subscribed:", publication);
      console.log("[avatar] Participant:", participant);
    });

    await this._room.connect(url, accessToken);
  }

  async init(
    withVoiceChat: boolean,
    voiceChatProvider: "openai" | "google",
    on: StreamCallbacks,
  ) {
    console.log("[avatar] fetching access token...");
    const accessData = await this._fetchAccessToken();
    if (accessData.error) {
      console.error("[avatar] failed to fetch access token!");
      return accessData;
    }
    this._sessionId = accessData.value.session_id;

    console.log("[avatar] starting session...");
    const startStatus = await this._startHeygenSession(
      accessData.value.session_id,
    );
    if (startStatus.error) {
      console.error("[avatar] failed to start session!");
      return startStatus;
    }

    console.log("[avatar] connecting to heygen stream...");
    try {
      await this._connectToHeygenStream(
        accessData.value.url,
        accessData.value.access_token,
        accessData.value.session_id,
        on,
      );
    } catch (e) {
      console.error("[avatar] failed connecting to heygen stream...");
      console.error(JSON.stringify(e));
      return;
    }
    if (withVoiceChat) {
      console.error(
        "[avatar] starting voice chat on init with provider",
        voiceChatProvider,
      );
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

  static async destroy() {
    console.log("[Avatar] Skipping if singletons are unset...");
    if (!Avatar.singletons) {
      return;
    }

    console.log("[Avatar] Checking if there is a session id...");
    if (Avatar.singletons._sessionId) {
      console.log("[Avatar] Stopping session...");
      await Avatar._endHeygenSession(Avatar.singletons._sessionId);
    }

    console.log("[Avatar] Checking if there is a room...");
    if (Avatar.singletons._room) {
      console.log("[Avatar] Disconnecting room...");
      await Avatar.singletons._room?.disconnect();
    }

    console.log("[Avatar] Checking if google voice chat manager exists...");
    if (
      Avatar.singletons._googleVoiceChatManager &&
      Object.hasOwn(Avatar.singletons._googleVoiceChatManager, "closeVoiceChat")
    ) {
      console.log("[Avatar] Disconnecting from google voice chat...");
      try {
        Avatar.singletons._googleVoiceChatManager.closeVoiceChat();
      } catch (e) {
        console.error("[Avatar] Failed to close google voice chat.");
        console.error("[Avatar]", JSON.stringify(e));
      }
    } else {
      console.log("[Avatar] Google voice chat not initialized.");
    }

    console.log("[Avatar] Checking if openai voice chat manager exists...");
    if (
      Avatar.singletons._openAIVoiceChatManager &&
      Object.hasOwn(Avatar.singletons._openAIVoiceChatManager, "closeVoiceChat")
    ) {
      console.log("[Avatar] Disconnecting from openai voice chat...");
      try {
        Avatar.singletons._openAIVoiceChatManager.closeVoiceChat();
      } catch (e) {
        console.error("[Avatar] Failed to close openai voice chat.");
        console.error("[Avatar]", JSON.stringify(e));
      }
    } else {
      console.log("[Avatar] OpenAI voice chat not initialized.");
    }
    console.log("[Avatar] resetting listeners...");
    Avatar.singletons._listeners = [];
  }

  async destroy() {
    return await Avatar.destroy();
  }

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
      console.log("[Avatar] performing talk request:", text);
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

    console.log("[Avatar] performing speak request:", text);
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
