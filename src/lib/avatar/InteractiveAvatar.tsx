//InteractiveAvatar.tsx
import {
  ConnectionState,
  RemoteAudioTrack,
  RemoteTrack,
  Track,
} from "livekit-client";
import { Keyboard, KeyboardEvent } from "react-native";

import { useEffect, useRef, useState, useCallback } from "react";

import { AVATARS } from "@/src/lib/avatar/constants";
import { chatModeNotifier } from "@/src/screens/lea/state/chatMode";
import { Avatar, TaskType } from "@/src/lib/avatar/avatar";
import { RoomEventCallbacks } from "@/src/lib/avatar/types";
import { languages } from "@/src/lib/avatar/languages";
import { useColorScheme, View, Text, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-paper";
import {
  AndroidAudioTypePresets,
  AudioSession,
  TrackReference,
  VideoTrack,
} from "@livekit/react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import { smooth } from "@components/animated/fade-in";
import { RNSB } from "@/src/controllers/supabase";
export default function InteractiveAvatar({
  onLoad,
  onSessionEnd,
  userId,
}: {
  onLoad: (avatar: Avatar) => void;
  onSessionEnd?: () => void;
  userId: string;
}) {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const resolvedTheme = useColorScheme();
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const colorScheme = useColorScheme();

  // Use resolvedTheme for more accurate theme detection
  const isDarkTheme = resolvedTheme === "dark";

  const chatMode = chatModeNotifier((s) => s.value);
  const avatar = useRef<Avatar | null>(null);
  const audioTrackRef = useRef<
    (TrackReference & { track: RemoteTrack }) | null
  >(null);
  const videoTrackRef = useRef<
    (TrackReference & { track: RemoteTrack }) | null
  >(null);
  const mediaStreamRef = useRef<{
    video: TrackReference & { track: RemoteTrack };
    audio: (TrackReference & { track: RemoteTrack }) | null;
  } | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      await AudioSession.startAudioSession();
      AudioSession.configureAudio({
        android: { audioTypeOptions: AndroidAudioTypePresets.media },
      });
    };

    setupAudio();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  // Automatically determine which avatar to use based on the theme
  const getAvatarId = () => {
    return isDarkTheme
      ? AVATARS[1].avatar_id // black background for dark theme
      : AVATARS[0].avatar_id; // white background for light theme
  };

  // Effect to handle the progress animation
  useEffect(() => {
    if (isLoadingSession && !isSessionActive) {
      // Reset progress when loading starts
      setLoadingProgress(0);

      // Create interval to increment progress to 90% over 10 seconds
      const incrementAmount = 90 / (10 * 10); // 10 seconds, update 10 times per second
      loadingIntervalRef.current = setInterval(() => {
        setLoadingProgress((prev) => {
          const next = prev + incrementAmount;
          // Don't exceed 90% during this phase
          return next > 90 ? 90 : next;
        });
      }, 100);

      // Slow progress after reaching 90%
      setTimeout(() => {
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current);

          // Continue with slower intervals until session starts
          loadingIntervalRef.current = setInterval(() => {
            setLoadingProgress((prev) => {
              const next = prev + 0.1; // Very slow increment
              return next > 99 ? 99 : next; // Never quite reach 100% until loaded
            });
          }, 200);
        }
      }, 10000);
    }

    if (isSessionActive && loadingIntervalRef.current) {
      // When session is active, clear interval and set progress to 100%
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
      setLoadingProgress(100);
    }

    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    };
  }, [isLoadingSession, isSessionActive]);

  const startStream = useCallback(
    async (langIn: string, langOut: string) => {
      setIsLoadingSession(true);
      const selectedAvatarId = getAvatarId();
      console.log("AVATAR", `using avatar with ID ${selectedAvatarId}.`);
      const langInObj = Object.values(languages).find(
        (v) => v.bcp47 === langIn,
      );
      if (!langInObj) {
        console.error("AVATAR", "provided langIn was not a bcp47 string");
        setIsLoadingSession(false);
        return;
      }
      console.log("AVATAR", `using input language ${langInObj.bcp47}.`);
      const langCodeIn = langInObj.code;
      const greeting = langInObj.greeting;
      avatar.current = new Avatar(
        selectedAvatarId,
        langIn,
        langOut,
        langCodeIn,
        userId,
      );
      console.log("AVATAR", "initializing...");
      const res = await avatar.current.init(!chatMode, "openai", {
        connect: () => {
          // setIsLoadingSession(false);
          // setIsSessionActive(true);
          console.log("ROOM", "connected");
        },
        disconnect: () => {
          setIsSessionActive(false);
          // toast("Lea disconnected.");
          if (onSessionEnd) onSessionEnd();
        },
        failed: () => {
          setIsSessionActive(false);
          console.error("Something went wrong. Try again later.");
          if (onSessionEnd) onSessionEnd();
        },
        streamStart: (track: RemoteTrack, publication, participant) => {
          if (track.kind === Track.Kind.Video) {
            // toast("Video stream started");
            videoTrackRef.current = {
              track,
              publication,
              participant,
              source: track.source,
            };
          } else if (track.kind === Track.Kind.Audio) {
            // toast("Audio stream started");
            audioTrackRef.current = {
              track,
              publication,
              participant,
              source: track.source,
            };
          }

          if (videoTrackRef.current) {
            // toast("Setting media stream...");
            mediaStreamRef.current = {
              video: videoTrackRef.current,
              audio: audioTrackRef.current,
            };

            if (!mediaStreamRef.current) {
              console.error(`Media stream was ${mediaStreamRef.current}!`);
            } else {
              setIsLoadingSession(false);
              setIsSessionActive(true);
            }
          } else {
            console.log("Waiting for video stream...");
          }
        },
        connectionStateChanged: function (_state: ConnectionState): void {
          console.log(_state);
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        reconnecting: function (_source: "signal" | "stream"): void {
          throw new Error("Function not implemented.");
        },
        event: function (_eventType: keyof RoomEventCallbacks): void {
          console.log("ROOM", _eventType);
          // toast(`Triggered ${eventType}`);
        },
        speechStart: function (): void {
          audioTrackRef.current?.track.setMuted(false);
          console.log("AUDIO", "stream unmuted");
        },
        inputTranscript: function (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _text: string,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _isChunk: boolean,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _isFinal: boolean,
        ): void {},
        interrupt: function (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _text: string,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _isChunk: boolean,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _isFinal: boolean,
        ): void {
          setTimeout(() => audioTrackRef.current?.track.setMuted(true), 50);
          console.log("AUDIO", "stream muted");
        },
      });
      console.log("AVATAR", "initialized.");

      if (res?.error) {
        console.error(res.error);
        Alert.alert(res.error.message);
      } else {
        await avatar.current.speak({ text: greeting, taskType: TaskType.TALK });
        onLoad(avatar.current);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDarkTheme],
  ); // Use isDarkTheme as dependency

  useEffect(() => {
    RNSB.on((tables, state) => {
      if (tables.includes("user_wallets") && state.userWalletsData !== null) {
        const credits = parseInt(state.userWalletsData.credits);
        if (credits <= 0 && avatar.current) {
          avatar.current.destroy();
        }
      }
    });
    return () => {
      if (avatar.current) {
        avatar.current.destroy();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.absoluteContainer]}>
        {isSessionActive ? (
          <View style={styles.videoContainer}>
            <View style={styles.videoInnerContainer}>
              {mediaStreamRef.current && (
                <Player mediaSource={mediaStreamRef.current} />
              )}
            </View>
          </View>
        ) : isLoadingSession ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingInnerContainer}>
              <Text style={styles.loadingText}>Loading session...</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[styles.progressBar, { width: `${loadingProgress}%` }]}
                ></View>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View className="w-full justify-center items-center h-full">
              <Button
                mode="contained"
                style={{
                  backgroundColor: colorScheme === "dark" ? "white" : "black",
                }}
                onPress={() => startStream("en-GB", "en-GB")}
              >
                <Text className="text-white dark:text-black">
                  Start Session
                </Text>
              </Button>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  absoluteContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 0,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  videoInnerContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingInnerContainer: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    marginBottom: 8,
    color: "black",
  },
  progressBarContainer: {
    width: 256,
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 0,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#A15C92",
    borderRadius: 0,
  },
  startSessionContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

const Player = ({
  mediaSource,
}: {
  mediaSource: {
    video: TrackReference & { track: RemoteTrack };
    audio: (TrackReference & { track: RemoteTrack }) | null;
  };
}) => {
  // useEffect(() => {
  //   if (mediaSource.audio) {
  //     mediaSource.audio.track.start();
  //     mediaSource.audio.track.setMuted(false);
  //   }
  //   return () => {
  //     if (mediaSource.audio) {
  //       mediaSource.audio.track.setMuted(true);
  //       mediaSource.audio.track.stop();
  //     }
  //   };
  // }, [mediaSource.audio]);
  const videoOpacity = useSharedValue(0);

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      videoOpacity.value = smooth(1, 33);
    }, 500);
  }, []);

  return (
    <Animated.View
      style={{
        opacity: videoOpacity,
      }}
      className="h-full w-full flex-1 flex-col-reverse"
    >
      <VideoTrack
        trackRef={mediaSource.video}
        style={{
          display: "flex",
          height: keyboardVisible ? "100%" : "76%",
          width: "100%",
          paddingBottom: 100,
        }}
      />
    </Animated.View>
  );
};

const playerStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
  },
  video: {
    width: 350,
    height: 275,
  },
});
