import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { leaMessagesNotifier } from "../state/leaMessages";
import { chatModeNotifier } from "../state/chatMode";
import Markdown from "react-native-markdown-display";
import { color } from "@/src/colors";
import { BlurView } from "expo-blur";
import FadeIn from "@components/animated/fade-in";
import { Avatar, AvatarEventSpeechEndData } from "@/src/lib/avatar/avatar";

const LEAChat = ({
  avatar,
  showStartMessage = true,
}: {
  avatar: MutableRefObject<Avatar | null>;
  showStartMessage: boolean;
}) => {
  const messages = leaMessagesNotifier((s) => s.value);
  const chatMode = chatModeNotifier((s) => s.value);
  const colorScheme = useColorScheme();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (messages.length === 0 && showStartMessage) {
    return (
      <View style={styles.startMessageContainer}>
        <View className="py-6 px-12 flex gap-2">
          <Text
            className="text-center font-extrabold text-2xl"
            style={{
              color: color.lightPink,
            }}
          >
            Welcome !
          </Text>
          <Text className="text-md text-center dark:text-white/80 text-black/80">
            Start a session to get started!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[
        styles.chatContainer,
        chatMode ? styles.chatVisible : styles.chatHidden,
      ]}
      contentContainerStyle={styles.chatContentContainer}
    >
      {messages
        .sort((a, b) => a.timestampMs - b.timestampMs)
        .map((message) => (
          <BlurView
            key={message.timestampMs}
            intensity={10000}
            tint={colorScheme === "dark" ? "dark" : "light"} // or "light" | "default"
            style={{
              borderRadius: 24,
              overflow: "hidden",
              padding: 12,
              margin: 6,
              backgroundColor: "rgba(255,255,255,0.5)",
              alignSelf: message.isUser ? "flex-end" : "flex-start",
            }}
          >
            <Markdown
              style={{
                body: {
                  color: colorScheme === "dark" ? "white" : "black",
                  fontSize: 18,
                },
              }}
            >
              {message.message}
            </Markdown>
          </BlurView>
        ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  startMessageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  startMessageBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(161, 92, 146, 0.1)",
    maxWidth: 300,
  },
  startMessageTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#a15c92",
    textAlign: "center",
  },
  startMessageText: {
    color: "#374151",
    fontSize: 14,
    textAlign: "center",
  },
  chatContainer: {},
  chatVisible: {
    height: 128,
    opacity: 1,
  },
  chatHidden: {
    overflow: "hidden",
    height: 1,
    opacity: 0,
  },
  chatContentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    borderRadius: 24,
    overflow: "hidden",
    padding: 12,
  },
  botMessage: {
    alignSelf: "flex-start",
  },
});

export default LEAChat;
