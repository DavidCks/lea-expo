//LeaStream.tsx
// import LEAChatInput from "./LEAChatInput";
// import LEAChatHeader from "./LEAHeader";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useMutation,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import LEAChatInput from "./LEAChatInput";
import LEAChat from "./LEAChat";
import { Avatar, AvatarEventSpeechEndData } from "@/src/lib/avatar/avatar";
import { chatModeNotifier } from "@/src/screens/lea/state/chatMode";
import { RNSB } from "@/src/controllers/supabase";
import { leaMessagesNotifier } from "../state/leaMessages";
import InteractiveAvatar from "@/src/lib/avatar/InteractiveAvatar";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Pressable,
} from "react-native";
import { registerGlobals } from "@livekit/react-native";
import { useNavigation } from "@react-navigation/native";
import { color } from "@/src/colors";
import Animated, { useSharedValue } from "react-native-reanimated";
import { smooth } from "@components/animated/fade-in";
import Credits from "@components/top-bar/credits";
import SidebarMenu from "@/src/lib/avatar/SidebarMenu";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/src/navigators/AppNavigator";
import ExpoPip from "expo-pip";
import { cn } from "@/src/utils/cn";
import { Fullscreen, Info } from "lucide-react-native";
import { Button } from "react-native-paper";
// import Credits from "./Credits";
// import BuyMoreCredits from "./BuyCredits";

const queryClient = new QueryClient();
registerGlobals();

const LeaStream = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LeaImpl />
    </QueryClientProvider>
  );
};

