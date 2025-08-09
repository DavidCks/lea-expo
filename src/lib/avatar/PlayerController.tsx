import { withControllerHelpers } from "@/src/lib/cotroller-helpers";
import { observable, Observable } from "@legendapp/state";
import { use$ } from "@legendapp/state/react";
import ExpoPip from "expo-pip";
import { useEffect } from "react";
import { Dimensions, DimensionValue, useWindowDimensions } from "react-native";

type PlayerState = {
  pipWidth: DimensionValue;
  pipHeight: DimensionValue;
  keyboardVisible: boolean;
  isInPipMode: boolean;
};

class PlayerControllerBase {
  public static state: Observable<PlayerState> = observable<PlayerState>({
    pipHeight: 300,
    pipWidth: 200,
    keyboardVisible: false,
    isInPipMode: false,
  });

  public static useComputedSize() {
    const dimensions = useWindowDimensions();
    const keyboardVisible = use$(PlayerControllerBase.state.keyboardVisible);
    const isInPipMode = PlayerControllerBase.useIsInPip();
    const pipHeight = use$(PlayerControllerBase.state.pipHeight);
    const pipWidth = use$(PlayerControllerBase.state.pipWidth);
    const height = isInPipMode
      ? pipHeight
      : keyboardVisible
        ? ("100%" as DimensionValue)
        : (`${((640 / dimensions.height) * 100).toFixed(2)}%` as DimensionValue);
    const width = isInPipMode ? pipWidth : ("100%" as DimensionValue);
    return { height, width };
  }

  public static useIsInPip() {
    const { isInPipMode } = ExpoPip.useIsInPip();
    useEffect(() => {
      console.log("[PlayerController] -", "isInPipMode:", isInPipMode);
      PlayerControllerBase.state.isInPipMode.set(isInPipMode);
    }, [isInPipMode]);
    const internalIsInPipMode = use$(PlayerControllerBase.state.isInPipMode);
    return internalIsInPipMode;
  }

  public static set(state: Partial<PlayerState>) {
    PlayerControllerBase.state.set({ ...PlayerControllerBase.state, ...state });
  }
}

export const PlayerController = withControllerHelpers(PlayerControllerBase);
