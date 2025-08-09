import { PlayerController } from "@/src/lib/avatar/PlayerController";
import { cn } from "@/src/utils/cn";
import ExpoPip from "expo-pip";
import { Minimize2 } from "lucide-react-native";
import { useState } from "react";
import { Dimensions, View } from "react-native";
import { Button } from "react-native-paper";
import BackgroundTimer from "react-native-background-timer";

export function PiPButton({ className }: { className?: string }) {
  const { isInPipMode } = ExpoPip.useIsInPip();
  const [automaticEnterEnabled, setAutomaticEnterEnabled] = useState(false);

  if (isInPipMode) {
    return null;
  }

  return (
    <View className={cn("justify-center items-center", className)}>
      {
        <>
          <Button
            style={{
              borderRadius: 9999,
              height: 48,
              width: 48,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#eee",
              borderColor: "#ddd",
              borderWidth: 1,
            }}
            onPress={() => {
              const params = {
                width: 143,
                height: 213,
                seamlessResizeEnabled: false,
              };
              PlayerController.set({
                pipWidth: params.width,
                pipHeight: params.height,
                keyboardVisible: false,
                isInPipMode: true,
              });
              ExpoPip.setPictureInPictureParams(params);
              BackgroundTimer.setTimeout(() => {
                console.log("[PiPButton] updating player dimensions");
                PlayerController.set({
                  pipWidth: "100%",
                  pipHeight: "100%",
                });
              }, 2000);
              setTimeout(() => {
                ExpoPip.enterPipMode(params);
              }, 100);
            }}
          >
            <Minimize2 />
          </Button>
        </>
      }
    </View>
  );
}
