import { color } from "@/src/colors";
import FadeIn from "@components/animated/fade-in";
import { LogInPageType } from "@components/sign-in/auth-types";
import LEAGradient from "@components/styled-container/LEAGradient";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { Button } from "react-native-paper";
import { SignInImpl } from "./SignInImpl";

const SignInSelection = ({
  onTypeSelected,
  initialType,
}: {
  onTypeSelected: (type: LogInPageType) => void;
  initialType?: LogInPageType;
}) => {
  const dimensions = useWindowDimensions();
  const [type, setType] = useState<LogInPageType | null>(null);

  if (type || initialType) {
    return <SignInImpl initialType={(type ?? initialType)!} />;
  }

  return (
    <>
      <Text
        style={{
          paddingBlock: dimensions.height / 10,
          fontSize: dimensions.width / 16,
        }}
        className="text-3xl flex-1 text-center flex justify-self-center font-bold text-white"
      >
        Welcome !
      </Text>
      <Button
        onPress={() => {
          onTypeSelected(LogInPageType.LogIn);
          setType(LogInPageType.LogIn);
        }}
        style={{
          backgroundColor: color.fadedPink,
          padding: 12,
          marginInline: 36,
          marginBlock: 12,
        }}
      >
        <Text
          style={{
            fontSize: dimensions.width / 20,
            lineHeight: dimensions.width / 14,
          }}
          className=" text-black font-bold"
        >
          Login
        </Text>
      </Button>
      <Button
        onPress={() => {
          onTypeSelected(LogInPageType.SignUp);
          setType(LogInPageType.SignUp);
        }}
        style={{
          padding: 12,
          backgroundColor: color.grape,
          marginInline: 36,
          marginBlock: 12,
          borderColor: color.darkPurple,
          borderWidth: 2,
        }}
      >
        <Text
          style={{
            fontSize: dimensions.width / 20,
            lineHeight: dimensions.width / 14,
          }}
          className=" text-white font-bold"
        >
          Sign Up
        </Text>
      </Button>
    </>
  );
};

export default SignInSelection;
