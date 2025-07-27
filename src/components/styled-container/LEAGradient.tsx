import { color } from "@/src/colors";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

const LEAGradient = ({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) => {
  return (
    <LinearGradient
      className={className}
      style={style}
      colors={[color.darkPurple, color.lightPink]}
    >
      {children}
    </LinearGradient>
  );
};

export default LEAGradient;
