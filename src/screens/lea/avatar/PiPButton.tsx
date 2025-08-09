import { PlayerController } from "@/src/lib/avatar/PlayerController";
import { cn } from "@/src/utils/cn";
import ExpoPip from "expo-pip";
import { Minimize2 } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";

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
                width: 200,
                height: 300,
                seamlessResizeEnabled: false,
                sourceRectHint: {
                  top: 0,
                  right: 200,
                  bottom: 300,
                  left: 0,
                },
              };
              ExpoPip.setPictureInPictureParams(params);
              setTimeout(() => {
                PlayerController.set({
                  pipWidth: "100%",
                  pipHeight: "100%",
                  keyboardVisible: false,
                  isInPipMode: true,
                });
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
