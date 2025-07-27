/* eslint-disable @typescript-eslint/no-require-imports */
import * as Font from "expo-font";
import { FontSource } from "expo-font";

export const fonts = {
  inter: {
    fontFamily: "Inter",
    file: require("@fonts/inter.ttf"),
  },
  notoSerif: {
    fontFamily: "NotoSerif",
    file: require("@fonts/noto-serif.ttf"),
  },
  rajdhaniMedium: {
    fontFamily: "Rajdhani-Medium",
    file: require("@fonts/rajdhani-500.ttf"),
  },
  rajdhaniSemiBold: {
    fontFamily: "Rajdhani-SemiBold",
    file: require("@fonts/rajdhani-600.ttf"),
  },
} as const;

export const customFonts: Record<string, FontSource> = Object.fromEntries(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(fonts).map(([_, { fontFamily, file }]) => [fontFamily, file]),
);

export const loadCustomFonts = async () => {
  await Font.loadAsync(customFonts);
};

export type Fonts = typeof fonts;
export type FontFamily = Fonts[keyof Fonts]["fontFamily"];
