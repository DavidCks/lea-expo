import React, {
  useState,
  useEffect,
  useCallback,
  MutableRefObject,
} from "react";
import {
  AudioLines,
  Cross,
  Mic,
  MicOff,
  Minimize2,
  Send,
  X,
} from "lucide-react-native";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { chatModeNotifier } from "../state/chatMode";
import { micMutedNotifier } from "../state/micMuted";
import { characterTalkingNotifier as avatarTalkingNotifier } from "../state/characterTalking";
import { Avatar, TaskType } from "@/src/lib/avatar/avatar";
import { RNSB } from "@/src/controllers/supabase";
import ExpoPip from "expo-pip";
import { Button } from "react-native-paper";
import { cn } from "@/src/utils/cn";
import { PiPButton } from "./PiPButton";

const LEAChatInput = ({
  avatar,
  onTextSubmit,
  isActive = false,
  onSessionEnd,
}: {
  avatar: MutableRefObject<Avatar | null>;
  onTextSubmit?: (text: string) => void;
  isActive?: boolean;
  onSessionEnd?: () => void;
}) => {
  const chatMode = chatModeNotifier((s) => s.value);
  const colorScheme = useColorScheme();
  const setChatMode = chatModeNotifier((s) => s.setValue);
  const micMuted = micMutedNotifier((s) => s.value);
  const setMicMuted = micMutedNotifier((s) => s.setValue);
  const { isInPipMode } = ExpoPip.useIsInPip();
  const [inputHeight, setInputHeight] = useState(48); // start at base height

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const isAvatarTalking = avatarTalkingNotifier((s) => s.value);

  const handleSpeak = useCallback(
    async (inlineText?: string) => {
      setIsLoading(true);
      if (!avatar.current) {
        console.error("Avatar API not initialized");
        setIsLoading(false);
        return;
      }
      const nextText = inlineText ?? text;
      setText("");
      if (nextText.length === 0) {
        setIsLoading(false);
        return;
      }
      if (onTextSubmit) {
        onTextSubmit(nextText);
      }
      await avatar.current
        .speak({
          text: nextText,
          taskType: TaskType.TALK,
        })
        .catch((e) => {
          console.error(e.message);
        });
      setIsLoading(false);
    },
    [text, avatar, onTextSubmit],
  );

  async function handleInterrupt() {
    if (!avatar.current) {
      console.error("Avatar API not initialized");
      return;
    }
    await avatar.current.interrupt().catch((e) => {
      console.error(e.message);
    });
  }

  const handleMicMuted = useCallback(
    async (v: boolean) => {
      if (v) {
        console.log("disconnecting from voice chat...");
        await avatar.current?.closeVoiceChat(RNSB.config.voiceChatProvider);
      } else {
        console.log("connecting to voice chat...");
        await avatar.current?.startVoiceChat(
          {
            inputTranscript: async (transcript, isChunk, isFinal) => {
              if (isFinal) {
                console.log("[Lea Chat Input] FINAL CHUNK: ", transcript);
                if (onTextSubmit) {
                  onTextSubmit(transcript);
                }
              }
            },
          },
          RNSB.config.voiceChatProvider,
        );
      }
    },
    [avatar, onTextSubmit],
  );

  useEffect(() => {
    handleMicMuted(chatMode || micMuted);
    return () => {
      handleMicMuted(!(chatMode || micMuted));
    };
  }, [chatMode, micMuted]);

  if (isInPipMode) {
    return null;
  }

  return (
    <View
      className={cn("w-full")}
      style={{
        height: inputHeight + 32,
      }}
    >
      {chatMode ? (
        <View
          style={{
            backgroundColor:
              colorScheme === "dark" ? "rgb(1,0,1)" : "rgb(251,250,251)",
          }}
          className=" h-full"
        >
          <TextInput
            value={text}
            onChangeText={setText}
            onContentSizeChange={(e) => {
              const height = e.nativeEvent.contentSize.height;
              setInputHeight(Math.min(128, Math.max(16, height))); // prevent shrinking too small
            }}
            style={{
              textAlignVertical: "top",
              flex: 1,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingLeft: 16,
              paddingRight: 16,
              paddingBottom: 48,
            }}
            className="text-lg  text-black  bg-gray-200  dark:bg-neutral-800 dark:text-white"
            editable={!isLoading && isActive}
            placeholder={
              isActive
                ? "Say hello to Lea..."
                : "Waiting for Lea to be ready..."
            }
            placeholderTextColor="#9ca3af"
            multiline
          />
          <TouchableOpacity
            onPress={
              text === "" && isAvatarTalking && !isLoading
                ? () => handleInterrupt()
                : text !== "" && chatMode
                  ? () => handleSpeak()
                  : () => {
                      setChatMode(!chatMode);
                    }
            }
            className="absolute right-6 bottom-6"
            disabled={(isLoading && text === "") || !isActive}
          >
            {text === "" && chatMode ? (
              <AudioLines
                color={
                  (isLoading && text === "") || !isActive
                    ? "gray"
                    : colorScheme === "dark"
                      ? "white"
                      : "black"
                }
              />
            ) : (
              <Send color={colorScheme === "dark" ? "white" : "black"} />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.voiceControlContainer}>
          <TouchableOpacity
            onPress={() => setMicMuted(!micMuted)}
            style={[styles.micButton, micMuted && styles.micButtonMuted]}
          >
            <View>{micMuted ? <MicOff /> : <Mic />}</View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setChatMode(true)}
            style={styles.closeButton}
          >
            <View style={styles.closeButtonText}>
              <X color="black" />
            </View>
          </TouchableOpacity>
          <PiPButton />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  textInputContainer: {
    position: "relative",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 9999,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  textInput: {
    height: 50,
    paddingLeft: 16,
    paddingRight: 100,
    borderRadius: 9999,
    fontSize: 16,
  },
  sendButton: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -20 }],
    borderRadius: 9999,
    width: 80,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#a15c92",
  },
  sendButtonText: {
    color: "white",
  },
  voiceControlContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  micButton: {
    borderRadius: 9999,
    height: 48,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  micButtonMuted: {
    backgroundColor: "#f77",
    borderColor: "#faa",
    borderWidth: 1,
  },
  closeButton: {
    borderRadius: 9999,
    height: 48,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  closeButtonText: {
    justifyContent: "center",
    alignItems: "center",
    color: "white",
  },
});

export default LEAChatInput;