const LeaImpl = () => {
  const navigation = useNavigation();
  const chatOpacity = useSharedValue(100);
  const avatar = useRef<Avatar | null>(null);
  const sessionDataInterval = useRef<NodeJS.Timeout | null>(null);
  const [isOutOfCredits, setIsOutOfCredits] = useState<boolean>(false);
  const colorScheme = useColorScheme();
  const userMutation = useMutation({
    mutationFn: RNSB.getCurrentUser,
  });
  const userWallets = useMutation({
    mutationFn: RNSB.getCurrentUserWalletsData,
  });
  const { isInPipMode } = ExpoPip.useIsInPip();
  const addMessage = leaMessagesNotifier((s) => s.addValue);
  const updateLastOrAddRemoteValue = leaMessagesNotifier(
    (s) => s.updateLastOrAddRemoteValue,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAvatarActive, setIsAvatarActive] = useState<boolean>(false);

  const handleSessionEnd = () => {
    setIsAvatarActive(false);
    if (sessionDataInterval.current) {
      clearInterval(sessionDataInterval.current);
    }
    resetMessages();
  };
  const resetMessages = leaMessagesNotifier((s) => s.resetValue);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTextSubmit = (text: string) => {
    chatOpacity.value = smooth(1, 33);
    addMessage(text, true, Date.now().toString());
  };

  const handleLoadAvatar = useCallback(
    (newAvatar: Avatar) => {
      console.log("[LeaStream] handling new avatar...");
      avatar.current = newAvatar;
      console.log("[LeaStream] setting speak start setter...");
      avatar.current.on("speakStart", {
        type: "speakStart",
        callback: async (data) => {
          const now = Date.now().toString();
          updateLastOrAddRemoteValue(data.text!, now, (_oldMessage, oldId) => {
            const oldTimestamp = parseInt(oldId);
            const newTimestamp = parseInt(now);
            const overrideMessage = newTimestamp - oldTimestamp < 2000;
            return overrideMessage;
          });
          chatOpacity.value = smooth(1, 33);
        },
      });

      console.log("[LeaStream] setting speak end setter...");
      avatar.current.on("chatSpeakMessageEnd", {
        type: "speakEnd",
        callback: function (data: AvatarEventSpeechEndData): void {
          chatOpacity.value = smooth(0, 33);
        },
      });

      console.log("[LeaStream] resetting messages...");
      resetMessages();

      console.log("[LeaStream] setting active...");
      setIsAvatarActive(true);

      if (
        userMutation.isIdle ||
        userMutation.isPending ||
        userMutation.isError ||
        !userMutation.data ||
        userWallets.isIdle ||
        userWallets.isPending ||
        userWallets.isError ||
        !userWallets.data
      ) {
        console.error(
          "The avatar has loaded, but *the user mutation is not set up!*",
        );
        return;
      }
      if (sessionDataInterval.current) {
        clearInterval(sessionDataInterval.current);
      }

      console.log("[LeaStream] updating credits for staring a session...");
      RNSB.updateCredits((oldCredits) => {
        return oldCredits + RNSB.config.credits.perSession;
      });

      sessionDataInterval.current = setInterval(async () => {
        RNSB.updateCredits((oldCredits) => {
          return (
            oldCredits +
            RNSB.config.credits.perMS * RNSB.config.credits.updateIntervalMS
          );
        });
      }, RNSB.config.credits.updateIntervalMS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userMutation, userWallets, userWallets.data],
  );

  useEffect(() => {
    userMutation.mutate();
    userWallets.mutate();
    return () => {
      if (sessionDataInterval.current) {
        clearInterval(sessionDataInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsOutOfCredits(
      parseInt(userWallets.data?.userWalletsData.credits || "0") <= 0,
    );

    return () => {};
  }, [userWallets.data, userWallets]);

  if (userMutation.isIdle || userMutation.isPending) {
    return (
      <View className="flex-1 justify-center items-center">
        <View className="items-center gap-4">
          <View
            style={{
              backgroundColor: color.darkPurple,
            }}
            className="w-24 h-24 rounded-full"
          ></View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "500",
              color: colorScheme === "dark" ? "white" : "black",
            }}
          >
            Logging in...
          </Text>
        </View>
      </View>
    );
  } else if (userMutation.isError || !userMutation.data) {
    return (
      <View className="flex-1 items-center justify-center flex-col">
        <View
          style={{
            backgroundColor: "#faa",
          }}
          className="max-w-4/5 rounded-xl"
        >
          <Text className="font-black text-xl">
            Uh-oh, you&apos;re not logged in
          </Text>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("SignIn");
            }}
            style={{
              backgroundColor: "#A15C92",
            }}
            className="px-8 py-6 rounded-sm"
          >
            <Text className="font-bold">Log in to continue</Text>
          </TouchableOpacity>
          {userMutation.error && (
            <View className="w-full">
              <TouchableOpacity
                style={{
                  paddingBottom: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: "#E5E7EB",
                }}
              >
                <Text className="font-xl">What went wrong?</Text>
              </TouchableOpacity>
              <View
                style={{
                  backgroundColor: "#F9FAFB",
                }}
                className=""
              >
                <Text>Error: {`${userMutation.error.name}`}</Text>
                <Text>Description: {`${userMutation.error.message}`}</Text>
                <Text>Cause?: {String(`${userMutation.error.cause}`)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      className="dark:bg-black bg-white"
      style={{
        flex: 1,
        flexDirection: "column",
        paddingHorizontal: 0,
        overflow: "hidden",
      }}
    >
      {/* <TopBarWalletMenu /> */}
      <View className="flex-col-reverse relative flex-1">
        <View className="top-4 absolute left-6">
          {!isInPipMode && (
            <SidebarMenu
              navigation={
                navigation as NativeStackNavigationProp<RootStackParamList>
              }
            />
          )}
        </View>
        <View className="top-4 absolute right-6">
          <Credits />
        </View>
        {/* Chat Panel - Bottom on mobile, left on desktop */}
        <View
          style={{ opacity: isInPipMode ? 0 : 1 }}
          className="absolute w-full h-1/4 top-14 flex-col z-10"
        >
          <View className="h-full overflow-hidden w-full">
            <View className="w-full rounded-4xl flex-col h-full">
              <Animated.View
                style={{
                  height: "100%",
                  opacity: chatOpacity,
                }}
              >
                {/* <LEAChat avatar={avatar} showStartMessage={!isOutOfCredits} /> */}
                <LEAChat avatar={avatar} showStartMessage={false} />
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Chat Input */}
        <View
          style={{ opacity: isInPipMode ? 0 : 1 }}
          className={cn("absolute w-full h-1/8 bottom-0 flex-col z-10")}
        >
          <LEAChatInput
            avatar={avatar}
            onTextSubmit={handleTextSubmit}
            isActive={isAvatarActive && !isOutOfCredits}
            onSessionEnd={handleSessionEnd}
          />
        </View>
        {/* Header */}
        {/* <LEAChatHeader
          className="lg:hidden fixed z-50 w-2/3 md:w-1/3 right-0 flex justify-end pr-5"
          leading={<Credits type="mobile" />}
        /> */}
        {isOutOfCredits ? (
          <View className="flex-1 items-center justify-center overflow-hidden">
            {/* Mobile view */}
            <View
              style={{
                backgroundColor: colorScheme === "dark" ? "black" : "#1F2937",
              }}
              className="w-full h-full"
            >
              <View className="w-full h-full items-center justify-center">
                <View
                  style={{
                    backgroundColor:
                      colorScheme === "dark" ? "black" : "#1F2937",
                  }}
                  className="max-w-4/5"
                >
                  <Text className="text-center p-4 rounded-full  text-white text-2xl font-bold">
                    You&apos;re out of credits for today.
                    {/* <BuyMoreCredits /> */}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View
              style={{
                backgroundColor:
                  colorScheme === "dark" ? "rgb(1,0,1)" : "rgb(251,250,251)",
              }}
              className="w-full h-full items-center justify-center"
            >
              <View className="w-full max-w-full h-full overflow-hidden">
                <InteractiveAvatar
                  onLoad={(a) => {
                    handleLoadAvatar(a);
                  }}
                  onSessionEnd={handleSessionEnd}
                  userId={userMutation.data.id}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default LeaStream;
