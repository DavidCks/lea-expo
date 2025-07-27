import { LogInPageType } from "@components/sign-in/auth-types";
import { SignInController } from "./SignInController";
import { User } from "@supabase/supabase-js";
import { useNavigation } from "@react-navigation/native";

export const signInConfig = {
  afterSignIn: (user: User, navigate: (screen: string) => void) => {
    if (user.user_metadata["name"] && user.user_metadata["age"]) {
      navigate("Lea");
    } else {
      SignInController.type.set(LogInPageType.Details);
      navigate("Home");
    }
  },
} as const;
