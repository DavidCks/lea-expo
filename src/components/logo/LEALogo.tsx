import React, { useEffect } from "react";
import {
  Text,
  Image,
  StyleSheet,
  Pressable,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { fonts } from "../../utils/fonts";
import { cn } from "@/src/utils/cn";
import Animated, { useSharedValue } from "react-native-reanimated";
import { smooth } from "@components/animated/fade-in";

const LEALogo = ({
  className,
  mode,
}: {
  className?: string;
  mode: "square" | "inline";
}) => {
  const navigation = useNavigation();
  const dimensions = useWindowDimensions();
  const colorScheme = useColorScheme(); // 'light' or 'dark'
  const imageWidth = useSharedValue(64);
  const textTranslateX = useSharedValue(0);
  const textTranslateY = useSharedValue(0);
  const containerTranslateX = useSharedValue(0);
  const containerHeight = useSharedValue(96);
  const fontSize = useSharedValue(24);
  const textPaddingBlock = useSharedValue(0);
  const textMarginTop = useSharedValue(0);
  const squareImgWidth = 192;
  const inlineImgWidth = 64;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === "square") {
        imageWidth.value = smooth(squareImgWidth, 300);
        textTranslateX.value = smooth(-squareImgWidth * 1.1 - 2, 300);
        textTranslateY.value = smooth(squareImgWidth / 1.9, 300);
        containerHeight.value = smooth(squareImgWidth * 2, 300);
        fontSize.value = smooth(
          (squareImgWidth * dimensions.width) / 380 / 5,
          300,
        );
        containerTranslateX.value = smooth(
          (dimensions.width - squareImgWidth) / 1.8,
          300,
        );
        textPaddingBlock.value = smooth(
          (squareImgWidth * dimensions.width) / 350 / 5,
          300,
        );
        textMarginTop.value = smooth(squareImgWidth / 6, 300);
      } else {
        imageWidth.value = smooth(inlineImgWidth, 300);
        textTranslateX.value = smooth(0, 300);
        textTranslateY.value = smooth(0, 300);
        containerHeight.value = smooth(96, 300);
        fontSize.value = smooth(24, 300);
        textPaddingBlock.value = smooth(0, 300);
        containerTranslateX.value = smooth(0, 300);
        textMarginTop.value = smooth(0, 300);
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [mode]);

  return (
    <Animated.View
      style={{
        translateX: containerTranslateX,
      }}
      className={cn("flex flex-row items-center justify-left", className)}
    >
      <Animated.Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require("@images/LEALABSLOGO.png")}
        style={{
          tintColor: colorScheme === "dark" ? "#fff" : "#000",
          width: imageWidth,
          height: containerHeight,
        }}
        resizeMode="contain"
        alt="Lealabs logo"
      />

      <Animated.Text
        className="text-black dark:text-white opacity-90 text-xl"
        style={{
          fontFamily: fonts.rajdhaniMedium.fontFamily,
          marginTop: textMarginTop,
          translateX: textTranslateX,
          translateY: textTranslateY,
          fontSize: fontSize,
          paddingBlockStart: textPaddingBlock,
          paddingBlockEnd: textPaddingBlock,
        }}
      >
        LEA LABS
      </Animated.Text>
    </Animated.View>
  );
};

export default LEALogo;
