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

const LEALogoBase = ({
  className,
  mode,
}: {
  className?: string;
  mode: "square" | "inline";
}) => {
  const navigation = useNavigation();
  const dimensions = useWindowDimensions();
  const colorScheme = useColorScheme(); // 'light' or 'dark'
  const squareImgWidth = 4;
  const inlineImgWidth = 10;
  const imageWidth = useSharedValue(dimensions.height / inlineImgWidth);
  const textTranslateX = useSharedValue(0);
  const textTranslateY = useSharedValue(0);
  const containerTranslateX = useSharedValue(0);
  const containerTranslateY = useSharedValue(0);
  const containerHeight = useSharedValue(96);
  const fontSize = useSharedValue(24);
  const lineHeight = useSharedValue(1);
  const textPaddingBlock = useSharedValue(0);
  const textMarginTop = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === "square") {
        const sqw = dimensions.height / squareImgWidth;
        imageWidth.value = smooth(sqw, 300);
        textTranslateX.value = smooth(
          (-dimensions.width * dimensions.width) /
            (250 * Math.sqrt(dimensions.width)),
          300,
        );
        textTranslateY.value = smooth(-sqw - dimensions.height / 60, 300);
        containerHeight.value = smooth(sqw * 2, 300);
        fontSize.value = smooth((sqw * Math.sqrt(dimensions.width)) / 70, 300);
        lineHeight.value = smooth(
          (sqw * Math.sqrt(dimensions.width)) / 50,
          300,
        );
        containerTranslateX.value = smooth(dimensions.width / 2 - sqw / 2, 300);
        containerTranslateY.value = smooth(-64, 300);
        textPaddingBlock.value = smooth(
          (sqw * dimensions.width) / 350 / 4.6,
          300,
        );
        textMarginTop.value = smooth(sqw / 5, 300);
      } else {
        const ilw = dimensions.height / inlineImgWidth;
        imageWidth.value = smooth(ilw, 300);
        textTranslateX.value = smooth(ilw, 300);
        textTranslateY.value = smooth(-64, 300);
        containerHeight.value = smooth(96, 300);
        fontSize.value = smooth(24, 300);
        lineHeight.value = smooth(24, 300);
        textPaddingBlock.value = smooth(0, 300);
        containerTranslateX.value = smooth(0, 300);
        containerTranslateY.value = smooth(0, 300);
        textMarginTop.value = smooth(0, 300);
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [mode]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: containerTranslateX,
        top: containerTranslateY,
        // transform: [{ translateX: -containerHeight / 2 }],
        // translateX: containerTranslateX,
        height: containerHeight,
      }}
      className={cn("", className)}
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
          position: "relative",
          fontFamily: fonts.rajdhaniMedium.fontFamily,
          marginTop: textMarginTop,
          left: textTranslateX,
          top: textTranslateY,
          fontSize: fontSize,
          paddingTop: textPaddingBlock,
          paddingBottom: textPaddingBlock,
          lineHeight: lineHeight,
        }}
      >
        LEA LABS
      </Animated.Text>
    </Animated.View>
  );
};

const LEALogo = LEALogoBase;
Object.assign(LEALogo, {
  sqw: 4,
  iw: 10,
});
export default LEALogo;
