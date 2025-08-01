import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";

import { Section } from "@components/Section";
import { SignInFeature } from "@components/sign-in/sign-in-feature";
import LEALogo from "@components/logo/LEALogo";
import { RNSB } from "@/src/controllers/supabase";
import PagerView from "react-native-pager-view";

import { useNavigation } from "@react-navigation/native";
import PagerIndicator from "@components/ui/PagerIndicator";
import { User } from "@supabase/supabase-js";
import FadeIn, { smooth } from "@components/animated/fade-in";
import { fonts } from "@/src/utils/fonts";
import LEAGradient from "@components/styled-container/LEAGradient";
import { SignInScreen } from "@screens/sign-in/SignInScreen";
import { SignInImpl } from "@screens/sign-in/SignInImpl";
import { LogInPageType } from "@components/sign-in/auth-types";
import SignInSelection from "@screens/sign-in/SignInSelection";
import { SignInController } from "@screens/sign-in/SignInController";
import Animated, { useSharedValue } from "react-native-reanimated";

export function HomeScreen() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pagerViewRef = useRef<PagerView>(null);
  const navigation = useNavigation();
  const dimensions = useWindowDimensions();
  const paddingTop = useSharedValue((LEALogo as any).iw);
  const [user, setUser] = useState<User | null>();
  const [logoStyle, setLogoStyle] = useState<"square" | "inline">("inline");

  useEffect(() => {
    const checkSignInStatus = async () => {
      try {
        const user = await RNSB.getCurrentUser();
        setIsSignedIn(!!user?.id);
        if (!!user?.id) {
          setUser(user);
          if (user.user_metadata["name"] && user.user_metadata["age"]) {
            navigation.navigate("Lea");
          }
        }
      } catch (error) {
        console.error("Error checking sign-in status:", error);
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSignInStatus();
  }, [navigation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && user.user_metadata["name"] && user.user_metadata["age"]) {
        navigation.navigate("Lea");
      } else if (user) {
        SignInController.state.type.set(LogInPageType.Details);
        setTimeout(() => {
          pagerViewRef.current?.setPage(1);
        }, 66);
      } else {
        pagerViewRef.current?.setPage(1);
      }
    }, 4500);
    return () => {
      clearTimeout(timer);
    };
  }, [user]);

  return (
    <View className="flex-1">
      <View className="flex flex-row justify-between">
        <LEALogo mode={logoStyle} />
        <View className="absolute w-1/6 flex mb-12 right-4 top-14">
          <PagerIndicator pageCount={2} currentPage={currentPage} />
        </View>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#a15c92" />
      ) : (
        <Animated.View
          className="flex-1"
          style={{
            marginTop: paddingTop,
          }}
        >
          <PagerView
            ref={pagerViewRef}
            style={{
              flex: 1,
            }}
            initialPage={currentPage}
            onPageSelected={(page) => {
              console.log(
                "switched to pager",
                page.nativeEvent.position,
                "with user",
                user,
                "and type",
                SignInController.state.type.peek(),
              );
              if (
                (SignInController.state.type.peek() !== LogInPageType.Details ||
                  !user) &&
                page.nativeEvent.position === 1
              ) {
                paddingTop.value = smooth((LEALogo as any).sqw * 2, 300);
                setLogoStyle("square");
              } else {
                paddingTop.value = smooth((LEALogo as any).iw + 24, 300);
                setLogoStyle("inline");
              }
              setCurrentPage(page.nativeEvent.position);
            }}
          >
            <View className="justify-center items-center" key="1">
              <ScrollView>
                <View className="flex flex-col gap-16 pt-4">
                  <View className="flex flex-col gap-16 items-center justify-center p-4">
                    <FadeIn.fromTop>
                      {currentPage === 0 && (
                        <Text className="dark:text-white text-black text-xl text-center italic">
                          {user?.user_metadata["name"]
                            ? `Welcome ${user.user_metadata["name"]}!`
                            : "Welcome!"}
                        </Text>
                      )}
                    </FadeIn.fromTop>
                    <FadeIn.fromTop delay={1400}>
                      {currentPage === 0 && (
                        <Text
                          style={{
                            fontFamily: fonts.rajdhaniMedium.fontFamily,
                          }}
                          className="dark:text-white text-black text-3xl text-center"
                        >
                          <Text className="text-primary-indicator">Lea</Text>{" "}
                          here, your digital bestie. Let's talk!
                        </Text>
                      )}
                    </FadeIn.fromTop>
                  </View>
                  <FadeIn.fromBottom delay={1400}>
                    {currentPage === 0 && (
                      <LEAGradient
                        style={{
                          aspectRatio: 1032 / (1331 - 60),
                          borderTopLeftRadius: 48,
                          borderTopRightRadius: 48,
                        }}
                        className="w-full flex flex-col relative top-24"
                      >
                        <View className="flex-1 justify-center items-center relative">
                          <Image
                            // eslint-disable-next-line @typescript-eslint/no-require-imports
                            source={require("@images/thumbnail3.png")}
                            className="flex-1 w-full h-min relative -top-36"
                            resizeMode="center"
                            alt="Lealabs logo"
                          />
                        </View>
                      </LEAGradient>
                    )}
                  </FadeIn.fromBottom>
                </View>
              </ScrollView>
            </View>
            <View className="w-full flex-1 justify-center items-center" key="2">
              <ScrollView className="w-full h-full">
                <LEAGradient
                  className="w-full h-full flex-1"
                  style={{
                    minHeight: dimensions.height - 192 * 2 - 24,
                    paddingBottom: 192,
                    justifyContent: "center",
                    borderRadius: 48,
                  }}
                >
                  <FadeIn.opacity>
                    {currentPage === 1 && (
                      <SignInSelection
                        initialType={
                          user &&
                          !user.user_metadata["name"] &&
                          !user.user_metadata["age"]
                            ? LogInPageType.Details
                            : undefined
                        }
                        onTypeSelected={(type) => {
                          // SignInController.type.set(type);
                          SignInController.type.set(type);
                          paddingTop.value = smooth(
                            (LEALogo as any).iw + 24,
                            300,
                          );
                          setLogoStyle("inline");
                        }}
                      />
                    )}
                  </FadeIn.opacity>
                </LEAGradient>
              </ScrollView>
            </View>
          </PagerView>
        </Animated.View>
      )}
    </View>
  );
}
