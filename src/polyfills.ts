import { getRandomValues as expoGetRandomValues } from "expo-crypto";
import { Buffer } from "buffer";
import { Platform } from "react-native";
import ungapStructuredClone from "@ungap/structured-clone";
import {
  TextEncoderStream as SdTextEncoderStream,
  TextDecoderStream as SdTextDecoderStream,
} from "@stardazed/streams-text-encoding";

global.Buffer = Buffer;

// getRandomValues polyfill
class Crypto {
  getRandomValues = expoGetRandomValues;
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new Crypto();

if (Platform.OS !== "web") {
  (async () => {
    try {
      if (typeof global.structuredClone === "undefined") {
        global.structuredClone =
          ungapStructuredClone as typeof global.structuredClone;
      }

      global.TextEncoderStream = SdTextEncoderStream;
      global.TextDecoderStream = SdTextDecoderStream;
    } catch (error) {
      console.warn("Failed to apply native polyfills:", error);
    }
  })();
}

(() => {
  if (typeof crypto === "undefined") {
    Object.defineProperty(window, "crypto", {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    });
  }
})();
