import { Button } from "react-native-paper";
import { Text } from "react-native";
import { SignInController } from "../SignInController";
import { GoogleSignInController } from "./GoogleSignInController";
import { alertAndLog } from "@/src/utils/alertAndLog";
import { useNavigation } from "@react-navigation/native";
import { LogInPageType } from "@components/sign-in/auth-types";
import { signInConfig } from "../SignInConfig";
import { cn } from "@/src/utils/cn";

const GoogleSignInButton = ({
  initialType,
}: {
  initialType: LogInPageType;
}) => {
  const type = SignInController.use("type");
  const loading = SignInController.use("loading");
  const googleLoading = GoogleSignInController.use("loading");
  const hasAcceptedTos = SignInController.use("hasAcceptedTos");
  const navigation = useNavigation();

  const handleGoogleSignIn = async () => {
    const result = await GoogleSignInController.signIn();
    if (result.error) {
      alertAndLog("Error", result.error);
      return;
    }
    signInConfig.afterSignIn(result.value!, navigation.navigate);
  };

  const isDisabled =
    ((type ?? initialType) === LogInPageType.SignUp && !hasAcceptedTos) ||
    loading;
  return (
    <Button
      mode="outlined"
      onPress={handleGoogleSignIn}
      icon="google"
      style={{
        marginInline: 48,
        opacity: isDisabled ? 0.8 : 1,
        backgroundColor: isDisabled ? "#444" : "black",
        marginBottom: 16,
      }}
      loading={googleLoading}
      disabled={isDisabled}
    >
      <Text
        style={{
          fontWeight: "bold",
          color: isDisabled ? "#99a1aa" : "white",
        }}
      >
        Sign in with Google
      </Text>
    </Button>
  );
};

export default GoogleSignInButton;
