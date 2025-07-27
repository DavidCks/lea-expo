import { Event, EventTarget } from "event-target-shim";
import RTCIceCandidateEvent from "@livekit/react-native-webrtc/lib/typescript/RTCIceCandidateEvent";
import RTCTrackEvent from "@livekit/react-native-webrtc/lib/typescript/RTCTrackEvent";
import { RTCPeerConnection as BaseRTCPeerConnection } from "@livekit/react-native-webrtc";
import BaseRTCDataChannel from "@livekit/react-native-webrtc/lib/typescript/RTCDataChannel";
import MessageEvent from "@livekit/react-native-webrtc/lib/typescript/MessageEvent";
import RTCDataChannelEvent from "@livekit/react-native-webrtc/lib/typescript/RTCDataChannelEvent";

// RTCPeerConnection

export type RTCPeerConnectionEventBaseMap = {
  connectionstatechange: Event<"connectionstatechange">;
  icecandidate: RTCIceCandidateEvent<"icecandidate">;
  icecandidateerror: RTCIceCandidateEvent<"icecandidateerror">;
  iceconnectionstatechange: Event<"iceconnectionstatechange">;
  icegatheringstatechange: Event<"icegatheringstatechange">;
  negotiationneeded: Event<"negotiationneeded">;
  signalingstatechange: Event<"signalingstatechange">;
  track: RTCTrackEvent<"track">;
  error: Event<"error">;
};

export type CustomRTCPeerConnectionEventMap = Record<
  keyof RTCPeerConnectionEventBaseMap,
  RTCPeerConnectionEventBaseMap[keyof RTCPeerConnectionEventBaseMap] &
    Event<string>
>;

export type CustomRTCPeerConnection = BaseRTCPeerConnection &
  EventTarget<CustomRTCPeerConnectionEventMap>;

// RTCDataChannel

export type RTCDataChannelEventBaseMap = {
  bufferedamountlow: RTCDataChannelEvent<"bufferedamountlow">;
  close: RTCDataChannelEvent<"close">;
  closing: RTCDataChannelEvent<"closing">;
  error: RTCDataChannelEvent<"error">;
  message: MessageEvent<"message">;
  open: RTCDataChannelEvent<"open">;
};

export type CustomDataChannelBaseEventMap = Record<
  keyof RTCDataChannelEventBaseMap,
  RTCDataChannelEventBaseMap[keyof RTCDataChannelEventBaseMap] & Event<string>
>;

export type CustomRTCDataChannel = BaseRTCDataChannel &
  EventTarget<CustomDataChannelBaseEventMap>;

// EventListenerCallbackParam

export type EventListenerCallbackParam<
  TEventMap extends Record<string, any>,
  TEventName extends keyof TEventMap,
> = TEventMap[TEventName];

type AllEventNames =
  | keyof RTCPeerConnectionEventBaseMap
  | keyof RTCDataChannelEventBaseMap;

export type RTCEventCallbackParam<TEventName extends AllEventNames> =
  // If it's in the PeerConnection map, pick that
  TEventName extends keyof RTCPeerConnectionEventBaseMap
    ? RTCPeerConnectionEventBaseMap[TEventName]
    : // Otherwise if it's in the DataChannel map, pick that
      TEventName extends keyof RTCDataChannelEventBaseMap
      ? RTCDataChannelEventBaseMap[TEventName]
      : never;
