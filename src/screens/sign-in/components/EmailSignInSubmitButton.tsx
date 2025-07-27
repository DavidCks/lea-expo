import { LogInPageType } from "@components/sign-in/auth-types";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { EmailSignInController } from "./EmailSignInController";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { SignInController } from "../SignInController";
import { styles } from "@/src/styles/styles";
import { signInConfig } from "../SignInConfig";
import { cn } from "@/src/utils/cn";

const EmailSignInSubmitButton = ({
  initialType,
}: {
  initialType: LogInPageType;
}) => {
  const type = SignInController.use("type");
  const navigation = useNavigation();
  const loading = SignInController.use("loading");
  const hasAcceptedTos = SignInController.use("hasAcceptedTos");
  const emailSignInLoading = EmailSignInController.use("loading");

  const handleSubmit = useCallback(async () => {
    const result = await EmailSignInController.submit(type ?? initialType);
    if (result.error) {
      return;
    }
    if ((type ?? initialType) === LogInPageType.SignUp) {
      navigation.navigate("OtpConfirm", {
        email: EmailSignInController.email.peek(),
        password: EmailSignInController.password.peek(),
      });
    } else {
      if (!result.value) {
        SignInController.state.message.set(
          "Something went wrong during signin. please try again",
        );
        return;
      }
      signInConfig.afterSignIn(result.value, navigation.navigate);
    }
  }, [navigation, type, initialType]);

  const isDisabled =
    emailSignInLoading ||
    loading ||
    ((type ?? initialType) === LogInPageType.SignUp && !hasAcceptedTos);
  return (
    <View className="pt-8">
      <Button
        mode="contained"
        onPress={() => handleSubmit()}
        loading={emailSignInLoading}
        disabled={isDisabled}
        style={{
          marginInline: 48,
          opacity: isDisabled ? 0.8 : 1,
          backgroundColor: isDisabled ? "#444" : "black",
        }}
      >
        <Text
          className={cn(
            "font-bold",
            isDisabled ? "text-gray-400" : "text-white",
          )}
        >
          {loading
            ? type === LogInPageType.LogIn
              ? "Logging in..."
              : "Signing up..."
            : type === LogInPageType.LogIn
              ? "Log in"
              : "Sign up"}
        </Text>
      </Button>
    </View>
  );
};

export default EmailSignInSubmitButton;
