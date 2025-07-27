import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Menu, X } from "lucide-react-native";
import { Portal } from "react-native-paper";
import { TopBarWalletMenu } from "@components/top-bar/top-bar-ui";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/src/navigators/AppNavigator";
import { smooth } from "@components/animated/fade-in";
import { RNSB } from "@/src/controllers/supabase";

export default function SidebarMenu({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const [isVisible, setIsVisible] = useState(false); // controls render
  const colorScheme = useColorScheme();
  const sidebarWidth = useSharedValue(0);
  const sidebarBackdropOpacity = useSharedValue(0);

  const openSidebar = () => {
    setIsVisible(true);
    sidebarWidth.value = smooth(256, 3);
    sidebarBackdropOpacity.value = smooth(1, 3);
  };

  const closeSidebar = () => {
    sidebarWidth.value = smooth(0, 33);
    sidebarBackdropOpacity.value = smooth(0, 3);

    // Delay unmount until animation finishes
    setTimeout(() => {
      runOnJS(setIsVisible)(false);
    }, 300);
  };

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity className="z-50" onPress={openSidebar}>
        <Menu size={28} color={colorScheme === "dark" ? "#fff" : "#000"} />
      </TouchableOpacity>

      {/* Always rendered when visible, animates in/out */}
      <Portal>
        {isVisible && (
          <>
            {/* Backdrop */}
            <Animated.View
              className="absolute inset-0 bg-black/40 z-40"
              style={{ opacity: sidebarBackdropOpacity }}
              onTouchEnd={closeSidebar}
            />

            {/* Sidebar */}
            <Animated.View
              style={{
                width: sidebarWidth,
                opacity: sidebarBackdropOpacity,
              }}
              className="absolute left-0 top-0 h-full bg-white dark:bg-black z-50 p-6 shadow-lg overflow-hidden"
            >
              <Animated.View
                style={{
                  opacity: sidebarBackdropOpacity,
                }}
                className="flex-row justify-between items-center mb-4"
              >
                <TouchableOpacity onPress={closeSidebar}>
                  <X
                    size={28}
                    color={colorScheme === "dark" ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
                <TopBarWalletMenu navigation={navigation} />
              </Animated.View>

              <View className="overflow-hidden">
                {/* <Text
                  numberOfLines={1}
                  style={{
                    color: colorScheme === "dark" ? "#fff" : "#000",
                  }}
                  ellipsizeMode="clip"
                  className="mb-2"
                >
                  HomeHomeHomeHomeHomeHomeHomeHome
                </Text>
                <Text
                  style={{
                    color: colorScheme === "dark" ? "#fff" : "#000",
                  }}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                  className="mb-2"
                >
                  ProfileProfileProfileProfile
                </Text>
                <Text
                  style={{
                    color: colorScheme === "dark" ? "#fff" : "#000",
                  }}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                  className="mb-2"
                >
                  SettingsSettingsSettings
                </Text> */}
                <TouchableOpacity
                  onPress={async () => {
                    await RNSB.signOut();
                    closeSidebar();
                    navigation.navigate("Home");
                  }}
                >
                  <Text
                    style={{
                      color: colorScheme === "dark" ? "#fff" : "#000",
                    }}
                    numberOfLines={1}
                    ellipsizeMode="clip"
                    className="mb-2"
                  >
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        )}
      </Portal>
    </>
  );
}
