const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer.minifierConfig = {
  compress: false,
  mangle: false,
};

module.exports = wrapWithReanimatedMetroConfig(
  withNativeWind(config, { input: "./src/global.css" }),
);
