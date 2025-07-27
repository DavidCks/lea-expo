//types.ts
import {
  ChatMessage,
  ConnectionQuality,
  ConnectionState,
  DataPacket_Kind,
  DisconnectReason,
  LocalParticipant,
  LocalTrackPublication,
  Participant,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  SubscriptionError,
  Track,
  TrackPublication,
  TranscriptionSegment,
} from "livekit-client";

export type RoomEventCallbacks = {
  connected: () => void;
  reconnecting: () => void;
  signalReconnecting: () => void;
  reconnected: () => void;
  disconnected: (reason?: DisconnectReason) => void;
  connectionStateChanged: (state: ConnectionState) => void;
  mediaDevicesChanged: () => void;
  participantConnected: (participant: RemoteParticipant) => void;
  participantDisconnected: (participant: RemoteParticipant) => void;
  trackPublished: (
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => void;
  trackSubscribed: (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => void;
  trackSubscriptionFailed: (
    trackSid: string,
    participant: RemoteParticipant,
    reason?: SubscriptionError
  ) => void;
  trackUnpublished: (
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => void;
  trackUnsubscribed: (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => void;
  trackMuted: (publication: TrackPublication, participant: Participant) => void;
  trackUnmuted: (
    publication: TrackPublication,
    participant: Participant
  ) => void;
  localTrackPublished: (
    publication: LocalTrackPublication,
    participant: LocalParticipant
  ) => void;
  localTrackUnpublished: (
    publication: LocalTrackPublication,
    participant: LocalParticipant
  ) => void;
  localAudioSilenceDetected: (publication: LocalTrackPublication) => void;
  participantMetadataChanged: (
    metadata: string | undefined,
    participant: RemoteParticipant | LocalParticipant
  ) => void;
  participantNameChanged: (
    name: string,
    participant: RemoteParticipant | LocalParticipant
  ) => void;
  participantAttributesChanged: (
    changedAttributes: Record<string, string>,
    participant: RemoteParticipant | LocalParticipant
  ) => void;
  activeSpeakersChanged: (speakers: Array<Participant>) => void;
  roomMetadataChanged: (metadata: string) => void;
  dataReceived: (
    payload: Uint8Array,
    participant?: RemoteParticipant,
    kind?: DataPacket_Kind,
    topic?: string
  ) => void;
  transcriptionReceived: (
    transcription: TranscriptionSegment[],
    participant?: Participant,
    publication?: TrackPublication
  ) => void;
  connectionQualityChanged: (
    quality: ConnectionQuality,
    participant: Participant
  ) => void;
  mediaDevicesError: (error: Error) => void;
  trackStreamStateChanged: (
    publication: RemoteTrackPublication,
    streamState: Track.StreamState,
    participant: RemoteParticipant
  ) => void;
  trackSubscriptionPermissionChanged: (
    publication: RemoteTrackPublication,
    status: TrackPublication.PermissionStatus,
    participant: RemoteParticipant
  ) => void;
  trackSubscriptionStatusChanged: (
    publication: RemoteTrackPublication,
    status: TrackPublication.SubscriptionStatus,
    participant: RemoteParticipant
  ) => void;
  audioPlaybackChanged: (playing: boolean) => void;
  videoPlaybackChanged: (playing: boolean) => void;
  signalConnected: () => void;
  recordingStatusChanged: (recording: boolean) => void;
  participantEncryptionStatusChanged: (
    encrypted: boolean,
    participant?: Participant
  ) => void;
  encryptionError: (error: Error) => void;
  dcBufferStatusChanged: (isLow: boolean, kind: DataPacket_Kind) => void;
  activeDeviceChanged: (kind: MediaDeviceKind, deviceId: string) => void;
  chatMessage: (
    message: ChatMessage,
    participant?: RemoteParticipant | LocalParticipant
  ) => void;
  localTrackSubscribed: (
    publication: LocalTrackPublication,
    participant: LocalParticipant
  ) => void;
};
